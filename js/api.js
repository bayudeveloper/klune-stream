// ============================================
// KLUNE STREAM - API Configuration & Fallback
// Base URL: https://www.sankavollerei.com
// ============================================

const BASE = 'https://www.sankavollerei.com';

// All available anime sources with priority order
const ANIME_SOURCES = {
  otakudesu: {
    name: 'Otakudesu',
    home: '/anime/home',
    schedule: '/anime/schedule',
    detail: (slug) => `/anime/anime/${slug}`,
    ongoing: '/anime/ongoing-anime',
    completed: '/anime/complete-anime',
    genres: '/anime/genre',
    genreDetail: (slug) => `/anime/genre/${slug}`,
    episode: (slug) => `/anime/episode/${slug}`,
    search: (q) => `/anime/search/${q}`,
    batch: (slug) => `/anime/batch/${slug}`,
    server: (id) => `/anime/server/${id}`,
    unlimited: '/anime/unlimited',
  },
  samehadaku: {
    name: 'Samehadaku',
    home: '/anime/samehadaku/home',
    recent: '/anime/samehadaku/recent',
    ongoing: '/anime/samehadaku/ongoing',
    completed: '/anime/samehadaku/completed',
    popular: '/anime/samehadaku/popular',
    movies: '/anime/samehadaku/movies',
    list: '/anime/samehadaku/list',
    genres: '/anime/samehadaku/genres',
    genreDetail: (id) => `/anime/samehadaku/genres/${id}`,
    detail: (id) => `/anime/samehadaku/anime/${id}`,
    episode: (id) => `/anime/samehadaku/episode/${id}`,
    batch: '/anime/samehadaku/batch',
    batchDetail: (id) => `/anime/samehadaku/batch/${id}`,
    schedule: '/anime/samehadaku/schedule',
    server: (id) => `/anime/samehadaku/server/${id}`,
  },
  animasu: {
    name: 'Animasu',
    home: '/anime/animasu/home',
    popular: '/anime/animasu/popular',
    movies: '/anime/animasu/movies',
    ongoing: '/anime/animasu/ongoing',
    completed: '/anime/animasu/completed',
    latest: '/anime/animasu/latest',
    search: (q) => `/anime/animasu/search/${q}`,
    animelist: '/anime/animasu/animelist',
    advancedSearch: '/anime/animasu/advanced-search',
    genres: '/anime/animasu/genres',
    genreDetail: (slug) => `/anime/animasu/genre/${slug}`,
    characters: '/anime/animasu/characters',
    characterDetail: (slug) => `/anime/animasu/character/${slug}`,
    schedule: '/anime/animasu/schedule',
    detail: (slug) => `/anime/animasu/detail/${slug}`,
    episode: (slug) => `/anime/animasu/episode/${slug}`,
  },
  animekuindo: {
    name: 'Animekuindo',
    home: '/anime/animekuindo/home',
    schedule: '/anime/animekuindo/schedule',
    latest: '/anime/animekuindo/latest',
    popular: '/anime/animekuindo/popular',
    movie: '/anime/animekuindo/movie',
    search: (q) => `/anime/animekuindo/search/${q}`,
    genres: '/anime/animekuindo/genres',
    genreDetail: (slug) => `/anime/animekuindo/genres/${slug}`,
    seasons: '/anime/animekuindo/seasons',
    seasonDetail: (slug) => `/anime/animekuindo/seasons/${slug}`,
    detail: (slug) => `/anime/animekuindo/detail/${slug}`,
    episode: (slug) => `/anime/animekuindo/episode/${slug}`,
  },
  nimegami: {
    name: 'Nimegami',
    home: '/anime/nimegami/home',
    search: (q) => `/anime/nimegami/search/${q}`,
    detail: (slug) => `/anime/nimegami/detail/${slug}`,
    animeList: '/anime/nimegami/anime-list',
    genreList: '/anime/nimegami/genre/list',
    genreDetail: (slug) => `/anime/nimegami/genre/${slug}`,
    seasonList: '/anime/nimegami/seasons/list',
    seasonDetail: (slug) => `/anime/nimegami/seasons/${slug}`,
    typeList: '/anime/nimegami/type/list',
    typeDetail: (slug) => `/anime/nimegami/type/${slug}`,
    jdrama: '/anime/nimegami/j-drama',
    liveAction: '/anime/nimegami/live-action',
    liveActionDetail: (slug) => `/anime/nimegami/live-action/${slug}`,
    dramaDetail: (slug) => `/anime/nimegami/drama/${slug}`,
  },
  stream: {
    name: 'Stream',
    latest: (page = 1) => `/anime/stream/latest/${page}`,
    popular: '/anime/stream/popular',
    search: (q) => `/anime/stream/search/${q}`,
    detail: (slug) => `/anime/stream/anime/${slug}`,
    episode: (slug) => `/anime/stream/episode/${slug}`,
    movie: (page = 1) => `/anime/stream/movie/${page}`,
    list: '/anime/stream/list',
    genres: '/anime/stream/genres',
    genreDetail: (slug, page = 1) => `/anime/stream/genres/${slug}/${page}`,
  },
  oploverz: {
    name: 'Oploverz',
    home: '/anime/oploverz/home',
    schedule: '/anime/oploverz/schedule',
    ongoing: '/anime/oploverz/ongoing',
    completed: '/anime/oploverz/completed',
    list: '/anime/oploverz/list',
    search: (q) => `/anime/oploverz/search/${q}`,
    detail: (slug) => `/anime/oploverz/anime/${slug}`,
    episode: (slug) => `/anime/oploverz/episode/${slug}`,
  },
  anoboy: {
    name: 'Anoboy',
    home: '/anime/anoboy/home',
    search: (q) => `/anime/anoboy/search/${q}`,
    detail: (slug) => `/anime/anoboy/anime/${slug}`,
    episode: (slug) => `/anime/anoboy/episode/${slug}`,
    azList: '/anime/anoboy/az-list',
    list: '/anime/anoboy/list',
    genreDetail: (slug) => `/anime/anoboy/genre/${slug}`,
    genres: '/anime/anoboy/genres',
  },
  animesail: {
    name: 'AnimeSail',
    home: '/anime/animesail/home',
    terbaru: '/anime/animesail/terbaru',
    donghua: '/anime/animesail/donghua',
    movie: '/anime/animesail/movie',
    schedule: '/anime/animesail/schedule',
    list: '/anime/animesail/list',
    search: (q) => `/anime/animesail/search/${q}`,
    genres: '/anime/animesail/genres',
    genreDetail: (slug) => `/anime/animesail/genre/${slug}`,
    seasonDetail: (slug) => `/anime/animesail/season/${slug}`,
    studioDetail: (slug) => `/anime/animesail/studio/${slug}`,
    detail: (slug) => `/anime/animesail/detail/${slug}`,
    episode: (slug) => `/anime/animesail/episode/${slug}`,
  },
  kuramanime: {
    name: 'Kuramanime',
    home: '/anime/kura/home',
    search: (q) => `/anime/kura/search/${q}`,
    detail: (id, slug) => `/anime/kura/anime/${id}/${slug}`,
    watch: (id, slug, ep) => `/anime/kura/watch/${id}/${slug}/${ep}`,
    batch: (id, slug, batchId) => `/anime/kura/batch/${id}/${slug}/${batchId}`,
    animeList: '/anime/kura/anime-list',
    schedule: '/anime/kura/schedule',
    popular: '/anime/kura/quick/popular',
    ongoing: '/anime/kura/quick/ongoing',
    finished: '/anime/kura/quick/finished',
    movie: '/anime/kura/quick/movie',
    donghua: '/anime/kura/quick/donghua',
    genreList: '/anime/kura/properties/genre',
    genreDetail: (slug) => `/anime/kura/properties/genre/${slug}`,
    seasonList: '/anime/kura/properties/season',
    seasonDetail: (slug) => `/anime/kura/properties/season/${slug}`,
    studioList: '/anime/kura/properties/studio',
    studioDetail: (slug) => `/anime/kura/properties/studio/${slug}`,
    typeList: '/anime/kura/properties/type',
    typeDetail: (slug) => `/anime/kura/properties/type/${slug}`,
    qualityList: '/anime/kura/properties/quality',
    qualityDetail: (slug) => `/anime/kura/properties/quality/${slug}`,
    sourceList: '/anime/kura/properties/source',
    sourceDetail: (slug) => `/anime/kura/properties/source/${slug}`,
    countryList: '/anime/kura/properties/country',
    countryDetail: (slug) => `/anime/kura/properties/country/${slug}`,
  },
  kusonime: {
    name: 'Kusonime',
    latest: '/anime/kusonime/latest',
    allAnime: '/anime/kusonime/all-anime',
    movie: '/anime/kusonime/movie',
    typeDetail: (type) => `/anime/kusonime/type/${type}`,
    allGenres: '/anime/kusonime/all-genres',
    allSeasons: '/anime/kusonime/all-seasons',
    search: (q) => `/anime/kusonime/search/${q}`,
    genreDetail: (slug) => `/anime/kusonime/genre/${slug}`,
    seasonDetail: (season, year) => `/anime/kusonime/season/${season}/${year}`,
    detail: (slug) => `/anime/kusonime/detail/${slug}`,
  },
  donghub: {
    name: 'Donghub',
    home: '/anime/donghub/home',
    latest: '/anime/donghub/latest',
    popular: '/anime/donghub/popular',
    movie: '/anime/donghub/movie',
    schedule: '/anime/donghub/schedule',
    search: (q) => `/anime/donghub/search/${q}`,
    genreDetail: (slug) => `/anime/donghub/genre/${slug}`,
    list: (slug) => `/anime/donghub/list/${slug}`,
    detail: (slug) => `/anime/donghub/detail/${slug}`,
    episode: (slug) => `/anime/donghub/episode/${slug}`,
  },
  donghua: {
    name: 'Donghua',
    home: (page = 1) => `/anime/donghua/home/${page}`,
    ongoing: (page = 1) => `/anime/donghua/ongoing/${page}`,
    completed: (page = 1) => `/anime/donghua/completed/${page}`,
    latest: (page = 1) => `/anime/donghua/latest/${page}`,
    schedule: '/anime/donghua/schedule',
    azList: (slug, page = 1) => `/anime/donghua/az-list/${slug}/${page}`,
    search: (q, page = 1) => `/anime/donghua/search/${q}/${page}`,
    detail: (slug) => `/anime/donghua/detail/${slug}`,
    episode: (slug) => `/anime/donghua/episode/${slug}`,
    genres: '/anime/donghua/genres',
    genreDetail: (slug, page = 1) => `/anime/donghua/genres/${slug}/${page}`,
    seasonDetail: (year) => `/anime/donghua/seasons/${year}`,
  },
};

