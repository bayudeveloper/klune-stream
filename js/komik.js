// ============================================
// KLUNE STREAM - Komik API (sankavollerei.com)
// Base: https://sankavollerei.com
// Multi-source fallback system
// ============================================

const COMIC_API = 'https://sankavollerei.com';

async function comicFetch(path) {
  const res = await fetch(COMIC_API + path, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

// ── Normalisasi item ke format standar ────────────────────────────────────────
function normComicItem(i, cat) {
  if (!i || typeof i !== 'object') return null;
  cat = cat || 'komik';
  var slug = i.slug || i.link || i.url || i.href || i.id || i.endpoint || i.komik_url || '';
  // bersihkan slug dari full URL
  if (slug && slug.startsWith('http')) {
    try { slug = new URL(slug).pathname.replace(/^\/+|\/+$/g, ''); } catch(e) {}
  }
  return {
    _cat: cat,
    title: i.title || i.judul || i.name || i.manga_title || i.comic_title || '',
    image: i.thumbnail || i.thumb || i.cover || i.image || i.poster || i.img
           || i.cover_image || i.image_url || i.cover_url || '',
    slug: slug,
    desc: i.synopsis || i.sinopsis || i.description || i.deskripsi || i.genre || '',
    type: i.type || i.tipe || i.comic_type || (cat === 'manhwa' ? 'Manhwa' : cat === 'manhua' ? 'Manhua' : 'Manga'),
    status: i.status || '',
    score: i.score || i.rating || i.nilai || '',
    chapter: i.latest_chapter || i.chapter || i.last_chapter || i.newest_chapter || i.chapter_count || '',
    genres: i.genres || i.genre || [],
  };
}

function normComicList(arr, cat) {
  if (!Array.isArray(arr)) return [];
  return arr.map(function(i) { return normComicItem(i, cat); }).filter(Boolean).filter(function(i) { return i.title; });
}

// ── Helper: ekstrak list dari berbagai bentuk response ─────────────────────────
function extractList(d) {
  if (Array.isArray(d)) return d;
  return d.data || d.results || d.komik || d.list || d.manga || d.comics
      || d.items || d.manhwa || d.manhua || d.comic || d.posts || [];
}

// ── Helper: coba beberapa sumber, return yg pertama berhasil dan ada data ──────
async function tryFallbacks(sources) {
  var lastErr = null;
  for (var i = 0; i < sources.length; i++) {
    try {
      var result = await sources[i]();
      if (result && result.length > 0) return result;
    } catch(e) {
      lastErr = e;
      console.warn('[ComicAPI] fallback ' + i + ' gagal:', e.message);
    }
  }
  return [];
}

// ── KomikAPI ──────────────────────────────────────────────────────────────────
const KomikAPI = {

  // ── Homepage (fallback: homepage → komikstation/home → mangakita/home → softkomik/home)
  async getHomepage() {
    var popular = [], latest = [], trending = [], ranking = [];
    try {
      var d = await comicFetch('/comic/homepage');
      popular  = normComicList(d.popular  || d.populer  || (d.data && d.data.popular)  || [], 'komik');
      latest   = normComicList(d.latest   || d.terbaru  || (d.data && d.data.latest)   || [], 'komik');
      trending = normComicList(d.trending || d.hot      || (d.data && d.data.trending) || [], 'komik');
      ranking  = normComicList(d.ranking  ||              (d.data && d.data.ranking)   || [], 'komik');
    } catch(e) {
      console.warn('[ComicAPI] homepage utama gagal, coba fallback:', e.message);
    }
    // fallback popular
    if (!popular.length) {
      popular = await tryFallbacks([
        function() { return KomikAPI.getPopular(1); },
        async function() { var d = await comicFetch('/comic/komikstation/popular?page=1'); return normComicList(extractList(d), 'komik'); },
        async function() { var d = await comicFetch('/comic/bacakomik/populer'); return normComicList(extractList(d), 'komik'); },
        async function() { var d = await comicFetch('/comic/westmanga/popular'); return normComicList(extractList(d), 'komik'); },
        async function() { var d = await comicFetch('/comic/bacaman/popular'); return normComicList(extractList(d), 'komik'); },
      ]);
    }
    // fallback latest
    if (!latest.length) {
      latest = await tryFallbacks([
        function() { return KomikAPI.getLatest(1); },
        async function() { var d = await comicFetch('/comic/bacakomik/latest'); return normComicList(extractList(d), 'komik'); },
        async function() { var d = await comicFetch('/comic/westmanga/latest'); return normComicList(extractList(d), 'komik'); },
        async function() { var d = await comicFetch('/comic/bacaman/latest'); return normComicList(extractList(d), 'komik'); },
        async function() { var d = await comicFetch('/comic/softkomik/update'); return normComicList(extractList(d), 'komik'); },
      ]);
    }
    // fallback trending
    if (!trending.length) {
      trending = await tryFallbacks([
        function() { return KomikAPI.getTrending(); },
        async function() { var d = await comicFetch('/comic/komikstation/top-weekly'); return normComicList(extractList(d), 'komik'); },
        async function() { var d = await comicFetch('/comic/kiryuu/popular'); return normComicList(extractList(d), 'komik'); },
        async function() { var d = await comicFetch('/comic/bacaman/update'); return normComicList(extractList(d), 'komik'); },
      ]);
    }
    return { popular, latest, trending, ranking };
  },

  // ── Latest (fallback chain: terbaru → bacakomik → westmanga → bacaman → softkomik → komikindo)
  async getLatest(page) {
    page = page || 1;
    return tryFallbacks([
      async function() { var d = await comicFetch('/comic/terbaru?page=' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/bacakomik/latest?page=' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/westmanga/latest?page=' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/bacaman/latest?page=' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/softkomik/update?page=' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/komikindo/latest/' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/mangasusuku/latest/' + page); return normComicList(extractList(d), 'komik'); },
    ]);
  },

  // ── Popular (fallback chain: populer → bacakomik → komikstation → westmanga → bacaman → kiryuu)
  async getPopular(page) {
    page = page || 1;
    return tryFallbacks([
      async function() { var d = await comicFetch('/comic/populer?page=' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/bacakomik/populer?page=' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/komikstation/popular?page=' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/westmanga/popular?page=' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/bacaman/popular?page=' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/kiryuu/popular?page=' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/mangasusuku/popular/' + page); return normComicList(extractList(d), 'komik'); },
    ]);
  },

  // ── Trending (fallback: trending → komikstation top-weekly → kiryuu → bacaman update → recommendations)
  async getTrending() {
    return tryFallbacks([
      async function() { var d = await comicFetch('/comic/trending'); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/komikstation/top-weekly'); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/kiryuu/popular'); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/bacaman/update'); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/recommendations'); return normComicList(extractList(d), 'komik'); },
    ]);
  },

  // ── Search (fallback: search → bacakomik → komikstation → softkomik → mangasusuku → kiryuu → westmanga)
  async search(q) {
    var enc = encodeURIComponent(q);
    return tryFallbacks([
      async function() { var d = await comicFetch('/comic/search?q=' + enc); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/bacakomik/search/' + enc); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/komikstation/search/' + enc + '/1'); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/softkomik/search?q=' + enc); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/mangasusuku/search/' + enc + '/1'); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/kiryuu/search/' + enc + '/1'); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/westmanga/search?q=' + enc); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/bacaman/search/' + enc); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/komikindo/search/' + enc + '/1'); return normComicList(extractList(d), 'komik'); },
    ]);
  },

  // ── Detail (fallback: comic/:slug → bacakomik/detail → komikstation/manga → softkomik/detail → mangasusuku/detail → westmanga/detail)
  async getDetail(slug) {
    var sources = [
      async function() { return await comicFetch('/comic/comic/' + encodeURIComponent(slug)); },
      async function() { return await comicFetch('/comic/bacakomik/detail/' + encodeURIComponent(slug)); },
      async function() { return await comicFetch('/comic/komikstation/manga/' + encodeURIComponent(slug)); },
      async function() { return await comicFetch('/comic/softkomik/detail/' + encodeURIComponent(slug)); },
      async function() { return await comicFetch('/comic/mangasusuku/detail/' + encodeURIComponent(slug)); },
      async function() { return await comicFetch('/comic/westmanga/detail/' + encodeURIComponent(slug)); },
      async function() { return await comicFetch('/comic/komikindo/detail/' + encodeURIComponent(slug)); },
      async function() { return await comicFetch('/comic/soulscan/detail/' + encodeURIComponent(slug)); },
      async function() { return await comicFetch('/comic/kiryuu/manga/' + encodeURIComponent(slug)); },
    ];
    var raw = null;
    for (var i = 0; i < sources.length; i++) {
      try {
        var r = await sources[i]();
        var d = r.data || r.detail || r.manga || r.comic || r;
        if (d && (d.title || d.judul)) { raw = d; break; }
      } catch(e) { console.warn('[ComicAPI] detail fallback ' + i + ':', e.message); }
    }
    if (!raw) return { title: '', image: '', slug: slug, desc: '', chapters: [], genres: [] };
    // normalisasi chapters dari berbagai bentuk
    var chapters = raw.chapters || raw.chapter_list || raw.daftar_chapter
                || raw.chapterList || raw.listChapter || raw.episode_list || [];
    if (!Array.isArray(chapters)) chapters = [];
    return {
      title: raw.title || raw.judul || raw.name || '',
      image: raw.thumbnail || raw.thumb || raw.cover || raw.image || raw.poster || '',
      slug: raw.slug || raw.link || slug,
      desc: raw.synopsis || raw.sinopsis || raw.description || raw.deskripsi || '',
      type: raw.type || raw.tipe || '',
      status: raw.status || '',
      score: raw.score || raw.rating || '',
      genres: raw.genres || raw.genre || [],
      chapters: chapters,
      author: raw.author || raw.pengarang || raw.authors || '',
      artist: raw.artist || '',
      year: raw.year || raw.tahun || '',
    };
  },

  // ── Read Chapter (fallback: chapter/:slug → bacakomik/chapter → komikstation/chapter → softkomik/chapter → mangasusuku/chapter → westmanga/chapter → soulscan/chapter → kiryuu/chapter)
  async readChapter(chapterSlug) {
    var sources = [
      async function() { return await comicFetch('/comic/chapter/' + encodeURIComponent(chapterSlug)); },
      async function() { return await comicFetch('/comic/bacakomik/chapter/' + encodeURIComponent(chapterSlug)); },
      async function() { return await comicFetch('/comic/komikstation/chapter/' + encodeURIComponent(chapterSlug)); },
      async function() { return await comicFetch('/comic/mangasusuku/chapter/' + encodeURIComponent(chapterSlug)); },
      async function() { return await comicFetch('/comic/westmanga/chapter/' + encodeURIComponent(chapterSlug)); },
      async function() { return await comicFetch('/comic/soulscan/chapter/' + encodeURIComponent(chapterSlug)); },
      async function() { return await comicFetch('/comic/kiryuu/chapter/' + encodeURIComponent(chapterSlug)); },
      async function() { return await comicFetch('/comic/komikindo/chapter/' + encodeURIComponent(chapterSlug)); },
      async function() { return await comicFetch('/comic/bacaman/chapter/' + encodeURIComponent(chapterSlug)); },
      async function() { return await comicFetch('/comic/cosmic/chapter/' + encodeURIComponent(chapterSlug)); },
    ];
    var raw = null;
    for (var i = 0; i < sources.length; i++) {
      try {
        var r = await sources[i]();
        var d = r.data || r.chapter || r;
        // cari array gambar
        var imgs = d.images || d.pages || d.imgs || d.gambar || d.image_list
                || d.imageList || d.pictures || d.img_list
                || (Array.isArray(d) ? d : []);
        if (imgs && imgs.length > 0) { raw = d; raw._imgs = imgs; break; }
      } catch(e) { console.warn('[ComicAPI] chapter fallback ' + i + ':', e.message); }
    }
    if (!raw) return { title: '', images: [], prev: '', next: '' };
    return {
      title: raw.title || raw.judul || '',
      images: raw._imgs || [],
      prev: raw.prev_chapter || raw.prev || raw.prevChapter || raw.previous || raw.prev_slug || '',
      next: raw.next_chapter || raw.next || raw.nextChapter || raw.next_slug || '',
    };
  },

  // ── getByType (fallback: type/:type → bacakomik/only → bacaman/type → komikstation/list)
  async getByType(type, page) {
    page = page || 1;
    var t = encodeURIComponent(type);
    return tryFallbacks([
      async function() { var d = await comicFetch('/comic/type/' + t + '?page=' + page); return normComicList(extractList(d), type); },
      async function() { var d = await comicFetch('/comic/bacakomik/only/' + t + '?page=' + page); return normComicList(extractList(d), type); },
      async function() { var d = await comicFetch('/comic/bacaman/type/' + t + '?page=' + page); return normComicList(extractList(d), type); },
      async function() { var d = await comicFetch('/comic/softkomik/type/' + t + '?page=' + page); return normComicList(extractList(d), type); },
      async function() { var d = await comicFetch('/comic/westmanga/' + t + '?page=' + page); return normComicList(extractList(d), type); },
    ]);
  },

  // ── Genres (fallback: genres → bacakomik → komikstation → mangasusuku → westmanga)
  async getGenres() {
    var sources = [
      '/comic/genres', '/comic/bacakomik/genres', '/comic/komikstation/genres',
      '/comic/mangasusuku/genres', '/comic/westmanga/genres', '/comic/softkomik/genres',
      '/comic/komikindo/genres', '/comic/bacaman/genres',
    ];
    for (var i = 0; i < sources.length; i++) {
      try {
        var d = await comicFetch(sources[i]);
        var list = d.data || d.genres || d.list || d.results || (Array.isArray(d) ? d : []);
        if (list && list.length) return list;
      } catch(e) { console.warn('[ComicAPI] genres fallback ' + i + ':', e.message); }
    }
    return [];
  },

  // ── By genre (fallback: genre/:genre → bacakomik → komikstation → softkomik → westmanga → mangasusuku)
  async getByGenre(genre, page) {
    page = page || 1;
    var g = encodeURIComponent(genre);
    return tryFallbacks([
      async function() { var d = await comicFetch('/comic/genre/' + g + '?page=' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/bacakomik/genre/' + g + '?page=' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/komikstation/genre/' + g + '/' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/softkomik/genre/' + g + '?page=' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/westmanga/genre/' + g + '?page=' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/mangasusuku/genre/' + g + '/' + page); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/bacaman/genres/' + g + '?page=' + page); return normComicList(extractList(d), 'komik'); },
    ]);
  },

  // ── Recommendations
  async getRecommendations() {
    return tryFallbacks([
      async function() { var d = await comicFetch('/comic/recommendations'); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/komikstation/recommendation'); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/bacakomik/recomen'); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/kiryuu/recommendations'); return normComicList(extractList(d), 'komik'); },
      async function() { var d = await comicFetch('/comic/mangakita/rekomendasi'); return normComicList(extractList(d), 'komik'); },
    ]);
  },

  // ── Random
  async getRandom() {
    return tryFallbacks([
      async function() { var d = await comicFetch('/comic/random'); var list = extractList(d); return normComicList(Array.isArray(list) ? list : [d], 'komik'); },
      async function() { return KomikAPI.getTrending(); },
    ]);
  },
};

