// ============================================
// KLUNE STREAM - App Logic
// ============================================

// ── Helpers ──────────────────────────────────────────────────────────────────

function img(item) {
  if (!item) return 'https://placehold.co/300x450/16161e/555?text=No+Image';
  const v = item.poster || item.image || item.img || item.thumb || item.thumbnail ||
    item.cover || item.foto || item.banner || item.coverImage || item.poster_url || '';
  return v || 'https://placehold.co/300x450/16161e/555?text=No+Image';
}

function ttl(item) {
  if (!item) return 'Unknown';
  return item.title || item.judul || item.name || item.anime_title ||
    item.animeTitle || item.romaji || item.english || item.native || 'Unknown';
}

function slg(item) {
  if (!item) return '';
  return item.slug || item.animeId || item.anime_id || item.id ||
    item.url || item.link || item.endpoint || item.href || '';
}

function epSlug(ep) {
  if (!ep) return '';
  return ep.slug || ep.episode_id || ep.id || ep.url || ep.link || ep.href || ep.endpoint || '';
}

function epLabel(ep, idx) {
  if (!ep) return 'Episode ' + (idx + 1);
  return ep.episode || ep.eps || ep.title || ep.judul || ep.label || ep.name || ('Episode ' + (idx + 1));
}

function getEmbedUrl(data) {
  if (!data) return '';
  // Cari embed URL dari berbagai field
  let url = data.embed || data.embedUrl || data.iframe || data.iframeUrl ||
    data.stream_url || data.streamUrl || data.url || data.link || data.src || '';
  // Kalau ada array server, ambil yang pertama
  if (!url && data.server) {
    const s = Array.isArray(data.server) ? data.server[0] : data.server;
    if (s) url = s.url || s.embed || s.iframe || s.src || s.link || '';
  }
  if (!url && data.servers) {
    const s = Array.isArray(data.servers) ? data.servers[0] : data.servers;
    if (s) url = s.url || s.embed || s.iframe || s.src || s.link || '';
  }
  if (!url && data.streamUrls) {
    const s = Array.isArray(data.streamUrls) ? data.streamUrls[0] : data.streamUrls;
    if (s) url = typeof s === 'string' ? s : (s.url || s.embed || '');
  }
  return url || '';
}

function getServers(data) {
  if (!data) return [];
  const raw = data.server || data.servers || data.streamUrls || data.mirror || data.links || [];
  const arr = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  return arr.map(function(s, i) {
    if (typeof s === 'string') return { name: 'Server ' + (i + 1), url: s };
    return {
      name: s.name || s.server || s.quality || ('Server ' + (i + 1)),
      url: s.url || s.embed || s.iframe || s.src || s.link || '',
    };
  }).filter(function(s) { return s.url; });
}

function getEpisodes(data) {
  if (!data) return [];
  const e = data.episodeList || data.episodes || data.episode_list ||
    data.listEpisode || data.list_episode || data.daftar_episode ||
    data.eps || data.episodesList || [];
  return Array.isArray(e) ? e : [];
}

