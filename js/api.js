// ============================================
// KLUNE STREAM - API Configuration & Fallback
// Base URL: https://www.sankavollerei.com
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
  // Semua endpoint gagal — kirim ke Telegram
  if (typeof reportApiError === 'function') {
    reportApiError(endpoints[0] || 'unknown', lastErr || 'All endpoints failed');
  }
  return null;
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

function pick(obj) {
  const keys = Array.prototype.slice.call(arguments, 1);
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return null;
}

function normalizeItem(item) {
  if (!item || typeof item !== 'object') return null;
  return {
    _raw: item,
    title: pick(item,'title','judul','name','anime_title','animeTitle','romaji','english','native') || 'Unknown',
    slug: pick(item,'slug','animeId','anime_id','id','url','link','endpoint','href','path') || '',
    image: pick(item,'poster','image','img','thumb','thumbnail','cover','foto','banner','coverImage','poster_url','image_url') || '',
    score: pick(item,'score','rating','nilai','rate','mal_score') || '',
    status: pick(item,'status','tipe_status','airing_status') || '',
    type: pick(item,'type','tipe','format') || '',
    totalEpisode: pick(item,'total_episode','episodes','episode_count','totalEpisode','jumlah_episode','eps','total_eps') || '',
    synopsis: pick(item,'synopsis','sinopsis','description','deskripsi','overview','plot','summary') || '',
    genres: (function() {
      const g = pick(item,'genres','genre','genreList','genre_list','tags');
      if (!g) return [];
      if (Array.isArray(g)) return g.map(function(x){ return typeof x === 'string' ? x : (x && (x.name || x.genre || x.slug || '')); });
      if (typeof g === 'string') return g.split(',').map(function(s){ return s.trim(); });
      return [];
    })(),
    episodes: (function() {
      const e = pick(item,'episodeList','episodes','episode_list','listEpisode','list_episode','eps','daftar_episode','episode');
      return Array.isArray(e) ? e : [];
    })(),
  };
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
      '/anime/anoboy/home?page=' + page,
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
      '/anime/kura/properties/genre',
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
window.normalizeItem = normalizeItem;
window.toList = toList;
window.toDetail = toDetail;
