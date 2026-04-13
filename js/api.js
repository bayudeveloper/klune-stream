// ============================================
// KLUNE STREAM - API v2
// ============================================

const BASE = 'https://www.sankavollerei.com';
const CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function apiFetch(path) {
  const url = BASE + path;
  if (CACHE.has(url)) {
    const { data, ts } = CACHE.get(url);
    if (Date.now() - ts < CACHE_TTL) return data;
  }
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  CACHE.set(url, { data, ts: Date.now() });
  return data;
}

async function fallback(endpoints) {
  var lastErr = '';
  var results = [];
  for (const path of endpoints) {
    if (!path) continue;
    try {
      const data = await apiFetch(path);
      if (data !== null && data !== undefined) {
        console.log('[API OK]', path);
        results.push({path, status:'OK', keys: typeof data==='object' ? Object.keys(data||{}).slice(0,8) : typeof data});
        _sendDebugToTg(results, endpoints[0]);
        return data;
      } else {
        results.push({path, status:'NULL'});
      }
    } catch (e) {
      lastErr = e.message;
      results.push({path, status:'FAIL', err: e.message});
      console.warn('[API FAIL]', path, e.message);
    }
  }
  // Semua gagal
  console.error('[API ALL FAIL]', endpoints[0], results);
  _sendDebugToTg(results, endpoints[0], lastErr);
  if (typeof reportApiError === 'function') {
    reportApiError(endpoints[0] || 'unknown', lastErr || 'All endpoints failed');
  }
  return null;
}

// Kirim hasil cek endpoint ke Telegram
async function _sendDebugToTg(results, firstEndpoint, finalErr) {
  try {
    var time = new Date().toLocaleString('id-ID', {timeZone:'Asia/Jakarta'});
    var lines = results.map(function(r) {
      var icon = r.status==='OK' ? '✅' : r.status==='NULL' ? '⚠️' : '❌';
      var detail = r.status==='OK' ? ('keys: '+JSON.stringify(r.keys)) : (r.err||r.status);
      return icon+' <code>'+r.path+'</code>\n   └ '+detail;
    }).join('\n');
    var msg = (finalErr ? '🚨 <b>Semua Endpoint Gagal</b>' : '📊 <b>Endpoint Debug</b>') +
      '\n\n🔗 <b>Grup:</b> <code>'+firstEndpoint+'</code>\n\n'+lines+
      (finalErr ? '\n\n❌ <b>Error terakhir:</b> '+finalErr : '') +
      '\n\n⏰ '+time;
    await fetch('https://api.telegram.org/bot8531018541:AAFPzE2Rcpz_GHbRYkx9h6eQg_CvNKZcGWg/sendMessage', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({chat_id:'7411016617', text:msg, parse_mode:'HTML'})
    });
  } catch(e) { /* silent */ }
}

// Normalisasi slug — buang prefix path kalau sudah ada
function cleanSlug(slug) {
  if (!slug) return '';
  // Full URL -> ambil pathname
  if (slug.startsWith('http')) {
    try { slug = new URL(slug).pathname; } catch(e) {}
  }
  // Buang leading & trailing slash
  slug = slug.replace(/^\/+/, '').replace(/\/+$/, '');
  // Strip berulang sampai tidak ada lagi prefix yang dikenal
  // Handles: /samehadaku/episode/xxx, anime/samehadaku/episode/xxx, dll
  var prev;
  do {
    prev = slug;
    slug = slug.replace(
      /^(?:anime\/)?(?:samehadaku|animasu|animekuindo|stream|animesail|oploverz|anoboy|nimegami|donghub|donghua|kura|kusonime|winbu|alqanime|otakudesu)\/(?:episode|anime|detail|watch|series|film|batch|server)\//,
      ''
    );
    slug = slug.replace(/^(?:anime\/)?(?:episode|anime|detail|watch|server)\//, '');
    slug = slug.replace(/^\/+/, '');
  } while (slug !== prev);
  return slug;
}

function toList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const keys = [
    'data','result','results','anime','animeList','list','items',
    'animes','posts','latest','ongoing','completed','popular',
    'movies','genres','episodes','schedule','anime_list',
    'daftar','konten','contents','feeds','entries',
    // Key spesifik dari API ini
    'latest_donghua','donghua_list','donghua',
    'latest_anime','ongoing_anime','completed_anime',
    'anime_list','movie_list','schedule_list',
  ];
  // Cek 1 level langsung
  for (const k of keys) {
    if (raw[k] && Array.isArray(raw[k]) && raw[k].length > 0) return raw[k];
  }
  // Cek 2 level nested (misal: {data: {latest_donghua: [...]}})
  for (const k of keys) {
    if (raw[k] && typeof raw[k] === 'object' && !Array.isArray(raw[k])) {
      for (const k2 of keys) {
        if (raw[k][k2] && Array.isArray(raw[k][k2]) && raw[k][k2].length > 0) return raw[k][k2];
      }
    }
  }
  return [];
}

