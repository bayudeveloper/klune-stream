// ============================================
// KLUNE STREAM - Komik.js v3
// Scraper langsung ke komiku.org via CORS proxy
// Port dari komiku_scraper.py
// ============================================

const KOMIKU_BASE   = 'https://komiku.org';
const CORS_PROXIES  = [
  'https://api.allorigins.win/get?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];
const KOMIKU_CACHE  = new Map();
const KOMIKU_TTL    = 5 * 60 * 1000; // 5 menit

// ── CORS Fetch ──────────────────────────────────────────────────────────────
async function komikuFetch(path) {
  const url    = path.startsWith('http') ? path : KOMIKU_BASE + path;
  const cKey   = url;
  if (KOMIKU_CACHE.has(cKey)) {
    const { data, ts } = KOMIKU_CACHE.get(cKey);
    if (Date.now() - ts < KOMIKU_TTL) return data;
  }

  var html = null;
  for (var i = 0; i < CORS_PROXIES.length; i++) {
    try {
      var proxyUrl = CORS_PROXIES[i] + encodeURIComponent(url);
      var res = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) continue;
      var data = await res.json();
      // allorigins wraps in { contents }
      html = data.contents || data.body || data.data || (typeof data === 'string' ? data : null);
      if (html && html.length > 500) break;
    } catch(e) {
      console.warn('[komiku proxy fail]', CORS_PROXIES[i], e.message);
    }
  }

  if (!html) throw new Error('Semua proxy gagal untuk ' + url);
  KOMIKU_CACHE.set(cKey, { data: html, ts: Date.now() });
  return html;
}

// ── HTML Parsers (port dari Python) ─────────────────────────────────────────
function kClean(text) {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function kAbsUrl(href) {
  if (!href) return '';
  if (href.startsWith('http')) return href;
  return KOMIKU_BASE + (href.startsWith('/') ? href : '/' + href);
}

function kParseList(html) {
  var results = [];
  var seen    = new Set();

  // Pattern 1: /manga/ card dengan img alt (rekomendasi, populer)
  var re1 = /href="(\/manga\/[^"]+)"[^>]*>\s*<img[^>]*(?:src|data-src)="([^"]+)"[^>]*alt="([^"]*)"/g;
  var m;
  while ((m = re1.exec(html)) !== null) {
    var url   = kAbsUrl(m[1]);
    if (seen.has(url)) continue;
    seen.add(url);
    var title = m[3].replace(/^Baca\s+(?:Manga|Manhwa|Manhua|Komik)\s+/i, '').trim();
    results.push({ title, url, thumbnail: m[2], latest_chapter: '', type: 'Komik', _cat: 'komik' });
  }

  // Pattern 2: ls2/ls4j blocks
  var blockRe = /<div class="ls[24][jv]?"[^>]*>([\s\S]*?)<\/div>/g;
  while ((m = blockRe.exec(html)) !== null) {
    var block  = m[1];
    var urlM   = block.match(/href="(\/manga\/[^"]+|https:\/\/komiku\.org\/manga\/[^"]+)"/);
    var imgM   = block.match(/(?:src|data-src)="(https:\/\/[^"]+(?:thumbnail|komiku)[^"]+)"/);
    var titM   = block.match(/alt="([^"]+)"/);
    if (!titM) titM = block.match(/<a[^>]*>([^<]+)<\/a>/);
    var chM    = block.match(/Chapter\s+([\d.]+)/);
    if (!urlM || !titM) continue;
    var url    = kAbsUrl(urlM[1]);
    if (seen.has(url)) continue;
    seen.add(url);
    var title  = titM[1].replace(/^Baca\s+(?:Manga|Manhwa|Manhua|Komik)\s+/i, '').trim();
    results.push({
      title, url,
      thumbnail: imgM ? imgM[1] : '',
      latest_chapter: chM ? 'Chapter ' + chM[1] : '',
      type: 'Komik', _cat: 'komik',
    });
  }

  // Pattern 3: search results — href title=""
  var re3 = /href="(https:\/\/komiku\.org\/manga\/[^"]+)"[^>]*title="([^"]+)"/g;
  while ((m = re3.exec(html)) !== null) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    results.push({ title: m[2], url: m[1], thumbnail: '', latest_chapter: '', type: 'Komik', _cat: 'komik' });
  }

  return results;
}