function getSynopsis(data) {
  return data.synopsis || data.sinopsis || data.description || data.deskripsi ||
    data.overview || data.plot || data.summary || '';
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function skeletons(n) {
  let h = '';
  for (let i = 0; i < n; i++) {
    h += '<div class="skeleton-card"><div class="skeleton skeleton-thumb"></div>' +
      '<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text short"></div></div>';
  }
  return h;
}

// ── Card ──────────────────────────────────────────────────────────────────────

function buildCard(item) {
  const image = img(item);
  const title = ttl(item);
  const slug = slg(item);
  const score = item.score || item.rating || item.nilai || '';
  const status = (item.status || item.tipe_status || '').toLowerCase();
  const type = item.type || item.tipe || '';
  const eps = item.total_episode || item.episodes || item.episode_count || item.totalEpisode || '';
  const isDonghua = type.toLowerCase().includes('donghua');

  let badges = '';
  if (status.includes('ongoing') || status.includes('airing') || status.includes('tayang'))
    badges += '<span class="badge badge-ongoing">Ongoing</span>';
  else if (status.includes('complet') || status.includes('tamat') || status.includes('finish'))
    badges += '<span class="badge badge-completed">Tamat</span>';
  if (type.toLowerCase().includes('movie'))
    badges += '<span class="badge badge-movie">Movie</span>';
  if (isDonghua)
    badges += '<span class="badge badge-donghua">Donghua</span>';

  // Encode item sebagai data attribute untuk menghindari masalah quote/HTML injection
  const dataIdx = window._cardData ? window._cardData.length : 0;
  if (!window._cardData) window._cardData = [];
  window._cardData.push(item);

  return '<div class="anime-card" onclick="openDetailByIdx(' + dataIdx + ')">' +
    '<div class="card-thumb">' +
    '<img src="' + image + '" alt="" loading="lazy" onerror="this.src=\'https://placehold.co/300x450/16161e/555?text=No+Image\'">' +
    '<div class="card-badges">' + badges + '</div>' +
    (score ? '<div class="card-rating">★ ' + parseFloat(score).toFixed(1) + '</div>' : '') +
    '<div class="card-overlay"><div style="width:100%;text-align:center">' +
    '<div class="card-play-btn"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>' +
    '</div></div></div>' +
    '<div class="card-info">' +
    '<div class="card-title">' + escHtml(title) + '</div>' +
    '<div class="card-meta">' +
    (eps ? '<span>' + eps + ' Eps</span>' : '') +
    '<span>' + (type || 'Anime') + '</span>' +
    '</div></div></div>';
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Pages ─────────────────────────────────────────────────────────────────────

var _history = [];

function showPage(name) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  var el = document.getElementById('page-' + name);
  if (el) el.classList.add('active');
  document.getElementById('search-results-container').classList.remove('visible');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.querySelectorAll('.nav-links a').forEach(function(a) {
    a.classList.toggle('active', a.dataset.page === name);
  });
  _history.push(name);
}

function goBack() {
  if (_history.length > 1) {
    _history.pop();
    var prev = _history[_history.length - 1];
    _history.pop(); // will be re-added by showPage
    if (prev === 'home') loadHome();
    else if (prev === 'browse') showPage('browse');
    else if (prev === 'genre') loadGenrePage();
    else if (prev === 'schedule') loadSchedulePage();
    else showPage(prev);
  } else {
    loadHome();
  }
}

// ── Navbar scroll ─────────────────────────────────────────────────────────────

document.getElementById('navbar').classList.add('scrolled');
window.addEventListener('scroll', function() {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
});

// ── Search ────────────────────────────────────────────────────────────────────

var _searchTimer;
var _searchInput = document.getElementById('search-input');
var _searchBox = document.getElementById('search-results-container');

_searchInput.addEventListener('input', function() {
  clearTimeout(_searchTimer);
  var q = _searchInput.value.trim();
  if (!q) { _searchBox.classList.remove('visible'); return; }
  _searchTimer = setTimeout(function() { doSearch(q); }, 500);
});

_searchInput.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { _searchBox.classList.remove('visible'); _searchInput.value = ''; }
});

document.addEventListener('click', function(e) {
  if (!e.target.closest('#nav-search-bar') && !e.target.closest('#search-results-container')) {
    _searchBox.classList.remove('visible');
  }
});

async function doSearch(query) {
  window._cardData = [];
  _searchBox.innerHTML = '<div class="search-results-title">Mencari "' + escHtml(query) + '"...</div>' +
    '<div class="search-results-grid">' + skeletons(8) + '</div>';
  _searchBox.classList.add('visible');

  try {
    const list = await API.search(query);
    if (!list || !list.length) {
      _searchBox.innerHTML = '<div class="search-results-title">Tidak ada hasil untuk "' + escHtml(query) + '"</div>';
      return;
    }
    _searchBox.innerHTML = '<div class="search-results-title">Hasil: "' + escHtml(query) + '" — ' + list.length + ' anime</div>' +
      '<div class="search-results-grid">' + list.map(buildCard).join('') + '</div>';
  } catch(e) {
    _searchBox.innerHTML = '<div class="search-results-title">Gagal mencari. Coba lagi.</div>';
  }
}

