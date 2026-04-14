// ============================================
// KLUNE STREAM - Komik / Film API
// Base: https://klune-stream-api-v2.vercel.app
// ============================================

const KAPI = 'https://klune-stream-api-
.vercel.app';

async function kapiFetch(path) {
  const res = await fetch(KAPI + path, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

// ── Komiku ────────────────────────────────────────────────────────────────────
const KomikAPI = {
  async search(q) {
    const d = await kapiFetch('/api/komiku/search?q=' + encodeURIComponent(q));
    // Normalisasi response
    const list = d.results || d.data || d.komik || d.list || (Array.isArray(d) ? d : []);
    return list.map(function(i) {
      return {
        _cat: 'komik',
        title: i.title || i.judul || i.name || '',
        image: i.thumb || i.thumbnail || i.cover || i.poster || i.image || '',
        slug: i.link || i.url || i.href || i.slug || '',
        desc: i.desc || i.description || i.genre || '',
        type: 'Komik',
      };
    });
  },

  async download(url) {
    // Returns { success, title, pages, base64pdf, fileName }
    const d = await kapiFetch('/api/komiku/download?url=' + encodeURIComponent(url));
    return d;
  },
};

// ── Webtoon/Manhwa ────────────────────────────────────────────────────────────
const ManhwaAPI = {
  async search(q) {
    const d = await kapiFetch('/api/webtoon/search?q=' + encodeURIComponent(q));
    // search returns detail langsung: { title, author, synopsis, link, episodes:[] }
    // Atau bisa array
    if (d.title && d.episodes) {
      // Single result dengan episodes
      return [{
        _cat: 'manhwa',
        _detail: d,
        title: d.title || '',
        image: d.thumbnail || d.cover || d.image || '',
        slug: d.link || d.url || '',
        desc: d.synopsis || d.author || '',
        type: 'Manhwa',
        episodes: d.episodes || [],
      }];
    }
    const list = d.results || d.data || d.webtoon || (Array.isArray(d) ? d : []);
    return list.map(function(i) {
      return {
        _cat: 'manhwa',
        _detail: i.episodes ? i : null,
        title: i.title || i.name || '',
        image: i.thumbnail || i.cover || i.image || '',
        slug: i.link || i.url || i.href || i.slug || '',
        desc: i.synopsis || i.author || i.desc || '',
        type: 'Manhwa',
        episodes: i.episodes || [],
      };
    });
  },

  async downloadEp(q, ep) {
    // Returns { success, title, episode, pages, base64pdf, fileName }
    const d = await kapiFetch('/api/webtoon/download?q=' + encodeURIComponent(q) + '&ep=' + ep);
    return d;
  },
};

// ── Film / KlikXXI ────────────────────────────────────────────────────────────
const FilmAPI = {
  async search(q) {
    const d = await kapiFetch('/api/klikxxi/search?q=' + encodeURIComponent(q));
    const list = d.results || d.data || d.films || (Array.isArray(d) ? d : []);
    return list.map(function(i) {
      return {
        _cat: 'film',
        title: i.title || i.name || '',
        image: i.thumbnail || i.thumb || i.cover || i.poster || i.image || '',
        slug: i.url || i.href || i.link || i.slug || '',
        desc: i.quality || i.rating || i.year || '',
        rating: i.rating || '',
        quality: i.quality || '',
        year: i.year || '',
        type: 'Film',
      };
    });
  },

  async getDetail(url) {
    const d = await kapiFetch('/api/klikxxi/detail?url=' + encodeURIComponent(url));
    // Returns { success, url, detail: { title, thumbnail, description, metadata, downloadLinks, servers, episodes } }
    return d.detail || d.data || d;
  },
};

window.KomikAPI = KomikAPI;
window.ManhwaAPI = ManhwaAPI;
window.FilmAPI = FilmAPI;