function kParseMangaDetail(html, sourceUrl) {
  // Title
  var titleM = html.match(/<h1[^>]*>[\s\S]*?Komik\s+<span itemprop="name">([^<]+)/);
  if (!titleM) titleM = html.match(/itemprop="name"[^>]*>([^<]+)/);
  // Status, type, genres, etc
  var statusM  = html.match(/itemprop="creativeWorkStatus" content="([^"]+)"/);
  var genres   = [];
  var gRe      = /itemprop="genre" content="([^"]+)"/g;
  var gm;
  while ((gm = gRe.exec(html)) !== null) genres.push(gm[1]);
  var dateM    = html.match(/itemprop="datePublished" content="([^"]+)"/);
  var authorM  = html.match(/itemprop="name" content="([^"]+)"/);
  var modM     = html.match(/itemprop="dateModified" content="([^"]+)"/);
  var typeM    = html.match(/itemprop="additionalType" content="([^"]+)"/);
  // Cover
  var coverM   = html.match(/<img[^>]*itemprop="image"[^>]*src="([^"]+)"/);
  if (!coverM) coverM = html.match(/property="og:image" content="([^"]+)"/);
  // Alt title
  var altM     = html.match(/class="j2"[^>]*>([^<]+)/);
  // Synopsis
  var synopM   = html.match(/id="sinop"[^>]*>([\s\S]*?)<\/div>/);
  var synopsis = synopM ? kClean(synopM[1]) : '';
  // Rating
  var ratingM  = html.match(/itemprop="ratingValue"[^>]*>([^<]+)/);
  var rcountM  = html.match(/itemprop="ratingCount"[^>]*>([^<]+)/);

  // Chapters
  var chRe     = /href="(\/[^"]*-chapter-[\d\-]+\/?)"[^>]*>([^<]*)/g;
  var chapters = [];
  var chSeen   = new Set();
  var cm;
  while ((cm = chRe.exec(html)) !== null) {
    var href = cm[1];
    if (chSeen.has(href)) continue;
    chSeen.add(href);
    var numM = href.match(/chapter-([\d\-]+)\/?$/);
    var num  = numM ? numM[1].replace(/-/g, '.') : '?';
    var label = cm[2].trim() || ('Chapter ' + num);
    chapters.push({ number: parseFloat(num) || 0, numStr: num, label: label.slice(0, 60), url: kAbsUrl(href) });
  }
  chapters.sort(function(a, b) { return a.number - b.number; });

  return {
    _cat: 'komik',
    title: titleM ? titleM[1].trim() : '',
    alt_title: altM ? kClean(altM[1]) : '',
    url: sourceUrl,
    cover: coverM ? coverM[1] : '',
    author: authorM ? authorM[1] : 'N/A',
    status: statusM ? statusM[1] : 'N/A',
    type: typeM ? typeM[1] : 'Manga',
    genres: genres,
    synopsis: synopsis,
    date_published: dateM ? dateM[1] : '',
    date_modified: modM ? modM[1] : '',
    rating: ratingM ? ratingM[1].trim() : 'N/A',
    rating_count: rcountM ? rcountM[1].trim() : '',
    total_chapters: chapters.length,
    chapters: chapters,
  };
}

