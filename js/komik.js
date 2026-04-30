// ============================================
// KLUNE STREAM - Komik API (sankavollerei.com)
// Base: https://sankavollerei.com
// ============================================

const COMIC_API = 'https://sankavollerei.com';

async function comicFetch(path) {
  const res = await fetch(COMIC_API + path, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

// ── Normalisasi item komik ke format standar ──────────────────────────────────
function normComicItem(i, cat) {
  cat = cat || 'komik';
  return {
    _cat: cat,
    title: i.title || i.judul || i.name || '',
    image: i.thumbnail || i.thumb || i.cover || i.image || i.poster || i.img || '',
    slug: i.slug || i.link || i.url || i.href || i.id || '',
    desc: i.synopsis || i.sinopsis || i.description || i.genre || i.type || '',
    type: i.type || i.tipe || (cat === 'manhwa' ? 'Manhwa' : 'Komik'),
    status: i.status || '',
    score: i.score || i.rating || '',
    chapter: i.latest_chapter || i.chapter || i.last_chapter || '',
    genres: i.genres || i.genre || [],
  };
}

function normComicList(arr, cat) {
  if (!Array.isArray(arr)) return [];
  return arr.map(function(i) { return normComicItem(i, cat); });
}

// ── KomikAPI (sankavollerei) ───────────────────────────────────────────────────
const KomikAPI = {

  // Homepage: popular + latest + trending
  async getHomepage() {
    const d = await comicFetch('/comic/homepage');
    return {
      popular: normComicList(d.popular || d.populer || d.data?.popular || [], 'komik'),
      latest: normComicList(d.latest || d.terbaru || d.data?.latest || [], 'komik'),
      trending: normComicList(d.trending || d.data?.trending || [], 'komik'),
      ranking: normComicList(d.ranking || d.data?.ranking || [], 'komik'),
    };
  },

  // Latest comics
  async getLatest(page) {
    page = page || 1;
    const d = await comicFetch('/comic/terbaru?page=' + page);
    const list = d.data || d.komik || d.list || d.results || (Array.isArray(d) ? d : []);
    return normComicList(list, 'komik');
  },

  // Popular comics
  async getPopular(page) {
    page = page || 1;
    const d = await comicFetch('/comic/populer?page=' + page);
    const list = d.data || d.komik || d.list || d.results || (Array.isArray(d) ? d : []);
    return normComicList(list, 'komik');
  },

  // Trending comics
  async getTrending() {
    const d = await comicFetch('/comic/trending');
    const list = d.data || d.trending || d.results || (Array.isArray(d) ? d : []);
    return normComicList(list, 'komik');
  },

  // Search
  async search(q) {
    const d = await comicFetch('/comic/search?q=' + encodeURIComponent(q));
    const list = d.data || d.results || d.komik || d.list || (Array.isArray(d) ? d : []);
    return normComicList(list, 'komik');
  },

  // Detail komik (slug)
  async getDetail(slug) {
    const d = await comicFetch('/comic/comic/' + encodeURIComponent(slug));
    const detail = d.data || d.detail || d;
    return {
      title: detail.title || detail.judul || '',
      image: detail.thumbnail || detail.thumb || detail.cover || detail.image || '',
      slug: detail.slug || detail.link || slug,
      desc: detail.synopsis || detail.sinopsis || detail.description || '',
      type: detail.type || detail.tipe || '',
      status: detail.status || '',
      score: detail.score || detail.rating || '',
      genres: detail.genres || detail.genre || [],
      chapters: detail.chapters || detail.chapter_list || detail.daftar_chapter || [],
      author: detail.author || detail.pengarang || '',
      artist: detail.artist || '',
      year: detail.year || detail.tahun || '',
    };
  },

  // Chapters dari detail
  async getChapters(slug) {
    const detail = await this.getDetail(slug);
    return detail.chapters || [];
  },

  // Baca chapter
  async readChapter(chapterSlug) {
    const d = await comicFetch('/comic/chapter/' + encodeURIComponent(chapterSlug));
    const data = d.data || d.chapter || d;
    return {
      title: data.title || data.judul || '',
      images: data.images || data.pages || data.imgs || data.gambar || (Array.isArray(data) ? data : []),
      prev: data.prev_chapter || data.prev || '',
      next: data.next_chapter || data.next || '',
    };
  },

  // Filter by type (manga/manhwa/manhua)
  async getByType(type, page) {
    page = page || 1;
    const d = await comicFetch('/comic/type/' + encodeURIComponent(type) + '?page=' + page);
    const list = d.data || d.komik || d.list || d.results || (Array.isArray(d) ? d : []);
    return normComicList(list, type === 'manhwa' ? 'manhwa' : 'komik');
  },

  // Genres list
  async getGenres() {
    const d = await comicFetch('/comic/genres');
    return d.data || d.genres || d.list || (Array.isArray(d) ? d : []);
  },

  // By genre
  async getByGenre(genre, page) {
    page = page || 1;
    const d = await comicFetch('/comic/genre/' + encodeURIComponent(genre) + '?page=' + page);
    const list = d.data || d.komik || d.list || d.results || (Array.isArray(d) ? d : []);
    return normComicList(list, 'komik');
  },

  // Recommendations
  async getRecommendations() {
    const d = await comicFetch('/comic/recommendations');
    const list = d.data || d.recommendations || d.results || (Array.isArray(d) ? d : []);
    return normComicList(list, 'komik');
  },

  // Random
  async getRandom() {
    const d = await comicFetch('/comic/random');
    const list = d.data || d.komik || (Array.isArray(d) ? d : [d]);
    return normComicList(list, 'komik');
  },

  // Browse dengan filter
  async browse(params) {
    params = params || {};
    var qs = Object.entries(params).map(function(p) { return p[0] + '=' + encodeURIComponent(p[1]); }).join('&');
    const d = await comicFetch('/comic/browse?' + qs);
    const list = d.data || d.komik || d.list || d.results || (Array.isArray(d) ? d : []);
    return normComicList(list, 'komik');
  },
};

// ── ManhwaAPI (alias ke KomikAPI filter manhwa) ────────────────────────────────
const ManhwaAPI = {
  async search(q) {
    const list = await KomikAPI.search(q);
    // filter manhwa jika ada, atau kembalikan semua
    return list.map(function(i) { return Object.assign({}, i, { _cat: 'manhwa', type: i.type || 'Manhwa' }); });
  },

  async getLatest(page) {
    return KomikAPI.getByType('manhwa', page);
  },

  async getPopular(page) {
    page = page || 1;
    try {
      const d = await comicFetch('/comic/bacakomik/populer?page=' + page);
      const list = d.data || d.komik || d.list || d.results || (Array.isArray(d) ? d : []);
      return normComicList(list, 'manhwa');
    } catch(e) {
      return KomikAPI.getByType('manhwa', page);
    }
  },

  async getHomepage() {
    try {
      const popular = await this.getPopular(1);
      const latest = await this.getLatest(1);
      return { popular, latest };
    } catch(e) {
      return { popular: [], latest: [] };
    }
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
