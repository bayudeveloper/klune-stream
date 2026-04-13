// ============================================
// KLUNE STREAM - App v3
// ============================================

// ── Data store untuk cards (hindari masalah escape di onclick) ────────────────
window._cards = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function getImg(o) {
  if (!o) return '';
  return o.poster||o.image||o.img||o.thumb||o.thumbnail||o.cover||o.foto||o.banner||o.coverImage||o.poster_url||o.image_url||'';
}
function getTitle(o) {
  if (!o) return 'Unknown';
  return o.title||o.judul||o.name||o.anime_title||o.animeTitle||o.romaji||o.english||'Unknown';
}
function getSlug(o) {
  if (!o) return '';
  return o.slug||o.animeId||o.anime_id||o.id||o.url||o.link||o.endpoint||o.href||'';
}
function getEpSlug(ep) {
  if (!ep) return '';
  return ep.slug||ep.episode_id||ep.id||ep.url||ep.link||ep.href||ep.endpoint||'';
}
function getEpLabel(ep, i) {
  if (!ep) return 'Episode '+(i+1);
  return ep.episode||ep.eps||ep.title||ep.judul||ep.name||ep.label||('Episode '+(i+1));
}
function getSynopsis(o) {
  if (!o) return '';
  return o.synopsis||o.sinopsis||o.description||o.deskripsi||o.overview||o.plot||o.summary||'';
}
function getEpisodes(o) {
  if (!o) return [];
  var e = o.episodeList||o.episodes||o.episode_list||o.listEpisode||o.list_episode||o.daftar_episode||o.eps||[];
  return Array.isArray(e) ? e : [];
}
function getEmbed(o) {
  if (!o) return '';
  var u = o.embed||o.embedUrl||o.iframe||o.iframeUrl||o.stream_url||o.streamUrl||o.url||o.link||o.src||'';
  if (!u && o.server) {
    var s = Array.isArray(o.server) ? o.server[0] : o.server;
    if (s) u = s.url||s.embed||s.iframe||s.src||s.link||'';
  }
  if (!u && o.servers) {
    var s2 = Array.isArray(o.servers) ? o.servers[0] : o.servers;
    if (s2) u = s2.url||s2.embed||s2.iframe||s2.src||s2.link||'';
  }
  return u||'';
}
function getServers(o) {
  if (!o) return [];
  var raw = o.server||o.servers||o.mirror||o.links||o.streamUrls||[];
  var arr = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  return arr.map(function(s,i){
    if (typeof s === 'string') return {name:'Server '+(i+1), url:s};
    return { name: s.name||s.server||s.quality||('Server '+(i+1)), url: s.url||s.embed||s.iframe||s.src||s.link||'' };
  }).filter(function(s){ return s.url; });
}
function ph() { return 'https://placehold.co/300x450/1f1f1f/444?text='; }

// ── Skeleton ──────────────────────────────────────────────────────────────────
function skels(n, inGrid) {
  var w = inGrid ? '' : ' style="flex-shrink:0;width:155px"';
  var h = '';
  for (var i=0; i<n; i++) {
    h += '<div class="sk-card"'+w+'><div class="sk sk-thumb"></div><div class="sk sk-line"></div><div class="sk sk-line s60"></div></div>';
  }
  return h;
}