function kParseChapter(html, sourceUrl) {
  // Page title
  var titleM   = html.match(/<title>([^<]+)<\/title>/);
  var pageTitle = titleM ? titleM[1] : '';
  var mangaM   = pageTitle.match(/^(.+?)\s+Chapter\s+[\d.]+/);
  var mangaTitle = mangaM ? mangaM[1].trim() : pageTitle.replace(' - Komiku', '');
  var chNumM   = sourceUrl.match(/chapter-([\d\-]+)\/?$/);
  var chNum    = chNumM ? chNumM[1].replace(/-/g, '.') : '?';

  // Images — src="https://img.komiku.org/..."
  var images = [];
  var imgRe  = /src="(https:\/\/img\.komiku\.org\/[^"]+\.(?:webp|jpg|jpeg|png))"/g;
  var im;
  while ((im = imgRe.exec(html)) !== null) {
    if (!images.includes(im[1])) images.push(im[1]);
  }
  // Fallback: data-src
  if (!images.length) {
    var imgRe2 = /data-src="(https:\/\/img\.komiku\.org\/[^"]+\.(?:webp|jpg|jpeg|png))"/g;
    while ((im = imgRe2.exec(html)) !== null) {
      if (!images.includes(im[1])) images.push(im[1]);
    }
  }

  // Next/prev
  var nextM  = html.match(/rel="next"[^>]*href="([^"]+)"|href="([^"]+)"[^>]*rel="next"/);
  var prevM  = html.match(/rel="prev"[^>]*href="([^"]+)"|href="([^"]+)"[^>]*rel="prev"/);
  var nextUrl = nextM ? kAbsUrl(nextM[1] || nextM[2]) : '';
  var prevUrl = prevM ? kAbsUrl(prevM[1] || prevM[2]) : '';

  // Fallback nav: title-based nav buttons
  if (!nextUrl || !prevUrl) {
    var navRe = /href="(\/[^"]*chapter[^"]*)"[^>]*title="([^"]*)"/g;
    var nm;
    while ((nm = navRe.exec(html)) !== null) {
      var label = nm[2].toLowerCase();
      if (!prevUrl && (label.includes('sebelum') || label.includes('prev'))) prevUrl = kAbsUrl(nm[1]);
      if (!nextUrl && (label.includes('selanjut') || label.includes('next'))) nextUrl = kAbsUrl(nm[1]);
    }
  }

  return {
    _cat: 'komik',
    manga_title: mangaTitle,
    chapter_number: chNum,
    url: sourceUrl,
    prev_chapter: prevUrl,
    next_chapter: nextUrl,
    total_images: images.length,
    images: images,
  };
}

