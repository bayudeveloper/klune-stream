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
  for (const path of endpoints) {
    if (!path) continue;
    try {
      const data = await apiFetch(path);
      if (data !== null && data !== undefined) {
        console.log('[API OK]', path);
        return data;
      }
    } catch (e) {
      lastErr = e.message;
      console.warn('[API FAIL]', path, e.message);
    }
  }
  if (typeof reportApiError === 'function') {
    reportApiError(endpoints[0] || 'unknown', lastErr || 'All endpoints failed');
  }
  return null;
}

// Normalisasi slug — buang prefix path kalau sudah ada
function cleanSlug(slug) {
  if (!slug) return '';
  // Kalau slug adalah full URL, ambil bagian terakhir
  if (slug.startsWith('http')) {
    try { slug = new URL(slug).pathname; } catch(e) {}
  }
  // Buang leading slash
  slug = slug.replace(/^\/+/, '');
  // Buang prefix yang umum dari berbagai source
  const prefixes = [
    'anime/episode/', 'anime/anime/', 'anime/samehadaku/episode/',
    'anime/samehadaku/anime/', 'anime/animasu/episode/', 'anime/animasu/detail/',
    'anime/animekuindo/episode/', 'anime/animekuindo/detail/',
    'anime/stream/episode/', 'anime/stream/anime/',
    'anime/animesail/episode/', 'anime/animesail/detail/',
    'anime/oploverz/episode/', 'anime/oploverz/anime/',
    'anime/anoboy/episode/', 'anime/anoboy/anime/',
    'anime/nimegami/episode/', 'anime/nimegami/detail/',
  ];
  for (const p of prefixes) {
    if (slug.startsWith(p)) { slug = slug.slice(p.length); break; }
  }
  return slug;
}

function toList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const keys = [
    'data','result','results','anime','animeList','list','items',
    'animes','posts','latest','ongoing','completed','popular',
    'movies','donghua','genres','episodes','schedule',
  ];
  for (const k of keys) {
    if (raw[k] && Array.isArray(raw[k])) return raw[k];
    if (raw[k] && typeof raw[k] === 'object') {
      for (const k2 of keys) {
        if (raw[k][k2] && Array.isArray(raw[k][k2])) return raw[k][k2];
      }
    }
  }
  return [];
}

function toDetail(raw) {
  if (!raw) return {};
  const keys = ['data','result','anime','detail','info','episode'];
  for (const k of keys) {
    if (raw[k] && typeof raw[k] === 'object' && !Array.isArray(raw[k])) return raw[k];
  }
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
      '/anime/donghua/latest/' + page,
      '/anime/donghua/home/' + page,
      '/anime/donghub/latest?page=' + page,
      '/anime/animesail/donghua?page=' + page,
      '/anime/kura/quick/donghua?page=' + page,
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
    const raw = await fallback([
      '/anime/anime/' + slug,
      '/anime/samehadaku/anime/' + slug,
      '/anime/animasu/detail/' + slug,
      '/anime/animekuindo/detail/' + slug,
      '/anime/stream/anime/' + slug,
      '/anime/animesail/detail/' + slug,
      '/anime/nimegami/detail/' + slug,
      '/anime/oploverz/anime/' + slug,
      '/anime/anoboy/anime/' + slug,
    ]);
    return raw ? toDetail(raw) : {};
  },

  async getEpisode(slug) {
    slug = cleanSlug(slug);
    const raw = await fallback([
      '/anime/episode/' + slug,
      '/anime/samehadaku/episode/' + slug,
      '/anime/animasu/episode/' + slug,
      '/anime/animekuindo/episode/' + slug,
      '/anime/stream/episode/' + slug,
      '/anime/animesail/episode/' + slug,
      '/anime/oploverz/episode/' + slug,
      '/anime/anoboy/episode/' + slug,
    ]);
    return raw ? toDetail(raw) : null;
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