// ── Card ──────────────────────────────────────────────────────────────────────
function card(item) {
  var idx = window._cards.length;
  window._cards.push(item);
  var image = getImg(item) || (ph() + encodeURIComponent(getTitle(item).slice(0,12)));
  var title = getTitle(item);
  var score = item.score||item.rating||item.nilai||'';
  var status = (item.status||item.tipe_status||'').toLowerCase();
  var type = (item.type||item.tipe||'').toLowerCase();
  var eps = item.total_episode||item.episodes||item.episode_count||item.totalEpisode||'';

  var badges = '';
  if (status.includes('ongoing')||status.includes('airing')||status.includes('tayang'))
    badges += '<span class="badge badge-ongoing">Ongoing</span>';
  else if (status.includes('complet')||status.includes('tamat'))
    badges += '<span class="badge badge-completed">Tamat</span>';
  if (type.includes('movie')) badges += '<span class="badge badge-movie">Movie</span>';
  if (type.includes('donghua')) badges += '<span class="badge badge-donghua">Donghua</span>';

  return '<div class="anime-card" onclick="_openDetail('+idx+')">' +
    '<div class="card-thumb">' +
    '<img src="'+esc(image)+'" alt="" loading="lazy" onerror="this.src=\''+ph()+'No+Image\'">' +
    '<div class="card-badges">'+badges+'</div>' +
    (score ? '<div class="card-score">★ '+parseFloat(score).toFixed(1)+'</div>' : '') +
    '<div class="card-overlay">' +
    '<div class="overlay-title">'+esc(title)+'</div>' +
    '<div class="overlay-btns">' +
    '<button class="overlay-btn play" onclick="event.stopPropagation();_openDetail('+idx+')"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>' +
    '<button class="overlay-btn" onclick="event.stopPropagation();_openDetail('+idx+')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg></button>' +
    '</div></div></div>' +
    '<div class="card-info"><div class="card-title">'+esc(title)+'</div>' +
    '<div class="card-sub">'+(eps ? eps+' Eps · ' : '')+(item.type||item.tipe||'Anime')+'</div>' +
    '</div></div>';
}

// ── Pages ─────────────────────────────────────────────────────────────────────
var _hist = ['home'];

function showPage(name) {
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  var el = document.getElementById('page-'+name);
  if (el) el.classList.add('active');
  document.getElementById('search-results-container').classList.remove('visible');
  document.querySelectorAll('.nav-links a').forEach(function(a){
    a.classList.toggle('active', a.dataset.page===name);
  });
  window.scrollTo({top:0, behavior:'smooth'});
  if (_hist[_hist.length-1] !== name) _hist.push(name);
}

function goBack() {
  if (_hist.length > 1) { _hist.pop(); }
  var prev = _hist[_hist.length-1]||'home';
  if (prev==='home') loadHome();
  else if (prev==='browse') showPage('browse');
  else if (prev==='genre') loadGenrePage();
  else if (prev==='schedule') loadSchedulePage();
  else showPage(prev);
}

// ── Navbar ────────────────────────────────────────────────────────────────────
window.addEventListener('scroll', function(){
  document.getElementById('navbar').classList.toggle('solid', window.scrollY > 60);
});

document.querySelectorAll('.nav-links a[data-page]').forEach(function(a){
  a.addEventListener('click', function(e){
    e.preventDefault();
    var p = a.dataset.page;
    if (p==='home') loadHome();
    else if (p==='browse') loadBrowsePage('ongoing');
    else if (p==='donghua') loadBrowsePage('donghua');
    else if (p==='genre') loadGenrePage();
    else if (p==='schedule') loadSchedulePage();
  });
});

// ── Search ────────────────────────────────────────────────────────────────────
var _stimer;
var _sinput = document.getElementById('search-input');
var _sbox = document.getElementById('search-results-container');

_sinput.addEventListener('input', function(){
  clearTimeout(_stimer);
  var q = _sinput.value.trim();
  if (!q) { _sbox.classList.remove('visible'); return; }
  _stimer = setTimeout(function(){ doSearch(q); }, 450);
});
_sinput.addEventListener('keydown', function(e){
  if (e.key==='Escape') { _sbox.classList.remove('visible'); _sinput.value=''; }
});
document.addEventListener('click', function(e){
  if (!e.target.closest('#nav-search-bar') && !e.target.closest('#search-results-container'))
    _sbox.classList.remove('visible');
});

async function doSearch(q) {
  _sbox.innerHTML = '<div class="search-label">Mencari "'+esc(q)+'"...</div><div class="search-grid">'+skels(8)+'</div>';
  _sbox.classList.add('visible');
  try {
    var list = await API.search(q);
    if (!list||!list.length) { _sbox.innerHTML='<div class="search-label">Tidak ada hasil untuk "'+esc(q)+'"</div>'; return; }
    _sbox.innerHTML='<div class="search-label">'+list.length+' hasil untuk "'+esc(q)+'"</div><div class="search-grid">'+list.map(card).join('')+'</div>';
  } catch(e) {
    _sbox.innerHTML='<div class="search-label">Gagal mencari</div>';
    if (typeof reportError==='function') reportError('search q='+q, e.message);
  }
}