// ============================================
// FETCH WITH FALLBACK
// ============================================

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function apiFetch(path, useCache = true) {
  const url = BASE + path;
  const cacheKey = url;

  if (useCache && cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL) return data;
  }

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (useCache) cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    console.warn(`[API] Failed: ${url}`, err.message);
    throw err;
  }
}

// Try multiple endpoints, return first success
async function fetchWithFallback(endpoints) {
  for (const path of endpoints) {
    if (!path) continue;
    try {
      const data = await apiFetch(path);
      if (data && (data.data || data.result || data.anime || Array.isArray(data) || data.status === 'ok' || data.ok)) {
        return { data, source: path };
      }
    } catch {}
  }
  return null;
}

// ============================================
// UNIFIED API METHODS
// ============================================

const API = {
  // HOME - latest releases fallback chain
  async getHome() {
    return fetchWithFallback([
      ANIME_SOURCES.otakudesu.home,
      ANIME_SOURCES.samehadaku.home,
      ANIME_SOURCES.animasu.home,
      ANIME_SOURCES.animesail.home,
      ANIME_SOURCES.animekuindo.home,
    ]);
  },

  // LATEST / RECENT
  async getLatest(page = 1) {
    return fetchWithFallback([
      `${ANIME_SOURCES.stream.latest(page)}`,
      `${ANIME_SOURCES.samehadaku.recent}?page=${page}`,
      `${ANIME_SOURCES.animasu.latest}?page=${page}`,
      `${ANIME_SOURCES.animekuindo.latest}?page=${page}`,
      `${ANIME_SOURCES.nimegami.home}?page=${page}`,
    ]);
  },

  // POPULAR
  async getPopular(page = 1) {
    return fetchWithFallback([
      `${ANIME_SOURCES.stream.popular}`,
      `${ANIME_SOURCES.samehadaku.popular}?page=${page}`,
      `${ANIME_SOURCES.animasu.popular}?page=${page}`,
      `${ANIME_SOURCES.kuramanime.popular}?page=${page}`,
      `${ANIME_SOURCES.donghub.popular}?page=${page}`,
    ]);
  },

  // ONGOING
  async getOngoing(page = 1) {
    return fetchWithFallback([
      `${ANIME_SOURCES.otakudesu.ongoing}?page=${page}`,
      `${ANIME_SOURCES.samehadaku.ongoing}?page=${page}`,
      `${ANIME_SOURCES.animasu.ongoing}?page=${page}`,
      `${ANIME_SOURCES.animekuindo.latest}?page=${page}`,
      `${ANIME_SOURCES.oploverz.ongoing}?page=${page}`,
    ]);
  },

  // COMPLETED
  async getCompleted(page = 1) {
    return fetchWithFallback([
      `${ANIME_SOURCES.otakudesu.completed}?page=${page}`,
      `${ANIME_SOURCES.samehadaku.completed}?page=${page}`,
      `${ANIME_SOURCES.animasu.completed}?page=${page}`,
      `${ANIME_SOURCES.oploverz.completed}?page=${page}`,
    ]);
  },

  // MOVIES
  async getMovies(page = 1) {
    return fetchWithFallback([
      `${ANIME_SOURCES.stream.movie(page)}`,
      `${ANIME_SOURCES.samehadaku.movies}?page=${page}`,
      `${ANIME_SOURCES.animasu.movies}?page=${page}`,
      `${ANIME_SOURCES.animekuindo.movie}?page=${page}`,
      `${ANIME_SOURCES.animesail.movie}?page=${page}`,
    ]);
  },

  // DONGHUA
  async getDonghua(page = 1) {
    return fetchWithFallback([
      `${ANIME_SOURCES.donghua.latest(page)}`,
      `${ANIME_SOURCES.donghua.home(page)}`,
      `${ANIME_SOURCES.donghub.latest}?page=${page}`,
      `${ANIME_SOURCES.animesail.donghua}?page=${page}`,
      `${ANIME_SOURCES.kuramanime.donghua}?page=${page}`,
    ]);
  },

  // SCHEDULE
  async getSchedule() {
    return fetchWithFallback([
      ANIME_SOURCES.otakudesu.schedule,
      ANIME_SOURCES.samehadaku.schedule,
      ANIME_SOURCES.animasu.schedule,
      ANIME_SOURCES.animesail.schedule,
      ANIME_SOURCES.animekuindo.schedule,
      ANIME_SOURCES.oploverz.schedule,
    ]);
  },

  // SEARCH
  async search(query, page = 1) {
    const q = encodeURIComponent(query);
    return fetchWithFallback([
      ANIME_SOURCES.otakudesu.search(q),
      `${ANIME_SOURCES.samehadaku.search}?q=${q}`,
      ANIME_SOURCES.animasu.search(q),
      ANIME_SOURCES.animekuindo.search(q),
      ANIME_SOURCES.stream.search(q),
      ANIME_SOURCES.animesail.search(q),
      ANIME_SOURCES.oploverz.search(q),
      ANIME_SOURCES.nimegami.search(q),
    ]);
  },

  // GENRES
  async getGenres() {
    return fetchWithFallback([
      ANIME_SOURCES.otakudesu.genres,
      ANIME_SOURCES.samehadaku.genres,
      ANIME_SOURCES.animasu.genres,
      ANIME_SOURCES.animekuindo.genres,
      ANIME_SOURCES.kuramanime.genreList,
    ]);
  },

  // DETAIL - try multiple sources
  async getDetail(slug, animeId = null) {
    const endpoints = [
      ANIME_SOURCES.otakudesu.detail(slug),
      ANIME_SOURCES.samehadaku.detail(slug),
      ANIME_SOURCES.animasu.detail(slug),
      ANIME_SOURCES.animekuindo.detail(slug),
      ANIME_SOURCES.stream.detail(slug),
      ANIME_SOURCES.animesail.detail(slug),
      ANIME_SOURCES.nimegami.detail(slug),
      ANIME_SOURCES.oploverz.detail(slug),
    ];
    return fetchWithFallback(endpoints);
  },

  // EPISODE
  async getEpisode(slug) {
    return fetchWithFallback([
      ANIME_SOURCES.otakudesu.episode(slug),
      ANIME_SOURCES.samehadaku.episode(slug),
      ANIME_SOURCES.animasu.episode(slug),
      ANIME_SOURCES.animekuindo.episode(slug),
      ANIME_SOURCES.stream.episode(slug),
      ANIME_SOURCES.animesail.episode(slug),
      ANIME_SOURCES.oploverz.episode(slug),
      ANIME_SOURCES.anoboy.episode(slug),
    ]);
  },

  // SERVER/EMBED
  async getServer(serverId) {
    return fetchWithFallback([
      ANIME_SOURCES.otakudesu.server(serverId),
      ANIME_SOURCES.samehadaku.server(serverId),
    ]);
  },

  // GENRE DETAIL
  async getByGenre(slug, page = 1) {
    return fetchWithFallback([
      `${ANIME_SOURCES.otakudesu.genreDetail(slug)}?page=${page}`,
      `${ANIME_SOURCES.animasu.genreDetail(slug)}?page=${page}`,
      `${ANIME_SOURCES.animekuindo.genreDetail(slug)}?page=${page}`,
      `${ANIME_SOURCES.stream.genreDetail(slug, page)}`,
    ]);
  },
};

window.API = API;
window.ANIME_SOURCES = ANIME_SOURCES;