// ── HOME ──────────────────────────────────────────────────────────────────────

async function loadHome() {
  window._cardData = [];
  showPage('home');
  loadHero();
  loadRow('latest-row', function() { return API.getLatest(); });
  loadRow('popular-row', function() { return API.getPopular(); });
  loadRow('ongoing-row', function() { return API.getOngoing(); });
  loadRow('donghua-row', function() { return API.getDonghua(); });
  loadRow('movie-row', function() { return API.getMovies(); });
}

async function loadHero() {
  var el = document.getElementById('hero-section');
  if (!el) return;
  try {
    const list = await API.getLatest();
    if (!list || !list.length) return;
    var item = list[0];
    var image = img(item);
    var title = ttl(item);
    var desc = getSynopsis(item);
    var score = item.score || item.rating || '';
    var eps = item.total_episode || item.episodes || '';
    var genres = item.genres || item.genre || [];
    var genreArr = Array.isArray(genres) ? genres : (typeof genres === 'string' ? genres.split(',') : []);
    var dataIdx = (window._cardData || []).length;
    if (!window._cardData) window._cardData = [];
    window._cardData.push(item);

    el.innerHTML =
      '<div class="hero-bg" style="background-image:url(\'' + image + '\')"></div>' +
      '<div class="hero-gradient"></div>' +
      '<div class="hero-content">' +
      '<div class="hero-badge">🔥 Featured</div>' +
      '<h1 class="hero-title">' + escHtml(title) + '</h1>' +
      '<div class="hero-meta">' +
      (score ? '<span class="rating">★ ' + parseFloat(score).toFixed(1) + '</span>' : '') +
      (eps ? '<span class="episode-count">' + eps + ' Episode</span>' : '') +
      '</div>' +
      (genreArr.length ? '<div class="hero-tags">' + genreArr.slice(0,4).map(function(g){
        return '<span class="tag">' + escHtml(typeof g === 'string' ? g : (g && (g.name||g.genre||g.slug||''))) + '</span>';
      }).join('') + '</div>' : '') +
      (desc ? '<p class="hero-desc">' + escHtml(desc.slice(0,220)) + (desc.length>220?'...':'') + '</p>' : '') +
      '<div class="hero-actions">' +
      '<button class="btn-primary" onclick="openDetailByIdx(' + dataIdx + ')">▶ Tonton Sekarang</button>' +
      '<button class="btn-secondary" onclick="openDetailByIdx(' + dataIdx + ')">ℹ Info</button>' +
      '</div></div>';
  } catch(e) { console.warn('Hero error', e); }
}

async function loadRow(id, fetchFn) {
  var el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = skeletons(8);
  try {
    const list = await fetchFn();
    if (!list || !list.length) { el.innerHTML = '<div class="error-message"><p>Tidak ada data</p></div>'; return; }
    el.innerHTML = list.slice(0,20).map(buildCard).join('');
  } catch(e) {
    el.innerHTML = '<div class="error-message"><p>Gagal memuat</p></div>';
  }
}

// ── BROWSE ────────────────────────────────────────────────────────────────────

var _browseTab = 'ongoing';
var _browsePage = 1;

async function loadBrowsePage(tab) {
  window._cardData = [];
  _browseTab = tab || 'ongoing';
  _browsePage = 1;
  showPage('browse');
  document.querySelectorAll('#page-browse .tab-btn').forEach(function(b){
    b.classList.toggle('active', b.dataset.tab === _browseTab);
  });
  await _loadBrowse();
}