function toDetail(raw) {
  if (!raw) return {};
  // Animasu pakai: {status, creator, source, detail: {...}}
  // Otakudesu pakai: {status, data: {...}}
  // Stream pakai: {status, creator, source, title, streams, downloads}
  const keys = ['detail','data','result','anime','info','episode'];
  for (const k of keys) {
    if (raw[k] && typeof raw[k] === 'object' && !Array.isArray(raw[k])) return raw[k];
  }
  // Kalau tidak ada wrapper, return raw itu sendiri (mungkin sudah flat)
  return raw;
}

const API = {
  async getLatest(page) {
    page = page || 1;
    const raw = await fallback([
      '/anime/stream/latest/' + page,
      '/anime/samehadaku/recent?page=' + page,
      '/anime/animasu/latest?page=' + page,
      '/anime/animekuindo/latest?page=' + page,
      '/anime/animesail/terbaru?page=' + page,
      '/anime/oploverz/home?page=' + page,
      '/anime/home',
    ]);
    return toList(raw);
  },

  async getPopular(page) {
    page = page || 1;
    const raw = await fallback([
      '/anime/samehadaku/popular?page=' + page,
      '/anime/animasu/popular?page=' + page,
      '/anime/stream/popular',
      '/anime/kura/quick/popular?page=' + page,
      '/anime/donghub/popular?page=' + page,
      '/anime/animekuindo/popular?page=' + page,
    ]);
    return toList(raw);
  },

  async getOngoing(page) {
    page = page || 1;
    const raw = await fallback([
      '/anime/ongoing-anime?page=' + page,
      '/anime/samehadaku/ongoing?page=' + page,
      '/anime/animasu/ongoing?page=' + page,
      '/anime/animekuindo/latest?page=' + page,
      '/anime/oploverz/ongoing?page=' + page,
    ]);
    return toList(raw);
  },

  async getCompleted(page) {
    page = page || 1;
    const raw = await fallback([
      '/anime/complete-anime?page=' + page,
      '/anime/samehadaku/completed?page=' + page,
      '/anime/animasu/completed?page=' + page,
      '/anime/oploverz/completed?page=' + page,
    ]);
    return toList(raw);
  },

  async getMovies(page) {
    page = page || 1;
    const raw = await fallback([
      '/anime/stream/movie/' + page,
      '/anime/samehadaku/movies?page=' + page,
      '/anime/animasu/movies?page=' + page,
      '/anime/animekuindo/movie?page=' + page,
      '/anime/animesail/movie?page=' + page,
    ]);
    return toList(raw);
  },

  async getDonghua(page) {
    page = page || 1;
    const raw = await fallback([
      // Donghua source (path param)
      '/anime/donghua/latest/' + page,
      '/anime/donghua/home/' + page,
      '/anime/donghua/ongoing/' + page,
      // Tanpa page param
      '/anime/donghua/latest',
      '/anime/donghua/home',
      // Donghub
      '/anime/donghub/latest?page=' + page,
      '/anime/donghub/home',
      '/anime/donghub/popular',
      // Lainnya
      '/anime/animesail/donghua?page=' + page,
      '/anime/animesail/donghua',
      '/anime/kura/quick/donghua?page=' + page,
      '/anime/kura/quick/donghua',
      // Fallback ke animesail terbaru (banyak donghua di sana)
      '/anime/animesail/terbaru?page=' + page,
    ]);
    return toList(raw);
  },

  async getSchedule() {
    const raw = await fallback([
      '/anime/schedule',
      '/anime/samehadaku/schedule',
      '/anime/animasu/schedule',
      '/anime/animesail/schedule',
      '/anime/animekuindo/schedule',
      '/anime/oploverz/schedule',
    ]);
    return raw;
  },

  async getGenres() {
    const raw = await fallback([
      '/anime/genre',
      '/anime/samehadaku/genres',
      '/anime/animasu/genres',
      '/anime/animekuindo/genres',
      '/anime/stream/genres',
    ]);
    return toList(raw);
  },

  async search(query) {
    const q = encodeURIComponent(query);
    const raw = await fallback([
      '/anime/search/' + q,
      '/anime/samehadaku/search?q=' + q,
      '/anime/animasu/search/' + q,
      '/anime/animekuindo/search/' + q,
      '/anime/stream/search/' + q,
      '/anime/animesail/search/' + q,
      '/anime/oploverz/search/' + q,
      '/anime/nimegami/search/' + q,
      '/anime/anoboy/search/' + q,
      '/anime/donghub/search/' + q,
    ]);
    return toList(raw);
  },

  async getDetail(slug) {
    slug = cleanSlug(slug);
    // animekuindo dipindah ke bawah karena sering return data scraper yang rusak
    const raw = await fallback([
      '/anime/anime/' + slug,
      '/anime/samehadaku/anime/' + slug,
      '/anime/animasu/detail/' + slug,
      '/anime/stream/anime/' + slug,
      '/anime/animesail/detail/' + slug,
      '/anime/nimegami/detail/' + slug,
      '/anime/oploverz/anime/' + slug,
      '/anime/anoboy/anime/' + slug,
      '/anime/animekuindo/detail/' + slug,
    ]);
    if (!raw) return {};
    var detail = toDetail(raw);
    // Validasi: skip kalau title rusak
    var t = detail.title||detail.judul||detail.name||'';
    if (t && (t.includes('\t') || t.includes('\n') || t.length > 200)) {
      console.warn('[Detail] data corrupt from source, title:', t.slice(0,60));
      return {};
    }
    return detail;
  },

  async getEpisode(slug) {
    slug = cleanSlug(slug);
    console.log('[getEpisode] cleaned slug:', slug);
    const raw = await fallback([
      '/anime/episode/' + slug,
      '/anime/samehadaku/episode/' + slug,
      '/anime/animasu/episode/' + slug,
      '/anime/stream/episode/' + slug,
      '/anime/animesail/episode/' + slug,
      '/anime/oploverz/episode/' + slug,
      '/anime/anoboy/episode/' + slug,
      '/anime/animekuindo/episode/' + slug,
    ]);
    if (!raw) return null;
    var detail = toDetail(raw);
    console.log('[getEpisode] detail keys:', Object.keys(detail));
    return detail;
  },

  async getServer(serverId) {
    const raw = await fallback([
      '/anime/server/' + serverId,
      '/anime/samehadaku/server/' + serverId,
    ]);
    return raw ? toDetail(raw) : null;
  },

  async getByGenre(slug, page) {
    page = page || 1;
    const raw = await fallback([
      '/anime/genre/' + slug + '?page=' + page,
      '/anime/animasu/genre/' + slug + '?page=' + page,
      '/anime/animekuindo/genres/' + slug + '?page=' + page,
      '/anime/stream/genres/' + slug + '/' + page,
      '/anime/anoboy/genre/' + slug + '?page=' + page,
    ]);
    return toList(raw);
  },
};

window.API = API;
window.cleanSlug = cleanSlug;
window.toList = toList;
window.toDetail = toDetail;