// ── HOME ──────────────────────────────────────────────────────────────────────
async function loadHome() {
  window._cards = [];
  showPage('home');
  _loadHero();
  _loadRow('row-latest', function(){ return API.getLatest(); });
  _loadRow('row-popular', function(){ return API.getPopular(); });
  _loadRow('row-ongoing', function(){ return API.getOngoing(); });
  _loadRow('row-donghua', function(){ return API.getDonghua(); });
  _loadRow('row-movies', function(){ return API.getMovies(); });
}

async function _loadHero() {
  var el = document.getElementById('hero-section');
  if (!el) return;
  try {
    var list = await API.getLatest();
    if (!list||!list.length) return;
    var item = list[0];
    var idx = window._cards.length;
    window._cards.push(item);
    var image = getImg(item)||(ph()+encodeURIComponent(getTitle(item).slice(0,12)));
    var title = getTitle(item);
    var desc = getSynopsis(item);
    var score = item.score||item.rating||'';
    var eps = item.total_episode||item.episodes||'';
    var year = item.year||item.tahun||'';

    el.innerHTML =
      '<div class="hero-bg" style="background-image:url(\''+esc(image)+'\')"></div>' +
      '<div class="hero-vignette"></div>' +
      '<div class="hero-content">' +
      '<h1 class="hero-title">'+esc(title)+'</h1>' +
      '<div class="hero-meta">' +
      (score ? '<span class="hero-match">'+Math.round(parseFloat(score)*10)+'% Match</span>' : '<span class="hero-match">New</span>') +
      (year ? '<span class="hero-year">'+esc(String(year))+'</span>' : '') +
      (eps ? '<span class="hero-eps">'+esc(String(eps))+' Eps</span>' : '') +
      '</div>' +
      (desc ? '<p class="hero-desc">'+esc(desc.slice(0,200))+(desc.length>200?'...':'')+'</p>' : '') +
      '<div class="hero-btns">' +
      '<button class="btn btn-play" onclick="_openDetail('+idx+')"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Tonton</button>' +
      '<button class="btn btn-info" onclick="_openDetail('+idx+')"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg> Info</button>' +
      '</div></div>';
  } catch(e) { console.warn('hero error', e); }
}

async function _loadRow(id, fn) {
  var el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = skels(8);
  try {
    var list = await fn();
    if (!list||!list.length) { el.innerHTML='<div class="err"><p>Tidak ada data</p></div>'; return; }
    el.innerHTML = list.slice(0,20).map(card).join('');
  } catch(e) {
    el.innerHTML='<div class="err"><p>Gagal memuat</p></div>';
    if (typeof reportError==='function') reportError('loadRow id='+id, e.message);
  }
}

// ── BROWSE ────────────────────────────────────────────────────────────────────
var _btab = 'ongoing', _bpage = 1;

async function loadBrowsePage(tab) {
  window._cards = [];
  _btab = tab||'ongoing'; _bpage = 1;
  showPage('browse');
  document.querySelectorAll('#page-browse .tab-btn').forEach(function(b){
    b.classList.toggle('active', b.dataset.tab===_btab);
  });
  await _loadBrowse();
}

async function _loadBrowse() {
  var g = document.getElementById('browse-grid');
  g.innerHTML = skels(18, true);
  try {
    var list;
    if (_btab==='ongoing') list = await API.getOngoing(_bpage);
    else if (_btab==='completed') list = await API.getCompleted(_bpage);
    else if (_btab==='movies') list = await API.getMovies(_bpage);
    else if (_btab==='popular') list = await API.getPopular(_bpage);
    else if (_btab==='donghua') list = await API.getDonghua(_bpage);
    else list = [];
    if (!list||!list.length) { g.innerHTML='<div class="err"><h3>Tidak ada data</h3></div>'; return; }
    g.innerHTML = list.map(card).join('');
    _renderPg();
  } catch(e) {
    g.innerHTML='<div class="err"><h3>Gagal memuat</h3></div>';
    if (typeof reportError==='function') reportError('browse tab='+_btab, e.message);
  }
}

