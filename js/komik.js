// ============================================
// KLUNE STREAM - Komik & Manhwa & Film scraper
// Semua via proxy karena CORS blocked di browser
// Pakai allorigins.win sebagai CORS proxy
// ============================================

const PROXY = 'https://api.allorigins.win/raw?url=';
const KOMIKU_BASE = 'https://komiku.org';
const WEBTOON_BASE = 'https://www.webtoons.com';
const KLIKXXI_BASE = 'https://klikxxi.me';

async function proxyFetch(url) {
  const res = await fetch(PROXY + encodeURIComponent(url), {
    signal: AbortSignal.timeout(12000)
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.text();
}

function parseHTML(html) {
  return new DOMParser().parseFromString(html, 'text/html');
}

function qs(doc, sel) { return doc.querySelector(sel); }
function qsa(doc, sel) { return Array.from(doc.querySelectorAll(sel)); }
function txt(el) { return el ? el.textContent.trim() : ''; }
function attr(el, a) { return el ? (el.getAttribute(a) || '') : ''; }

// ── KOMIK (komiku.org) ────────────────────────────────────────────────────────

const KomikAPI = {
  async search(query) {
    const html = await proxyFetch(KOMIKU_BASE + '/?post_type=manga&s=' + encodeURIComponent(query));
    const doc = parseHTML(html);
    const results = [];
    qsa(doc, '.bge, .bgei').slice(0,12).forEach(el => {
      const title = txt(el.querySelector('h3')) || txt(el.querySelector('.kan h4'));
      const link = attr(el.querySelector('a'), 'href');
      const thumb = attr(el.querySelector('img'), 'src') || attr(el.querySelector('img'), 'data-src');
      const desc = txt(el.querySelector('p')) || txt(el.querySelector('.judul2')) || '';
      if (title && link) {
        results.push({
          title, thumb, desc,
          slug: link.startsWith('http') ? link : KOMIKU_BASE + link,
          type: 'komik',
        });
      }
    });
    return results;
  },

  async getDetail(url) {
    const html = await proxyFetch(url);
    const doc = parseHTML(html);
    const title = txt(qs(doc,'#Judul h1')) || txt(qs(doc,'h1.entry-title'));
    const cover = attr(qs(doc,'.ims img, .thumb img, .series-thumb img'), 'src');
    const synopsis = txt(qs(doc,'.desc, .entry-content p, #Judul + div p'));
    const chapters = qsa(doc, '#Chapter_List li a, .list-chapter li a, .eplister li a').map((a,i) => ({
      _label: txt(a) || 'Chapter '+(i+1),
      _slug: attr(a,'href').startsWith('http') ? attr(a,'href') : KOMIKU_BASE + attr(a,'href'),
      type: 'komik-chapter',
    }));
    return { title, cover, synopsis, chapters, type:'komik' };
  },

  async getChapterImages(url) {
    const html = await proxyFetch(url);
    const doc = parseHTML(html);
    const imgs = qsa(doc,'#Baca_Komik img, .reader-area img, .chapter-img img')
      .map(img => attr(img,'src')||attr(img,'data-src'))
      .filter(s => s && s.startsWith('http'));
    const title = txt(qs(doc,'#Judul h1, h1.entry-title'));
    return { title, images: imgs };
  },
};

// ── MANHWA (webtoons.com) ─────────────────────────────────────────────────────

const ManhwaAPI = {
  async search(query) {
    const html = await proxyFetch(WEBTOON_BASE + '/id/search?keyword=' + encodeURIComponent(query));
    const doc = parseHTML(html);
    const results = [];
    qsa(doc, '.card_lst li, .webtoon_list li, .search_result li').slice(0,12).forEach(el => {
      const a = el.querySelector('a');
      const title = txt(el.querySelector('.subj, .title, h6'));
      const thumb = attr(el.querySelector('img'), 'src');
      const genre = txt(el.querySelector('.genre'));
      const link = attr(a,'href');
      if (title && link) {
        results.push({
          title, thumb, desc: genre,
          slug: link.startsWith('http') ? link : WEBTOON_BASE + link,
          type: 'manhwa',
        });
      }
    });
    return results;
  },

  async getDetail(url) {
    const html = await proxyFetch(url);
    const doc = parseHTML(html);
    const title = txt(qs(doc,'.info .subj, meta[property="og:title"]'));
    const cover = attr(qs(doc,'#content img.thmb, .detail_header img'), 'src');
    const synopsis = txt(qs(doc,'.summary, meta[property="og:description"]'));
    const author = txt(qs(doc,'.info .author'));
    const chapters = qsa(doc,'#_episodeList li a, .detail_lst li a').map((a,i) => ({
      _label: txt(a.querySelector('.subj span, .subj')) || 'Episode '+(i+1),
      _slug: attr(a,'href').startsWith('http') ? attr(a,'href') : WEBTOON_BASE + attr(a,'href'),
      type: 'manhwa-chapter',
    })).reverse();
    return { title, cover, synopsis, author, chapters, type:'manhwa' };
  },

  async getChapterImages(url) {
    const html = await proxyFetch(url);
    const doc = parseHTML(html);
    const imgs = qsa(doc,'#_imageList img, .viewer_img img')
      .map(img => attr(img,'data-url')||attr(img,'src'))
      .filter(s => s && s.startsWith('http'));
    const title = txt(qs(doc,'.subj_episode, h1'));
    return { title, images: imgs };
  },
};

// ── FILM/DRAMA (klikxxi.me) ───────────────────────────────────────────────────

const FilmAPI = {
  async search(query) {
    const html = await proxyFetch(KLIKXXI_BASE + '/?s=' + encodeURIComponent(query) + '&post_type[]=post&post_type[]=tv');
    const doc = parseHTML(html);
    const results = [];
    qsa(doc, '#gmr-main-load .item-infinite, .gmr_wrap .item').slice(0,12).forEach(el => {
      const a = el.querySelector('.entry-title a, h2 a');
      const title = txt(a);
      const link = attr(a, 'href');
      const thumb = attr(el.querySelector('img'), 'data-lazy-src') || attr(el.querySelector('img'), 'src');
      const rating = txt(el.querySelector('.gmr-rating-item')).replace('icon_star','').trim();
      const quality = txt(el.querySelector('.gmr-quality-item a, .gmr-quality-item'));
      const duration = txt(el.querySelector('.gmr-duration-item'));
      if (title && link) {
        results.push({ title, thumb, slug: link, rating, quality, duration, desc: quality, type:'film' });
      }
    });
    return results;
  },

  async getDetail(url) {
    const html = await proxyFetch(url);
    const doc = parseHTML(html);
    const title = txt(qs(doc, '.entry-title, h1'));
    const cover = attr(qs(doc, '.gmr-movie-data figure img'), 'data-lazy-src') || attr(qs(doc, '.gmr-movie-data figure img'), 'src');
    const synopsis = txt(qs(doc, '.entry-content p'));
    const rating = txt(qs(doc, '.gmr-meta-rating span[itemprop="ratingValue"]'));
    const genres = qsa(doc, 'a[rel="category tag"]').map(a => txt(a));
    const year = txt(qs(doc, '.gmr-moviedata a[rel="tag"]'));

    // Stream servers
    const servers = qsa(doc, '.muvipro-player-tabs li a').map((a,i) => ({
      name: txt(a),
      id: attr(a,'id'),
      tabId: attr(a,'href'),
    }));

    // Embed iframes
    const iframes = qsa(doc, '.muvipro-tab-player iframe, .gmr-embed-responsive iframe').map(f =>
      attr(f,'src')||attr(f,'data-src')
    ).filter(Boolean);

    // Download links
    const downloads = qsa(doc, '.gmr-download-list li a.button').map(a => ({
      label: txt(a), url: attr(a,'href'),
    }));

    // Episode list (for series/drama)
    const episodes = qsa(doc, '#seasonss .episodios li a, .eps-list li a, .eplister li a').map((a,i) => ({
      _label: txt(a) || 'Episode '+(i+1),
      _slug: attr(a,'href'),
      type: 'film-episode',
    }));

    return { title, cover, synopsis, rating, genres, year, servers, iframes, downloads, episodes, type:'film' };
  },

  async getEpisodeEmbed(url) {
    const html = await proxyFetch(url);
    const doc = parseHTML(html);
    const iframes = qsa(doc, '.gmr-embed-responsive iframe, .video-player iframe, #gmr-video-embed iframe')
      .map(f => attr(f,'src')||attr(f,'data-src')).filter(Boolean);
    const servers = qsa(doc, '.muvipro-player-tabs li a').map((a,i) => ({
      name: txt(a), tabId: attr(a,'href'),
    }));
    return { iframes, servers };
  },
};

window.KomikAPI = KomikAPI;
window.ManhwaAPI = ManhwaAPI;
window.FilmAPI = FilmAPI;