// ── Komiku API ───────────────────────────────────────────────────────────────
const KomikAPI = {

  async getHome() {
    var html = await komikuFetch('/');
    return kParseList(html);
  },

  async getPopuler() {
    var html = await komikuFetch('/other/hot/');
    return kParseList(html);
  },

  async getTerbaru(page) {
    page = page || 1;
    var path = '/pustaka/?orderby=date' + (page > 1 ? '&page=' + page : '');
    var html = await komikuFetch(path);
    return kParseList(html);
  },

  async getByType(tipe, page) {
    // tipe: manga | manhwa | manhua
    page = page || 1;
    var path = '/pustaka/?tipe=' + tipe + (page > 1 ? '&page=' + page : '');
    var html = await komikuFetch(path);
    return kParseList(html);
  },

  async search(q) {
    var html = await komikuFetch('/?post_type=manga&s=' + encodeURIComponent(q));
    var list = kParseList(html);
    return list.map(function(i) {
      return Object.assign(i, { _cat: 'komik' });
    });
  },

  async getMangaDetail(url) {
    var html = await komikuFetch(url);
    return kParseMangaDetail(html, url);
  },

  async getChapter(url) {
    var html = await komikuFetch(url);
    return kParseChapter(html, url);
  },

  // Legacy: download PDF via klune API
  async download(url) {
    const KAPI = 'https://klune-stream-api.vercel.app';
    const res = await fetch(KAPI + '/api/komiku/download?url=' + encodeURIComponent(url), {
      signal: AbortSignal.timeout(30000)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  },
};

// ── Manhwa API (klune API - unchanged) ──────────────────────────────────────
const ManhwaAPI = {
  async search(q) {
    const KAPI = 'https://klune-stream-api.vercel.app';
    const res = await fetch(KAPI + '/api/webtoon/search?q=' + encodeURIComponent(q), {
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const d = await res.json();
    if (d.title && d.episodes) {
      return [{ _cat:'manhwa', _detail:d, title:d.title||'', image:d.thumbnail||d.cover||d.image||'', slug:d.link||d.url||'', desc:d.synopsis||d.author||'', type:'Manhwa', episodes:d.episodes||[] }];
    }
    const list = d.results || d.data || d.webtoon || (Array.isArray(d) ? d : []);
    return list.map(function(i) {
      return { _cat:'manhwa', _detail:i.episodes?i:null, title:i.title||i.name||'', image:i.thumbnail||i.cover||i.image||'', slug:i.link||i.url||i.href||i.slug||'', desc:i.synopsis||i.author||i.desc||'', type:'Manhwa', episodes:i.episodes||[] };
    });
  },
  async downloadEp(q, ep) {
    const KAPI = 'https://klune-stream-api.vercel.app';
    const res = await fetch(KAPI + '/api/webtoon/download?q=' + encodeURIComponent(q) + '&ep=' + ep, {
      signal: AbortSignal.timeout(30000)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  },
};

// ── Komik Page State ─────────────────────────────────────────────────────────
window._komikState = {
  currentManga: null,
  currentChapter: null,
  chapterList: [],
  chapterIdx: 0,
};

// ── Homepage Komik ───────────────────────────────────────────────────────────
async function loadKomikHome() {
  window._cards = window._cards || [];
  showPage('komik');

  var c = document.getElementById('komik-page-body');
  if (!c) return;

  c.innerHTML = komikHomeSkeleton();

  try {
    // Load parallel: populer + terbaru
    var [populer, terbaru, manga, manhwa, manhua] = await Promise.allSettled([
      KomikAPI.getPopuler(),
      KomikAPI.getTerbaru(1),
      KomikAPI.getByType('manga'),
      KomikAPI.getByType('manhwa'),
      KomikAPI.getByType('manhua'),
    ]);

    var popList  = (populer.status  === 'fulfilled' && populer.value)  ? populer.value  : [];
    var barList  = (terbaru.status  === 'fulfilled' && terbaru.value)  ? terbaru.value  : [];
    var mgList   = (manga.status    === 'fulfilled' && manga.value)    ? manga.value    : [];
    var mhList   = (manhwa.status   === 'fulfilled' && manhwa.value)   ? manhwa.value   : [];
    var mnList   = (manhua.status   === 'fulfilled' && manhua.value)   ? manhua.value   : [];

    c.innerHTML =
      komikHeroSection(popList[0]) +
      komikRowSection('🔥 Populer', 'komik-row-populer', popList, 'komik') +
      komikRowSection('🆕 Terbaru Update', 'komik-row-terbaru', barList, 'komik') +
      komikRowSection('📖 Manga', 'komik-row-manga', mgList, 'komik') +
      komikRowSection('📱 Manhwa', 'komik-row-manhwa', mhList, 'komik') +
      komikRowSection('🀄 Manhua', 'komik-row-manhua', mnList, 'komik');

  } catch(e) {
    c.innerHTML = '<div class="err"><p>Gagal memuat komiku.org. Coba cari judul di atas.</p></div>';
    console.error('[KomikHome]', e);
  }
}

function komikHomeSkeleton() {
  var sk = '';
  for (var i = 0; i < 10; i++) sk += '<div class="sk-card"><div class="sk sk-thumb"></div><div class="sk sk-line"></div><div class="sk sk-line s60"></div></div>';
  return '<div class="komik-hero-sk sk" style="height:220px;border-radius:14px;margin-bottom:24px"></div>' +
    '<div class="row-wrap"><div class="row-cards">' + sk + '</div></div>';
}

function komikHeroSection(item) {
  if (!item) return '';
  var idx   = window._cards.length; window._cards.push(item);
  var img   = item.thumbnail || item.cover || item.image || '';
  var title = item.title || '';
  var ch    = item.latest_chapter || '';
  return '<div class="komik-hero" onclick="openKomikDetail(' + idx + ')" style="background-image:url(\'' + esc(img) + '\')">' +
    '<div class="komik-hero-fade"></div>' +
    '<div class="komik-hero-content">' +
    '<span class="komik-hero-badge">✦ Populer</span>' +
    '<h2 class="komik-hero-title">' + esc(title) + '</h2>' +
    (ch ? '<span class="komik-hero-ch">' + esc(ch) + '</span>' : '') +
    '<button class="btn-play" style="margin-top:10px">Baca Sekarang</button>' +
    '</div></div>';
}

function komikRowSection(label, id, list, cat) {
  if (!list || !list.length) return '';
  var cards = list.slice(0, 24).map(function(i) { return card(i, cat); }).join('');
  return '<div class="sec-row">' +
    '<div class="row-label">' + label + '</div>' +
    '<div class="row-cards" id="' + id + '">' + cards + '</div>' +
    '</div>';
}

// ── Komik Search ─────────────────────────────────────────────────────────────
var _komikSearchTimer;
function komikSearchInput(e) {
  clearTimeout(_komikSearchTimer);
  var q = e.target.value.trim();
  if (!q) { loadKomikHome(); return; }
  _komikSearchTimer = setTimeout(function() { doKomikSearch(q); }, 450);
}

async function doKomikSearch(q) {
  if (!q) q = document.getElementById('komik-q').value.trim();
  if (!q) return;
  var c = document.getElementById('komik-page-body');
  if (c) c.innerHTML = '<div class="sp-wrap"><div class="sp"></div><p style="margin-top:12px;color:var(--g3);font-size:13px">Mencari komik...</p></div>';
  try {
    window._cards = window._cards || [];
    var list = await KomikAPI.search(q);
    if (!list || !list.length) {
      if (c) c.innerHTML = '<div class="err"><p>Tidak ada hasil untuk "' + esc(q) + '"</p></div>';
      return;
    }
    if (c) c.innerHTML = '<div class="sr-label" style="padding:16px 0 8px">' + list.length + ' hasil · "' + esc(q) + '"</div>' +
      '<div class="pgrid">' + list.map(function(i) { return card(i, 'komik'); }).join('') + '</div>';
  } catch(e) {
    if (c) c.innerHTML = '<div class="err"><p>Gagal mencari: ' + esc(e.message) + '</p></div>';
  }
}

// ── Komik Detail ─────────────────────────────────────────────────────────────
function openKomikDetail(idx) {
  var item = window._cards[idx];
  if (!item) return;
  _loadKomikDetail(item);
}

async function _loadKomikDetail(item) {
  var url = item.url || item.slug || item.link || '';
  if (!url) return;
  showPage('detail');
  var c = document.getElementById('detail-container');
  c.innerHTML = '<div class="sp-wrap" style="padding:40px"><div class="sp"></div></div>';
  _hist.push('detail');

  try {
    var detail = await KomikAPI.getMangaDetail(url);
    window._komikState.currentManga = detail;
    window._komikState.chapterList  = detail.chapters || [];

    var img    = detail.cover || item.thumbnail || '';
    var title  = detail.title || item.title || 'Komik';
    var genres = detail.genres || [];
    var chs    = detail.chapters || [];

    // Chapter list HTML
    var chHtml = '';
    if (chs.length) {
      // Show latest first (reverse)
      var reversed = chs.slice().reverse();
      chHtml = '<div class="ds-title" style="margin-top:24px">📖 Chapter (' + chs.length + ')</div>' +
        '<div class="eps-grid" id="komik-ch-grid">' +
        reversed.map(function(ch, i) {
          var realIdx = chs.indexOf(ch); // index in original array
          return '<button class="ep-btn" onclick="openKomikReader(' + realIdx + ')">' +
            esc('Ch ' + ch.numStr) +
            '</button>';
        }).join('') +
        '</div>';
    }

    c.innerHTML =
      '<div class="detail-body">' +
        '<button class="back-btn" onclick="goBack()">← Kembali</button>' +
        '<div class="komik-layout">' +
          '<div class="komik-cover"><img src="' + esc(img) + '" onerror="this.src=\'https://placehold.co/300x420/1a1a22/444?text=No+Image\'" alt=""></div>' +
          '<div class="komik-info">' +
            '<h1 class="detail-title" style="font-size:1.5rem">' + esc(title) + '</h1>' +
            (detail.alt_title ? '<p style="color:var(--g3);font-size:12px;margin-top:3px">' + esc(detail.alt_title) + '</p>' : '') +
            '<div class="komik-meta-row">' +
              '<span class="km-badge">' + esc(detail.type || 'Manga') + '</span>' +
              '<span class="km-badge km-status">' + esc(detail.status || '') + '</span>' +
              (detail.rating !== 'N/A' ? '<span class="km-badge km-rating">★ ' + esc(detail.rating) + '</span>' : '') +
            '</div>' +
            (genres.length ? '<div class="komik-genres">' + genres.map(function(g) { return '<span class="kg-pill">' + esc(g) + '</span>'; }).join('') + '</div>' : '') +
            (detail.author !== 'N/A' ? '<p style="font-size:12px;color:var(--g3);margin-top:8px">Penulis: <b>' + esc(detail.author) + '</b></p>' : '') +
            (detail.synopsis ? '<p class="detail-synopsis" style="font-size:13px;margin-top:10px;line-height:1.6">' + esc(detail.synopsis.slice(0, 300)) + (detail.synopsis.length > 300 ? '...' : '') + '</p>' : '') +
            (chs.length ? '<button class="btn-play" style="margin-top:16px" onclick="openKomikReader(' + (chs.length - 1) + ')">▶ Baca Chapter ' + esc(chs[chs.length - 1].numStr) + ' (Terbaru)</button>' : '') +
          '</div>' +
        '</div>' +
        chHtml +
      '</div>';

  } catch(e) {
    c.innerHTML = '<div class="detail-body"><button class="back-btn" onclick="goBack()">← Kembali</button><div class="err"><p>Gagal memuat detail: ' + esc(e.message) + '</p></div></div>';
  }
}

// ── Komik Reader ─────────────────────────────────────────────────────────────
async function openKomikReader(chapterIdx) {
  var chs = window._komikState.chapterList;
  if (!chs || !chs[chapterIdx]) return;

  var ch     = chs[chapterIdx];
  var manga  = window._komikState.currentManga;

  showPage('watch');
  var c = document.getElementById('watch-container');
  c.innerHTML = '<div class="sp-wrap" style="padding:40px"><div class="sp"></div><p style="color:var(--g3);font-size:13px;margin-top:12px">Memuat chapter...</p></div>';
  _hist.push('watch');

  window._komikState.chapterIdx = chapterIdx;

  try {
    var data = await KomikAPI.getChapter(ch.url);
    window._komikState.currentChapter = data;

    var prevIdx = chapterIdx - 1;
    var nextIdx = chapterIdx + 1;
    var hasPrev = prevIdx >= 0;
    var hasNext = nextIdx < chs.length;

    var images = data.images || [];

    c.innerHTML =
      '<div class="reader-wrap">' +
        // Topbar
        '<div class="reader-topbar">' +
          '<button class="back-btn" onclick="goBack()">← Kembali</button>' +
          '<div class="reader-info">' +
            '<span class="reader-manga">' + esc((manga ? manga.title : data.manga_title) || '') + '</span>' +
            '<span class="reader-ch">Chapter ' + esc(data.chapter_number) + '</span>' +
          '</div>' +
          '<div class="reader-nav">' +
            (hasPrev ? '<button class="rn-btn" onclick="openKomikReader(' + prevIdx + ')">‹ Prev</button>' : '<button class="rn-btn" disabled>‹ Prev</button>') +
            // Chapter select
            '<select class="rn-select" onchange="openKomikReader(this.value)">' +
              chs.slice().reverse().map(function(c2, i) {
                var realIdx = chs.indexOf(c2);
                return '<option value="' + realIdx + '"' + (realIdx === chapterIdx ? ' selected' : '') + '>Ch ' + esc(c2.numStr) + '</option>';
              }).join('') +
            '</select>' +
            (hasNext ? '<button class="rn-btn" onclick="openKomikReader(' + nextIdx + ')">Next ›</button>' : '<button class="rn-btn" disabled>Next ›</button>') +
          '</div>' +
        '</div>' +

        // Pages
        (images.length
          ? '<div class="reader-pages" id="reader-pages">' +
              images.map(function(imgUrl, i) {
                return '<div class="reader-page">' +
                  '<img src="' + esc(imgUrl) + '" loading="lazy" alt="Page ' + (i+1) + '" ' +
                    'onerror="this.src=\'https://placehold.co/800x1200/111/333?text=Gagal+Muat\'" ' +
                    'style="max-width:100%;display:block;margin:0 auto">' +
                  '</div>';
              }).join('') +
              '</div>'
          : '<div class="err" style="padding:40px"><p>Tidak ada gambar di chapter ini.<br>Coba buka langsung di <a href="' + esc(ch.url) + '" target="_blank">komiku.org</a></p></div>'
        ) +

        // Bottom nav
        '<div class="reader-bottombar">' +
          (hasPrev ? '<button class="btn-red" onclick="openKomikReader(' + prevIdx + ')">‹ Chapter Sebelumnya</button>' : '') +
          (hasNext ? '<button class="btn-play" onclick="openKomikReader(' + nextIdx + ')">Chapter Selanjutnya ›</button>' : '<p style="color:var(--g3);font-size:13px">✓ Chapter terakhir</p>') +
        '</div>' +
      '</div>';

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch(e) {
    c.innerHTML =
      '<div class="reader-wrap">' +
        '<div class="reader-topbar"><button class="back-btn" onclick="goBack()">← Kembali</button></div>' +
        '<div class="err" style="padding:40px"><p>Gagal memuat chapter.<br>' + esc(e.message) + '<br><a href="' + esc(ch.url) + '" target="_blank">Buka di komiku.org →</a></p></div>' +
      '</div>';
  }
}

// ── Manhwa Search (tetap via klune API) ──────────────────────────────────────
async function doManhwaSearch() {
  var q = document.getElementById('manhwa-q').value.trim();
  if (!q) return;
  var r = document.getElementById('manhwa-results');
  r.innerHTML = '<div class="sp-wrap"><div class="sp"></div></div>';
  try {
    window._cards = window._cards || [];
    var list = await ManhwaAPI.search(q);
    if (!list || !list.length) { r.innerHTML = '<div class="err"><p>Tidak ada hasil</p></div>'; return; }
    r.innerHTML = '<div class="pgrid">' + list.map(function(i) { return card(i, 'manhwa'); }).join('') + '</div>';
  } catch(e) {
    r.innerHTML = '<div class="err"><p>Gagal: ' + esc(e.message) + '</p></div>';
  }
}

function openManhwaDetail(idx) {
  var item = window._cards[idx];
  if (!item) return;
  _loadManhwaDetail(item);
}

function _loadManhwaDetail(item) {
  var slug = item.slug || item.link || item.url || '';
  var title = item.title || 'Manhwa';
  var img   = item.image || item.thumbnail || item.cover || '';
  var desc  = item.desc || item.synopsis || '';
  var author = item.author || '';
  var episodes = (item._detail && item._detail.episodes ? item._detail.episodes : item.episodes || []).map(function(ep, i) {
    return Object.assign({}, ep, { index: ep.episode || ep.eps || (i + 1) });
  });
  showPage('detail');
  _hist.push('detail');
  var c = document.getElementById('detail-container');
  var epsHtml = episodes.length
    ? '<div class="ds-title" style="margin-top:20px">Episode / Chapter (' + episodes.length + ')</div><div class="eps-grid">' +
        episodes.map(function(ep, i) {
          var l = ep.title || ('Episode ' + (i + 1));
          return '<button class="ep-btn" onclick="downloadManhwaEp(\'' + esc(title) + '\',' + ep.index + ',\'' + esc(l) + '\')">' + esc(l) + '</button>';
        }).join('') + '</div>'
    : '<div style="margin-top:16px"><div class="ds-title">Download Episode</div><p style="font-size:12px;color:var(--g3);margin-top:6px;margin-bottom:12px">Masukkan judul & nomor episode</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<input type="text" id="mh-q" placeholder="Judul manhwa" value="' + esc(title) + '" style="flex:2;min-width:160px;background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:9px 12px;color:var(--g1);font-family:var(--font);font-size:13px;outline:none">' +
        '<input type="number" id="mh-ep" placeholder="Ep" value="1" style="width:70px;background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:9px 12px;color:var(--g1);font-family:var(--font);font-size:13px;outline:none">' +
        '<button class="btn-red" onclick="downloadManhwaManual()">⬇ Download PDF</button></div>' +
        '<div id="mh-dl-result" style="margin-top:12px"></div></div>';
  c.innerHTML =
    '<div class="detail-body" style="padding-top:28px"><button class="back-btn" onclick="goBack()">← Kembali</button>' +
    '<div class="komik-layout"><div class="komik-cover"><img src="' + esc(img) + '" onerror="this.src=\'https://placehold.co/300x420/1a1a22/444?text=No+Image\'" alt=""></div>' +
    '<div class="komik-info"><h1 class="detail-title" style="font-size:1.6rem">' + esc(title) + '</h1>' +
    (author ? '<p style="color:var(--g3);font-size:12px;margin-top:4px">oleh ' + esc(author) + '</p>' : '') +
    (desc ? '<p class="detail-synopsis" style="margin-top:10px;font-size:13px">' + esc(desc.slice(0, 200)) + '</p>' : '') +
    '</div></div>' + epsHtml + '</div>';
}

async function downloadManhwaEp(q, ep, label) {
  var btn = event.target;
  var origText = btn ? btn.textContent : '';
  var cleanup = function() { if (btn) btn.textContent = origText; };
  if (btn) btn.textContent = '⏳ Loading...';
  try {
    var d = await ManhwaAPI.downloadEp(q, ep);
    if (d.base64pdf || d.base64 || d.pdf) {
      var b = d.base64pdf || d.base64 || d.pdf;
      var fn = d.fileName || d.filename || 'episode.pdf';
      var a = document.createElement('a'); a.href = 'data:application/pdf;base64,' + b; a.download = fn; a.click();
      if (btn) { btn.textContent = '✓ OK'; btn.style.color = '#22c55e'; }
    } else {
      if (btn) { btn.textContent = '✗ Gagal'; btn.style.color = '#ef4444'; }
    }
    setTimeout(cleanup, 3000);
  } catch(e) {
    if (btn) { btn.textContent = '✗ ' + e.message; btn.style.color = '#ef4444'; setTimeout(cleanup, 3000); }
  }
}

async function downloadManhwaManual() {
  var q = document.getElementById('mh-q').value.trim();
  var ep = parseInt(document.getElementById('mh-ep').value) || 1;
  downloadManhwaEp(q, ep, 'Episode ' + ep);
}

// ── Export ───────────────────────────────────────────────────────────────────
window.KomikAPI    = KomikAPI;
window.ManhwaAPI   = ManhwaAPI;
window.loadKomikHome  = loadKomikHome;
window.doKomikSearch  = doKomikSearch;
window.komikSearchInput = komikSearchInput;
window.openKomikDetail  = openKomikDetail;
window.openKomikReader  = openKomikReader;
window.openManhwaDetail = openManhwaDetail;
window.doManhwaSearch   = doManhwaSearch;
window.downloadManhwaEp = downloadManhwaEp;
window.downloadManhwaManual = downloadManhwaManual;