function _renderPg() {
  var el = document.getElementById('browse-pg');
  if (!el) return;
  var c=_bpage, max=20;
  var h = '<button class="pg-btn" onclick="changePage('+(c-1)+')" '+(c<=1?'disabled':'')+'>‹</button>';
  var s=Math.max(1,c-2), e=Math.min(max,c+2);
  for (var i=s;i<=e;i++) h+='<button class="pg-btn '+(i===c?'active':'')+'" onclick="changePage('+i+')">'+i+'</button>';
  h+='<button class="pg-btn" onclick="changePage('+(c+1)+')" '+(c>=max?'disabled':'')+'>›</button>';
  el.innerHTML = h;
}

function changePage(p) {
  if (p<1) return;
  _bpage=p; _loadBrowse();
  window.scrollTo({top:0,behavior:'smooth'});
}

// ── GENRE ─────────────────────────────────────────────────────────────────────
async function loadGenrePage() {
  window._cards = [];
  showPage('genre');
  var listEl = document.getElementById('genre-list');
  var gridEl = document.getElementById('genre-anime-grid');
  listEl.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  gridEl.innerHTML = '<div class="err"><p>Pilih genre untuk melihat anime</p></div>';
  try {
    var genres = await API.getGenres();
    if (!genres||!genres.length) { listEl.innerHTML='<div class="err"><p>Gagal memuat</p></div>'; return; }
    listEl.innerHTML = genres.map(function(g,i){
      var name = typeof g==='string' ? g : (g.name||g.genre||g.slug||g.id||'Genre '+(i+1));
      var slug = typeof g==='string' ? g : (g.slug||g.id||g.name||name);
      return '<button class="genre-chip" data-slug="'+esc(slug)+'" onclick="loadGenreAnime(\''+esc(slug)+'\',\''+esc(name)+'\')">'+esc(name)+'</button>';
    }).join('');
  } catch(e) {
    listEl.innerHTML='<div class="err"><p>Gagal memuat genre</p></div>';
  }
}

async function loadGenreAnime(slug, name) {
  document.querySelectorAll('.genre-chip').forEach(function(c){ c.classList.remove('active'); });
  var a = document.querySelector('.genre-chip[data-slug="'+slug+'"]');
  if (a) a.classList.add('active');
  var g = document.getElementById('genre-anime-grid');
  g.innerHTML = skels(12, true);
  try {
    var list = await API.getByGenre(slug);
    if (!list||!list.length) { g.innerHTML='<div class="err"><p>Tidak ada anime</p></div>'; return; }
    g.innerHTML = list.map(card).join('');
  } catch(e) {
    g.innerHTML='<div class="err"><p>Gagal memuat</p></div>';
  }
}