// ── ManhwaAPI ─────────────────────────────────────────────────────────────────
const ManhwaAPI = {

  async search(q) {
    var enc = encodeURIComponent(q);
    var results = await tryFallbacks([
      async function() { var d = await comicFetch('/comic/search?q=' + enc); return normComicList(extractList(d), 'manhwa'); },
      async function() { var d = await comicFetch('/comic/bacakomik/search/' + enc); return normComicList(extractList(d), 'manhwa'); },
      async function() { var d = await comicFetch('/comic/komikstation/search/' + enc + '/1'); return normComicList(extractList(d), 'manhwa'); },
      async function() { var d = await comicFetch('/comic/westmanga/search?q=' + enc); return normComicList(extractList(d), 'manhwa'); },
      async function() { var d = await comicFetch('/comic/bacaman/search/' + enc); return normComicList(extractList(d), 'manhwa'); },
      async function() { var d = await comicFetch('/comic/kiryuu/search/' + enc + '/1'); return normComicList(extractList(d), 'manhwa'); },
    ]);
    return results.map(function(i) { return Object.assign({}, i, { _cat: 'manhwa' }); });
  },

  async getLatest(page) {
    page = page || 1;
    return tryFallbacks([
      async function() { return KomikAPI.getByType('manhwa', page); },
      async function() { var d = await comicFetch('/comic/bacakomik/only/manhwa?page=' + page); return normComicList(extractList(d), 'manhwa'); },
      async function() { var d = await comicFetch('/comic/westmanga/manhwa?page=' + page); return normComicList(extractList(d), 'manhwa'); },
      async function() { var d = await comicFetch('/comic/komikstation/ongoing?page=' + page); return normComicList(extractList(d), 'manhwa'); },
      async function() { var d = await comicFetch('/comic/bacaman/type/Manhwa?page=' + page); return normComicList(extractList(d), 'manhwa'); },
    ]);
  },

  async getPopular(page) {
    page = page || 1;
    return tryFallbacks([
      async function() { var d = await comicFetch('/comic/bacakomik/populer?page=' + page); return normComicList(extractList(d), 'manhwa'); },
      async function() { var d = await comicFetch('/comic/komikstation/popular?page=' + page); return normComicList(extractList(d), 'manhwa'); },
      async function() { var d = await comicFetch('/comic/kiryuu/popular?page=' + page); return normComicList(extractList(d), 'manhwa'); },
      async function() { return KomikAPI.getByType('manhwa', page); },
      async function() { var d = await comicFetch('/comic/westmanga/manhwa?page=' + page); return normComicList(extractList(d), 'manhwa'); },
    ]);
  },

  async getDetail(slug) {
    return KomikAPI.getDetail(slug);
  },

  async readChapter(chapterSlug) {
    return KomikAPI.readChapter(chapterSlug);
  },
};

window.KomikAPI = KomikAPI;
window.ManhwaAPI = ManhwaAPI;