async function _loadBrowse() {
  var grid = document.getElementById('browse-grid');
  grid.innerHTML = skeletons(18);
  try {
    var list;
    if (_browseTab === 'ongoing') list = await API.getOngoing(_browsePage);
    else if (_browseTab === 'completed') list = await API.getCompleted(_browsePage);
    else if (_browseTab === 'movies') list = await API.getMovies(_browsePage);
    else if (_browseTab === 'popular') list = await API.getPopular(_browsePage);
    else if (_browseTab === 'donghua') list = await API.getDonghua(_browsePage);
    else list = [];
    if (!list || !list.length) { grid.innerHTML = '<div class="error-message"><h3>Tidak ada data</h3></div>'; return; }
    grid.innerHTML = list.map(buildCard).join('');
    _renderPagination();
  } catch(e) {
    grid.innerHTML = '<div class="error-message"><h3>Gagal memuat</h3></div>';
  }
}

function _renderPagination() {
  var el = document.getElementById('browse-pagination');
  if (!el) return;
  var cur = _browsePage, max = 20;
  var html = '<button class="page-btn" onclick="changePage(' + (cur-1) + ')" ' + (cur<=1?'disabled':'') + '>‹</button>';
  var start = Math.max(1, cur-2), end = Math.min(max, cur+2);
  for (var i = start; i <= end; i++) {
    html += '<button class="page-btn ' + (i===cur?'active':'') + '" onclick="changePage(' + i + ')">' + i + '</button>';
  }
  html += '<button class="page-btn" onclick="changePage(' + (cur+1) + ')" ' + (cur>=max?'disabled':'') + '>›</button>';
  el.innerHTML = html;
}