// ── SCHEDULE ──────────────────────────────────────────────────────────────────
async function loadSchedulePage() {
  window._cards = [];
  showPage('schedule');
  var el = document.getElementById('sched-container');
  el.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  try {
    var raw = await API.getSchedule();
    var data = (raw&&(raw.data||raw.schedule||raw))||{};
    var isArr = Array.isArray(data);
    var days = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
    var keys = ['senin','selasa','rabu','kamis','jumat','sabtu','minggu'];
    var today = (new Date().getDay()+6)%7;
    var html = '<div class="schedule-grid">';
    keys.forEach(function(k,i){
      var animes = isArr
        ? data.filter(function(a){ return (a.day||a.hari||'').toLowerCase()===k; })
        : (data[k]||data[days[i]]||data[days[i].toLowerCase()]||[]);
      html += '<div class="sched-day '+(i===today?'today':'')+'">' +
        '<div class="sched-day-name">'+days[i]+(i===today?' ●':'')+'</div>';
      if (Array.isArray(animes)&&animes.length) {
        animes.forEach(function(a){
          var idx = window._cards.length;
          window._cards.push(a);
          html += '<div class="sched-item" onclick="_openDetail('+idx+')">'+esc(getTitle(a))+'</div>';
        });
      } else {
        html += '<div class="sched-item" style="opacity:.3">—</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  } catch(e) {
    el.innerHTML='<div class="err"><h3>Gagal memuat jadwal</h3></div>';
  }
}

// ── DETAIL ────────────────────────────────────────────────────────────────────
var _curEps = [];
var _curTitle = '';

function _openDetail(idx) {
  var item = window._cards[idx];
  if (!item) return;
  openDetail(getSlug(item), item);
}

async function openDetail(slug, seed) {
  window._cards = window._cards||[];
  showPage('detail');
  var c = document.getElementById('detail-container');
  c.innerHTML = '<div class="spinner-wrap" style="min-height:400px"><div class="spinner"></div></div>';
  if (seed) _renderDetailSeed(seed, c);
  try {
    var data = await API.getDetail(slug);
    var merged = Object.assign({}, seed||{}, data||{});
    _renderDetail(merged, slug, c);
  } catch(e) {
    if (typeof reportError==='function') reportError('openDetail slug='+slug, e.message, e.stack);
    if (!seed) {
      c.innerHTML='<div class="err" style="padding:80px"><h3>Gagal memuat detail</h3><p>'+esc(e.message)+'</p>'+
        '<button class="btn btn-ghost" onclick="goBack()" style="margin-top:16px">← Kembali</button></div>';
    }
  }
}

function _renderDetailSeed(item, c) {
  var image = getImg(item)||(ph()+encodeURIComponent(getTitle(item).slice(0,12)));
  var title = getTitle(item);
  c.innerHTML =
    '<div class="detail-hero">' +
    '<div class="detail-hero-bg" style="background-image:url(\''+esc(image)+'\')"></div>' +
    '<div class="detail-hero-vignette"></div>' +
    '<div class="detail-layout">' +
    '<div class="detail-poster"><img src="'+esc(image)+'" alt="" onerror="this.src=\''+ph()+'No+Image\'"></div>' +
    '<div class="detail-info"><h1 class="detail-title">'+esc(title)+'</h1>' +
    '<div class="spinner-wrap" style="padding:16px 0"><div class="spinner"></div></div>' +
    '</div></div></div>';
}

function _renderDetail(data, slug, c) {
  var image = getImg(data)||(ph()+encodeURIComponent(getTitle(data).slice(0,12)));
  var title = getTitle(data);
  var titleEn = data.english||data.english_title||data.title_english||'';
  var desc = getSynopsis(data);
  var score = data.score||data.rating||'';
  var type = data.type||data.tipe||'TV';
  var status = data.status||'';
  var year = data.year||data.tahun||'';
  var studio = data.studio||'';
  if (Array.isArray(studio)) studio = studio.map(function(s){ return s.name||s; }).join(', ');
  var genres = data.genres||data.genre||[];
  var ga = Array.isArray(genres) ? genres : (typeof genres==='string' ? genres.split(',').map(function(s){ return s.trim(); }) : []);
  var eps = getEpisodes(data);
  _curEps = eps;
  _curTitle = title;

  var idx = window._cards.length;
  window._cards.push(data);

  var genreHtml = ga.slice(0,6).map(function(g){
    return '<span class="detail-tag">'+esc(typeof g==='string'?g:(g&&(g.name||g.genre||g.slug||'')))+'</span>';
  }).join('');

  var epsHtml = '';
  if (eps.length) {
    epsHtml = '<div class="detail-section-title">Episode ('+eps.length+')</div>' +
      '<div class="episodes-grid">' +
      eps.map(function(ep,i){
        return '<button class="ep-btn" onclick="openWatchEp('+i+')">'+esc(getEpLabel(ep,i))+'</button>';
      }).join('') + '</div>';
  } else {
    epsHtml = '<div class="err"><p>Daftar episode tidak tersedia dari sumber ini.</p></div>';
  }

  c.innerHTML =
    '<div class="detail-hero">' +
    '<div class="detail-hero-bg" style="background-image:url(\''+esc(image)+'\')"></div>' +
    '<div class="detail-hero-vignette"></div>' +
    '<div class="detail-layout">' +
    '<div class="detail-poster"><img src="'+esc(image)+'" alt="" onerror="this.src=\''+ph()+'No+Image\'"></div>' +
    '<div class="detail-info">' +
    '<h1 class="detail-title">'+esc(title)+'</h1>' +
    (titleEn ? '<div class="detail-title-en">'+esc(titleEn)+'</div>' : '') +
    '<div class="detail-meta">' +
    (score ? '<span>★ '+parseFloat(score).toFixed(1)+'</span>' : '') +
    (type ? '<span>'+esc(type)+'</span>' : '') +
    (status ? '<span>'+esc(status)+'</span>' : '') +
    (year ? '<span>'+esc(String(year))+'</span>' : '') +
    (studio ? '<span>'+esc(typeof studio==='string'?studio:String(studio))+'</span>' : '') +
    '</div>' +
    (ga.length ? '<div class="detail-tags">'+genreHtml+'</div>' : '') +
    '<div class="hero-btns">' +
    (eps.length ? '<button class="btn btn-play" onclick="openWatchEp(0)"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Tonton</button>' : '') +
    '</div></div></div></div>' +
    '<div class="detail-body">' +
    '<button class="back-btn" onclick="goBack()">← Kembali</button>' +
    (desc ? '<div class="detail-section-title">Sinopsis</div><p class="detail-synopsis">'+esc(desc)+'</p>' : '') +
    epsHtml +
    '</div>';
}

function openWatchEp(i) {
  var ep = _curEps[i];
  if (!ep) return;
  openWatch(getEpSlug(ep), getEpLabel(ep,i), _curTitle, i);
}

// ── WATCH ─────────────────────────────────────────────────────────────────────
async function openWatch(slug, label, title, epIdx) {
  showPage('watch');
  var c = document.getElementById('watch-container');
  c.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  try {
    var data = await API.getEpisode(slug);
    var embed = data ? getEmbed(data) : '';
    var servers = data ? getServers(data) : [];
    if (!embed && data && data.serverId) {
      try {
        var sd = await API.getServer(data.serverId);
        if (sd) embed = getEmbed(sd);
      } catch(e2) {}
    }
    var videoHtml = embed
      ? '<iframe src="'+esc(embed)+'" allowfullscreen allow="autoplay;encrypted-media" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"></iframe>'
      : '<div class="video-placeholder"><svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9-5 3V9l5 3z"/></svg><p>Video tidak tersedia via embed</p></div>';

    var svHtml = '';
    if (servers.length>1) {
      svHtml = '<p style="font-size:12px;color:var(--gray3);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Server</p>' +
        '<div class="server-list">' +
        servers.map(function(s,i){
          return '<button class="sv-btn '+(i===0?'active':'')+'" onclick="switchSv(this,\''+esc(s.url)+'\')">'+esc(s.name)+'</button>';
        }).join('') + '</div>';
    }

    var epsHtml = '';
    if (_curEps.length) {
      epsHtml = '<div class="detail-section-title" style="margin-top:24px">Episode Lainnya</div>' +
        '<div class="episodes-grid">' +
        _curEps.map(function(ep,i){
          return '<button class="ep-btn '+(i===epIdx?'current':'')+'" onclick="openWatchEp('+i+')">'+esc(getEpLabel(ep,i))+'</button>';
        }).join('') + '</div>';
    }

    c.innerHTML =
      '<div class="video-wrap">'+videoHtml+'</div>' +
      '<div class="watch-body">' +
      '<button class="back-btn" onclick="goBack()">← Kembali</button>' +
      '<h2 class="watch-title">'+esc(title)+'</h2>' +
      '<p class="watch-ep">'+esc(label)+'</p>' +
      svHtml + epsHtml +
      '</div>';
  } catch(e) {
    if (typeof reportError==='function') reportError('openWatch slug='+slug, e.message, e.stack);
    c.innerHTML='<div class="err" style="padding:80px"><h3>Gagal memuat video</h3><p>'+esc(e.message)+'</p>'+
      '<button class="btn btn-ghost" onclick="goBack()" style="margin-top:16px">← Kembali</button></div>';
  }
}

function switchSv(btn, url) {
  document.querySelectorAll('.sv-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  var iframe = document.querySelector('#watch-container iframe');
  if (iframe && url) iframe.src = url;
}

// ── Alias untuk backward compat (tombol di HTML yang masih pakai nama lama) ──
var loadHomePage = loadHome;
var loadBrowsePageAlias = loadBrowsePage;

// ── Init ──────────────────────────────────────────────────────────────────────
window._cards = [];
loadHome();