function changePage(p) {
  if (p < 1) return;
  _browsePage = p;
  _loadBrowse();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── GENRE ─────────────────────────────────────────────────────────────────────

async function loadGenrePage() {
  window._cardData = [];
  showPage('genre');
  var listEl = document.getElementById('genre-list');
  var gridEl = document.getElementById('genre-anime-grid');
  listEl.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  gridEl.innerHTML = '<div class="error-message"><p>Pilih genre untuk melihat anime</p></div>';

  try {
    const genres = await API.getGenres();
    if (!genres || !genres.length) { listEl.innerHTML = '<div class="error-message"><p>Gagal memuat genre</p></div>'; return; }
    listEl.innerHTML = genres.map(function(g, i) {
      var name = typeof g === 'string' ? g : (g.name || g.genre || g.slug || g.id || ('Genre ' + i));
      var slug = typeof g === 'string' ? g : (g.slug || g.id || g.name || name);
      return '<button class="genre-chip" data-slug="' + escHtml(slug) + '" onclick="loadGenreAnime(\'' + escHtml(slug) + '\',\'' + escHtml(name) + '\')">' + escHtml(name) + '</button>';
    }).join('');
  } catch(e) {
    listEl.innerHTML = '<div class="error-message"><p>Gagal memuat genre</p></div>';
  }
}

async function loadGenreAnime(slug, name) {
  document.querySelectorAll('.genre-chip').forEach(function(c){ c.classList.remove('active'); });
  var active = document.querySelector('.genre-chip[data-slug="' + slug + '"]');
  if (active) active.classList.add('active');
  var grid = document.getElementById('genre-anime-grid');
  grid.innerHTML = skeletons(12);
  try {
    const list = await API.getByGenre(slug);
    if (!list || !list.length) { grid.innerHTML = '<div class="error-message"><p>Tidak ada anime di genre ini</p></div>'; return; }
    grid.innerHTML = list.map(buildCard).join('');
  } catch(e) {
    grid.innerHTML = '<div class="error-message"><p>Gagal memuat anime</p></div>';
  }
}

// ── SCHEDULE ──────────────────────────────────────────────────────────────────

async function loadSchedulePage() {
  window._cardData = [];
  showPage('schedule');
  var el = document.getElementById('schedule-container');
  el.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  try {
    const raw = await API.getSchedule();
    var days = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
    var dayKeys = ['senin','selasa','rabu','kamis','jumat','sabtu','minggu'];
    var todayIdx = (new Date().getDay() + 6) % 7;
    var data = (raw && (raw.data || raw.schedule || raw)) || {};
    var isArr = Array.isArray(data);

    var html = '<div class="schedule-grid">';
    dayKeys.forEach(function(day, idx) {
      var animes = isArr
        ? data.filter(function(a){ return (a.day||a.hari||'').toLowerCase() === day; })
        : (data[day] || data[days[idx]] || data[days[idx].toLowerCase()] || []);

      html += '<div class="schedule-day ' + (idx===todayIdx?'today':'') + '">' +
        '<div class="schedule-day-title">' + days[idx] + (idx===todayIdx?' ✦':'') + '</div>';

      if (Array.isArray(animes) && animes.length) {
        animes.forEach(function(a) {
          var dataIdx = (window._cardData||[]).length;
          if (!window._cardData) window._cardData = [];
          window._cardData.push(a);
          html += '<div class="schedule-anime-item" onclick="openDetailByIdx(' + dataIdx + ')">' + escHtml(ttl(a)) + '</div>';
        });
      } else {
        html += '<div class="schedule-anime-item" style="opacity:0.3">—</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  } catch(e) {
    el.innerHTML = '<div class="error-message"><h3>Gagal memuat jadwal</h3></div>';
  }
}

// ── DONGHUA ───────────────────────────────────────────────────────────────────

function loadDonghuaPage() {
  _browseTab = 'donghua';
  _browsePage = 1;
  showPage('browse');
  document.querySelectorAll('#page-browse .tab-btn').forEach(function(b){
    b.classList.toggle('active', b.dataset.tab === 'donghua');
  });
  _loadBrowse();
}

// ── DETAIL ────────────────────────────────────────────────────────────────────

// Dipanggil dari card (pakai index di _cardData)
async function openDetailByIdx(idx) {
  var item = window._cardData && window._cardData[idx];
  if (!item) return;
  openDetail(slg(item), item);
}

var _currentEps = [];
var _currentTitle = '';

async function openDetail(slug, seedItem) {
  window._cardData = window._cardData || [];
  showPage('detail');
  var container = document.getElementById('detail-container');
  container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  // Tampilkan dulu dari seed item kalau ada
  if (seedItem) _renderDetailSeed(seedItem, container);

  try {
    const data = await API.getDetail(slug);
    // Merge seed + fetched data (fetched lebih prioritas)
    var merged = Object.assign({}, seedItem || {}, data || {});
    _renderDetail(merged, slug, container);
  } catch(e) {
    if (typeof reportError === 'function') reportError('openDetail slug=' + slug, e.message, e.stack);
    if (!seedItem) {
      container.innerHTML = '<div class="error-message" style="padding:80px">' +
        '<h3>Gagal memuat detail</h3><p>' + e.message + '</p>' +
        '<button class="btn-secondary" onclick="goBack()" style="margin-top:16px">← Kembali</button></div>';
    }
  }
}

function _renderDetailSeed(item, container) {
  var image = img(item);
  var title = ttl(item);
  container.innerHTML =
    '<div class="detail-hero">' +
    '<div class="detail-hero-bg" style="background-image:url(\'' + image + '\')"></div>' +
    '<div class="detail-hero-gradient"></div>' +
    '<div class="detail-content">' +
    '<div class="detail-poster"><img src="' + image + '" alt="" onerror="this.src=\'https://placehold.co/300x450/16161e/555?text=No+Image\'"></div>' +
    '<div class="detail-info">' +
    '<h1 class="detail-title">' + escHtml(title) + '</h1>' +
    '<div class="loading-spinner" style="padding:20px 0"><div class="spinner"></div></div>' +
    '</div></div></div>';
}

function _renderDetail(data, slug, container) {
  var image = img(data);
  var title = ttl(data);
  var titleEn = data.english || data.english_title || data.title_english || '';
  var desc = getSynopsis(data);
  var score = data.score || data.rating || '';
  var type = data.type || data.tipe || 'TV';
  var status = data.status || '';
  var year = data.year || data.tahun || '';
  var studio = data.studio || '';
  if (Array.isArray(studio)) studio = studio.map(function(s){ return s.name||s; }).join(', ');
  var genres = data.genres || data.genre || [];
  var genreArr = Array.isArray(genres) ? genres : (typeof genres === 'string' ? genres.split(',').map(function(s){return s.trim();}) : []);
  var eps = getEpisodes(data);

  _currentEps = eps;
  _currentTitle = title;

  // Seed _cardData entry supaya episode btn bisa trace back
  var seedIdx = (window._cardData||[]).length;
  if (!window._cardData) window._cardData = [];
  window._cardData.push(data);

  var genreHtml = genreArr.slice(0,6).map(function(g){
    return '<span class="tag">' + escHtml(typeof g === 'string' ? g : (g && (g.name||g.genre||g.slug||''))) + '</span>';
  }).join('');

  var epsHtml = '';
  if (eps.length) {
    epsHtml = '<h3 style="font-family:var(--font-display);font-size:18px;letter-spacing:1px;margin-bottom:16px">DAFTAR EPISODE (' + eps.length + ')</h3>' +
      '<div class="episodes-grid">' +
      eps.map(function(ep, i){
        var s = epSlug(ep);
        var l = epLabel(ep, i);
        return '<button class="episode-btn" onclick="openWatchEp(' + i + ')">' + escHtml(l) + '</button>';
      }).join('') + '</div>';
  } else {
    epsHtml = '<div style="text-align:center;padding:40px;color:var(--text-muted)">' +
      '<p>Daftar episode tidak tersedia dari API ini.</p>' +
      '<p style="font-size:12px;margin-top:8px">Coba cari judul yang lebih spesifik.</p></div>';
  }

  container.innerHTML =
    '<div class="detail-hero">' +
    '<div class="detail-hero-bg" style="background-image:url(\'' + image + '\')"></div>' +
    '<div class="detail-hero-gradient"></div>' +
    '<div class="detail-content">' +
    '<div class="detail-poster"><img src="' + image + '" alt="" onerror="this.src=\'https://placehold.co/300x450/16161e/555?text=No+Image\'"></div>' +
    '<div class="detail-info">' +
    '<h1 class="detail-title">' + escHtml(title) + '</h1>' +
    (titleEn ? '<div class="detail-title-en">' + escHtml(titleEn) + '</div>' : '') +
    '<div class="detail-meta-row">' +
    (score ? '<span>★ ' + parseFloat(score).toFixed(1) + '</span>' : '') +
    (type ? '<span>📺 ' + escHtml(type) + '</span>' : '') +
    (status ? '<span>🔄 ' + escHtml(status) + '</span>' : '') +
    (year ? '<span>📅 ' + escHtml(String(year)) + '</span>' : '') +
    (studio ? '<span>🏢 ' + escHtml(studio) + '</span>' : '') +
    '</div>' +
    (genreArr.length ? '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">' + genreHtml + '</div>' : '') +
    '<div class="hero-actions">' +
    (eps.length ? '<button class="btn-primary" onclick="openWatchEp(0)">▶ Tonton Sekarang</button>' : '') +
    '</div></div></div></div>' +
    '<div class="detail-body">' +
    '<button class="back-btn" onclick="goBack()">← Kembali</button>' +
    (desc ? '<h3 style="font-family:var(--font-display);font-size:18px;letter-spacing:1px;margin-bottom:8px">SINOPSIS</h3>' +
      '<p class="detail-synopsis">' + escHtml(desc) + '</p>' : '') +
    epsHtml +
    '</div>';
}

function openWatchEp(idx) {
  var ep = _currentEps[idx];
  if (!ep) return;
  var s = epSlug(ep);
  var l = epLabel(ep, idx);
  openWatch(s, l, _currentTitle, idx);
}

// ── WATCH ─────────────────────────────────────────────────────────────────────

async function openWatch(slug, label, animeTitle, epIdx) {
  showPage('watch');
  var container = document.getElementById('watch-container');
  container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  try {
    const data = await API.getEpisode(slug);
    var embedUrl = data ? getEmbedUrl(data) : '';
    var servers = data ? getServers(data) : [];

    // Jika embed kosong tapi ada serverId, coba getServer
    if (!embedUrl && data && data.serverId) {
      try {
        var sd = await API.getServer(data.serverId);
        if (sd) embedUrl = getEmbedUrl(sd);
      } catch(e) {}
    }

    var videoHtml = embedUrl
      ? '<iframe src="' + embedUrl + '" allowfullscreen allow="autoplay;encrypted-media" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"></iframe>'
      : '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;gap:12px">' +
        '<div style="font-size:48px;opacity:0.3">▶</div>' +
        '<p style="color:rgba(255,255,255,0.3);font-size:14px">Video tidak tersedia melalui embed</p>' +
        '</div>';

    var serversHtml = '';
    if (servers.length > 1) {
      serversHtml = '<p style="font-size:13px;color:var(--text-muted);margin-bottom:10px">Pilih Server:</p><div class="server-list">' +
        servers.map(function(s, i) {
          return '<button class="server-btn ' + (i===0?'active':'') + '" onclick="switchServer(this,\'' + escHtml(s.url) + '\')">' + escHtml(s.name) + '</button>';
        }).join('') + '</div>';
    }

    var epsHtml = '';
    if (_currentEps.length) {
      epsHtml = '<div style="margin-top:24px"><p style="font-family:var(--font-display);font-size:16px;letter-spacing:1px;margin-bottom:12px">EPISODE LAINNYA</p>' +
        '<div class="episodes-grid">' +
        _currentEps.map(function(ep, i) {
          var l = epLabel(ep, i);
          return '<button class="episode-btn ' + (i===epIdx?'current':'') + '" onclick="openWatchEp(' + i + ')">' + escHtml(l) + '</button>';
        }).join('') + '</div></div>';
    }

    container.innerHTML =
      '<div class="video-container">' + videoHtml + '</div>' +
      '<div class="watch-body">' +
      '<button class="back-btn" onclick="goBack()">← Kembali ke Detail</button>' +
      '<h2 class="watch-title">' + escHtml(animeTitle) + '</h2>' +
      '<p style="color:var(--text-muted);font-size:14px;margin-bottom:16px">' + escHtml(label) + '</p>' +
      serversHtml + epsHtml +
      '</div>';
  } catch(e) {
    if (typeof reportError === 'function') reportError('openWatch slug=' + slug, e.message, e.stack);
    container.innerHTML = '<div class="error-message" style="padding:80px">' +
      '<h3>Gagal memuat video</h3><p>' + escHtml(e.message) + '</p>' +
      '<button class="btn-secondary" onclick="goBack()" style="margin-top:16px">← Kembali</button></div>';
  }
}

function switchServer(btn, url) {
  document.querySelectorAll('.server-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  var iframe = document.querySelector('#watch-container iframe');
  if (iframe && url) iframe.src = url;
}

// ── Nav button handlers ───────────────────────────────────────────────────────

document.querySelectorAll('.nav-links a[data-page]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    e.preventDefault();
    var p = a.dataset.page;
    if (p === 'home') loadHome();
    else if (p === 'browse') loadBrowsePage('ongoing');
    else if (p === 'genre') loadGenrePage();
    else if (p === 'schedule') loadSchedulePage();
  });
});

// ── Init ──────────────────────────────────────────────────────────────────────
window._cardData = [];
loadHome();
