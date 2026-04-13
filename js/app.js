// ============================================
// KLUNE STREAM - App Logic
// ============================================

// ---- HELPERS ----

function getImageUrl(item) {
  return item?.poster || item?.image || item?.thumb || item?.thumbnail ||
    item?.cover || item?.img || item?.foto || item?.banner ||
    'https://via.placeholder.com/300x450/16161e/5a5a72?text=No+Image';
}

function getTitle(item) {
  return item?.title || item?.judul || item?.name || item?.animeTitle ||
    item?.anime_title || item?.romaji || item?.english || 'Unknown Title';
}

function getSlug(item) {
  return item?.slug || item?.animeId || item?.id || item?.url || item?.link || '';
}

function getEpisodeCount(item) {
  return item?.total_episode || item?.episodes || item?.episode_count ||
    item?.totalEpisode || item?.jumlah_episode || null;
}

function getScore(item) {
  return item?.score || item?.rating || item?.nilai || null;
}

function getStatus(item) {
  const s = (item?.status || item?.tipe || '').toLowerCase();
  if (s.includes('ongoing') || s.includes('airing') || s.includes('tayang')) return 'ongoing';
  if (s.includes('completed') || s.includes('tamat') || s.includes('finished')) return 'completed';
  if (s.includes('movie') || s.includes('film')) return 'movie';
  return null;
}

function normalizeAnimeList(data) {
  if (!data) return [];
  const raw = data?.data?.animeList || data?.data?.list || data?.data?.anime ||
    data?.data?.data || data?.data?.result || data?.data ||
    data?.animeList || data?.list || data?.anime || data?.result || [];
  return Array.isArray(raw) ? raw : [];
}

function buildCard(item, isLarge = false) {
  const img = getImageUrl(item);
  const title = getTitle(item);
  const slug = getSlug(item);
  const score = getScore(item);
  const status = getStatus(item);
  const eps = getEpisodeCount(item);

  let badgeHTML = '';
  if (status === 'ongoing') badgeHTML += `<span class="badge badge-ongoing">Ongoing</span>`;
  else if (status === 'completed') badgeHTML += `<span class="badge badge-completed">Tamat</span>`;
  else if (status === 'movie') badgeHTML += `<span class="badge badge-movie">Movie</span>`;

  const isDonghua = (item?.type || item?.tipe || '').toLowerCase().includes('donghua');
  if (isDonghua) badgeHTML += `<span class="badge badge-donghua">Donghua</span>`;

  return `
    <div class="anime-card" onclick="openDetail('${slug.replace(/'/g,"\\'")}', ${JSON.stringify(item).replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')})">
      <div class="card-thumb">
        <img src="${img}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450/16161e/5a5a72?text=No+Image'">
        <div class="card-badges">${badgeHTML}</div>
        ${score ? `<div class="card-rating">★ ${parseFloat(score).toFixed(1)}</div>` : ''}
        <div class="card-overlay">
          <div style="width:100%;text-align:center">
            <div class="card-play-btn">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        </div>
      </div>
      <div class="card-info">
        <div class="card-title">${title}</div>
        <div class="card-meta">
          ${eps ? `<span>${eps} Eps</span>` : ''}
          <span>${item?.type || item?.tipe || 'Anime'}</span>
        </div>
      </div>
    </div>
  `;
}

function buildSkeletons(count = 6) {
  return Array.from({length: count}, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-thumb"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
    </div>
  `).join('');
}

// ---- PAGES ----

const pages = {
  home: document.getElementById('page-home'),
  browse: document.getElementById('page-browse'),
  genre: document.getElementById('page-genre'),
  schedule: document.getElementById('page-schedule'),
  detail: document.getElementById('page-detail'),
  watch: document.getElementById('page-watch'),
};

let currentPage = 'home';

function showPage(name) {
  Object.values(pages).forEach(p => p && p.classList.remove('active'));
  if (pages[name]) {
    pages[name].classList.add('active');
    currentPage = name;
  }
  document.getElementById('search-results-container').classList.remove('visible');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  updateNavLinks(name);
}

function updateNavLinks(name) {
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === name);
  });
}

// ---- NAVBAR ----

document.getElementById('navbar').addEventListener('scroll', () => {});
window.addEventListener('scroll', () => {
  const nb = document.getElementById('navbar');
  nb.classList.toggle('scrolled', window.scrollY > 20);
});
document.getElementById('navbar').classList.add('scrolled');

// Nav links
document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const p = a.dataset.page;
    if (p === 'home') loadHomePage();
    else if (p === 'browse') loadBrowsePage('ongoing');
    else if (p === 'genre') loadGenrePage();
    else if (p === 'schedule') loadSchedulePage();
    else if (p === 'donghua') loadDonghuaPage();
  });
});

// ---- SEARCH ----

let searchTimeout;
const searchInput = document.getElementById('search-input');
const searchContainer = document.getElementById('search-results-container');

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  const q = searchInput.value.trim();
  if (!q) {
    searchContainer.classList.remove('visible');
    return;
  }
  searchTimeout = setTimeout(() => doSearch(q), 500);
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    searchContainer.classList.remove('visible');
    searchInput.value = '';
  }
});

document.addEventListener('click', e => {
  if (!e.target.closest('#nav-search-bar') && !e.target.closest('#search-results-container')) {
    searchContainer.classList.remove('visible');
  }
});

async function doSearch(query) {
  searchContainer.innerHTML = `<div class="search-results-title">Mencari "${query}"...</div><div class="search-results-grid">${buildSkeletons(8)}</div>`;
  searchContainer.classList.add('visible');

  const result = await API.search(query);
  const list = normalizeAnimeList(result);

  if (!list.length) {
    searchContainer.innerHTML = `<div class="search-results-title">Tidak ada hasil untuk "${query}"</div>`;
    return;
  }

  searchContainer.innerHTML = `
    <div class="search-results-title">Hasil pencarian: "${query}" (${list.length} anime)</div>
    <div class="search-results-grid">${list.map(i => buildCard(i)).join('')}</div>
  `;
}

// ---- HOME PAGE ----

async function loadHomePage() {
  showPage('home');

  // Hero
  loadHero();

  // Sections
  loadSection('latest-row', () => API.getLatest(), 'Terbaru');
  loadSection('popular-row', () => API.getPopular(), 'Terpopuler');
  loadSection('ongoing-row', () => API.getOngoing(), 'Sedang Tayang');
  loadSection('movie-row', () => API.getMovies(), 'Movie');
  loadSection('donghua-row', () => API.getDonghua(), 'Donghua');
}

async function loadHero() {
  const heroEl = document.getElementById('hero-section');
  if (!heroEl) return;

  const result = await API.getLatest();
  const list = normalizeAnimeList(result);
  if (!list.length) return;

  // Pick featured item (first with image)
  const featured = list.find(i => getImageUrl(i) !== 'https://via.placeholder.com/300x450/16161e/5a5a72?text=No+Image') || list[0];
  const img = getImageUrl(featured);
  const title = getTitle(featured);
  const desc = featured?.synopsis || featured?.sinopsis || featured?.description || featured?.deskripsi || '';
  const score = getScore(featured);
  const eps = getEpisodeCount(featured);
  const genres = featured?.genres || featured?.genre || [];
  const genreArr = Array.isArray(genres) ? genres : [];
  const slug = getSlug(featured);

  heroEl.innerHTML = `
    <div class="hero-bg" style="background-image:url('${img}')"></div>
    <div class="hero-gradient"></div>
    <div class="hero-content">
      <div class="hero-badge">🔥 Featured</div>
      <h1 class="hero-title">${title}</h1>
      <div class="hero-meta">
        ${score ? `<span class="rating">★ ${parseFloat(score).toFixed(1)}</span>` : ''}
        ${eps ? `<span class="episode-count">${eps} Episode</span>` : ''}
        <span>${featured?.type || featured?.tipe || 'Anime'}</span>
      </div>
      ${genreArr.length ? `<div class="hero-tags">${genreArr.slice(0,4).map(g => `<span class="tag">${g?.name || g?.genre || g}</span>`).join('')}</div>` : ''}
      ${desc ? `<p class="hero-desc">${desc.slice(0, 220)}${desc.length > 220 ? '...' : ''}</p>` : ''}
      <div class="hero-actions">
        <button class="btn-primary" onclick="openDetail('${slug.replace(/'/g,"\\'")}', null)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          Tonton Sekarang
        </button>
        <button class="btn-secondary" onclick="openDetail('${slug.replace(/'/g,"\\'")}', null)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
          Info
        </button>
      </div>
    </div>
  `;
}

async function loadSection(containerId, fetchFn, label) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = buildSkeletons(8);

  try {
    const result = await fetchFn();
    const list = normalizeAnimeList(result);
    if (!list.length) { el.innerHTML = `<div class="error-message"><p>Tidak ada data tersedia</p></div>`; return; }
    el.innerHTML = list.slice(0, 20).map(i => buildCard(i)).join('');
  } catch {
    el.innerHTML = `<div class="error-message"><p>Gagal memuat data</p></div>`;
  }
}

// ---- BROWSE PAGE ----

let browseTab = 'ongoing';
let browsePage = 1;

async function loadBrowsePage(tab = 'ongoing') {
  showPage('browse');
  browseTab = tab;
  browsePage = 1;

  document.querySelectorAll('#page-browse .tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });

  await loadBrowseContent();
}

async function loadBrowseContent() {
  const grid = document.getElementById('browse-grid');
  grid.innerHTML = buildSkeletons(18);

  let result;
  try {
    if (browseTab === 'ongoing') result = await API.getOngoing(browsePage);
    else if (browseTab === 'completed') result = await API.getCompleted(browsePage);
    else if (browseTab === 'movies') result = await API.getMovies(browsePage);
    else if (browseTab === 'popular') result = await API.getPopular(browsePage);
    else if (browseTab === 'donghua') result = await API.getDonghua(browsePage);
  } catch {}

  const list = normalizeAnimeList(result);
  if (!list.length) {
    grid.innerHTML = `<div class="error-message"><h3>Tidak ada data</h3><p>Coba lagi nanti</p></div>`;
    return;
  }

  grid.innerHTML = list.map(i => buildCard(i)).join('');
  renderPagination(browsePage);
}

function renderPagination(current, total = 20) {
  const el = document.getElementById('browse-pagination');
  if (!el) return;
  const pages = [];
  const maxShow = 5;
  let start = Math.max(1, current - Math.floor(maxShow / 2));
  let end = Math.min(total, start + maxShow - 1);
  if (end - start < maxShow - 1) start = Math.max(1, end - maxShow + 1);

  let html = `<button class="page-btn" onclick="changeBrowsePage(${current - 1})" ${current <= 1 ? 'disabled' : ''}>‹</button>`;
  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="changeBrowsePage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="changeBrowsePage(${current + 1})" ${current >= total ? 'disabled' : ''}>›</button>`;
  el.innerHTML = html;
}

function changeBrowsePage(page) {
  if (page < 1) return;
  browsePage = page;
  loadBrowseContent();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- GENRE PAGE ----

async function loadGenrePage() {
  showPage('genre');
  const genreList = document.getElementById('genre-list');
  const genreAnimeGrid = document.getElementById('genre-anime-grid');

  genreList.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

  try {
    const result = await API.getGenres();
    const raw = result?.data?.genres || result?.data?.genre || result?.data || result?.genres || [];
    const genres = Array.isArray(raw) ? raw : Object.values(raw);

    if (!genres.length) {
      genreList.innerHTML = `<div class="error-message"><p>Gagal memuat genre</p></div>`;
      return;
    }

    genreList.innerHTML = genres.map(g => {
      const name = g?.name || g?.genre || g?.slug || g;
      const slug = g?.slug || g?.id || name;
      return `<button class="genre-chip" onclick="loadGenreAnime('${slug}', '${name}')">${name}</button>`;
    }).join('');

    genreAnimeGrid.innerHTML = `<div class="error-message"><p>Pilih genre untuk melihat anime</p></div>`;
  } catch {
    genreList.innerHTML = `<div class="error-message"><p>Gagal memuat genre</p></div>`;
  }
}

async function loadGenreAnime(slug, name) {
  document.querySelectorAll('.genre-chip').forEach(c => c.classList.remove('active'));
  document.querySelectorAll(`.genre-chip[onclick*="${slug}"]`)[0]?.classList.add('active');

  const grid = document.getElementById('genre-anime-grid');
  grid.innerHTML = buildSkeletons(12);

  try {
    const result = await API.getByGenre(slug);
    const list = normalizeAnimeList(result);
    if (!list.length) { grid.innerHTML = `<div class="error-message"><p>Tidak ada anime di genre ini</p></div>`; return; }
    grid.innerHTML = list.map(i => buildCard(i)).join('');
  } catch {
    grid.innerHTML = `<div class="error-message"><p>Gagal memuat anime</p></div>`;
  }
}

// ---- SCHEDULE PAGE ----

async function loadSchedulePage() {
  showPage('schedule');
  const container = document.getElementById('schedule-container');
  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

  try {
    const result = await API.getSchedule();
    const raw = result?.data?.schedule || result?.data || result?.schedule || {};

    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const dayKeys = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
    const todayIdx = (new Date().getDay() + 6) % 7; // Monday = 0

    let html = '<div class="schedule-grid">';

    const isArray = Array.isArray(raw);

    dayKeys.forEach((day, idx) => {
      const animes = isArray
        ? raw.filter(a => (a?.day || a?.hari || '').toLowerCase() === day)
        : (raw[day] || raw[days[idx]] || raw[days[idx].toLowerCase()] || []);

      html += `
        <div class="schedule-day ${idx === todayIdx ? 'today' : ''}">
          <div class="schedule-day-title">${days[idx]}${idx === todayIdx ? ' (Hari ini)' : ''}</div>
          ${Array.isArray(animes) && animes.length
            ? animes.map(a => `<div class="schedule-anime-item" onclick="openDetail('${getSlug(a)}', null)">${getTitle(a)}</div>`).join('')
            : `<div class="schedule-anime-item" style="opacity:0.3">-</div>`
          }
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  } catch {
    container.innerHTML = `<div class="error-message"><h3>Gagal memuat jadwal</h3></div>`;
  }
}

// ---- DONGHUA PAGE ----

async function loadDonghuaPage() {
  showPage('browse');
  browseTab = 'donghua';
  browsePage = 1;
  document.querySelectorAll('#page-browse .tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === 'donghua');
  });
  await loadBrowseContent();
}

// ---- DETAIL PAGE ----

let currentDetail = null;

async function openDetail(slug, itemData) {
  showPage('detail');
  const container = document.getElementById('detail-container');
  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

  try {
    const result = await API.getDetail(slug);
    const data = result?.data?.detail || result?.data?.anime || result?.data || {};

    // Merge with item data for fallback
    const merged = { ...itemData, ...data };

    currentDetail = { slug, data: merged };

    const img = getImageUrl(merged);
    const title = getTitle(merged);
    const titleEn = merged?.english || merged?.english_title || merged?.title_english || '';
    const desc = merged?.synopsis || merged?.sinopsis || merged?.description || merged?.deskripsi || 'Tidak ada sinopsis.';
    const score = getScore(merged);
    const type = merged?.type || merged?.tipe || 'TV';
    const status = merged?.status || merged?.tipe_status || '';
    const year = merged?.year || merged?.tahun || '';
    const studio = merged?.studio || merged?.studios || '';
    const genres = merged?.genres || merged?.genre || merged?.genreList || [];
    const genreArr = Array.isArray(genres) ? genres : typeof genres === 'string' ? genres.split(',') : [];

    const episodes = merged?.episodeList || merged?.episodes || merged?.episode_list ||
      merged?.listEpisode || merged?.list_episode || [];
    const epsArr = Array.isArray(episodes) ? episodes : [];

    container.innerHTML = `
      <div class="detail-hero">
        <div class="detail-hero-bg" style="background-image:url('${img}')"></div>
        <div class="detail-hero-gradient"></div>
        <div class="detail-content">
          <div class="detail-poster">
            <img src="${img}" alt="${title}" onerror="this.src='https://via.placeholder.com/300x450/16161e/5a5a72?text=No+Image'">
          </div>
          <div class="detail-info">
            <h1 class="detail-title">${title}</h1>
            ${titleEn ? `<div class="detail-title-en">${titleEn}</div>` : ''}
            <div class="detail-meta-row">
              ${score ? `<span class="detail-meta-item">★ ${parseFloat(score).toFixed(1)}</span>` : ''}
              ${type ? `<span class="detail-meta-item">📺 ${type}</span>` : ''}
              ${status ? `<span class="detail-meta-item">🔄 ${status}</span>` : ''}
              ${year ? `<span class="detail-meta-item">📅 ${year}</span>` : ''}
              ${typeof studio === 'string' && studio ? `<span class="detail-meta-item">🏢 ${studio}</span>` : ''}
            </div>
            ${genreArr.length ? `
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
                ${genreArr.slice(0,6).map(g => `<span class="tag">${g?.name || g?.genre || g}</span>`).join('')}
              </div>
            ` : ''}
            <div class="hero-actions">
              <button class="btn-primary" onclick="playFirstEpisode()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Tonton Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-body">
        <button class="back-btn" onclick="goBack()">
          ← Kembali
        </button>

        <h3 style="font-family:var(--font-display);font-size:18px;letter-spacing:1px;margin-bottom:8px">SINOPSIS</h3>
        <p class="detail-synopsis">${desc}</p>

        ${epsArr.length ? `
          <h3 style="font-family:var(--font-display);font-size:18px;letter-spacing:1px;margin-bottom:16px">
            DAFTAR EPISODE (${epsArr.length})
          </h3>
          <div class="episodes-grid">
            ${epsArr.map((ep, idx) => {
              const epSlug = ep?.slug || ep?.episode_id || ep?.id || ep?.url || '';
              const epLabel = ep?.episode || ep?.eps || ep?.title || `Episode ${idx + 1}`;
              return `<button class="episode-btn" onclick="openWatch('${epSlug.replace(/'/g,"\\'")}', '${String(epLabel).replace(/'/g,"\\'")}', '${title.replace(/'/g,"\\'")}')">
                ${epLabel}
              </button>`;
            }).join('')}
          </div>
        ` : `
          <div style="text-align:center;padding:40px;color:var(--text-muted)">
            <p>Daftar episode tidak tersedia melalui API ini.</p>
            <p style="margin-top:8px;font-size:12px">Coba cari anime ini dengan nama lengkap.</p>
          </div>
        `}
      </div>
    `;

    // Store episodes for playback
    window._currentEpisodes = epsArr;
    window._currentAnimeTitle = title;

  } catch (err) {
    container.innerHTML = `
      <div class="detail-hero" style="min-height:300px;display:flex;align-items:center;justify-content:center">
        <div class="error-message">
          <h3>Gagal memuat detail</h3>
          <p>Silakan coba lagi atau pilih anime lain.</p>
          <button class="btn-secondary" onclick="goBack()" style="margin-top:16px">← Kembali</button>
        </div>
      </div>
    `;
  }
}

function playFirstEpisode() {
  if (window._currentEpisodes?.length) {
    const ep = window._currentEpisodes[0];
    const epSlug = ep?.slug || ep?.episode_id || ep?.id || ep?.url || '';
    const epLabel = ep?.episode || ep?.eps || ep?.title || 'Episode 1';
    openWatch(epSlug, epLabel, window._currentAnimeTitle || '');
  }
}

// ---- WATCH PAGE ----

async function openWatch(epSlug, epLabel, animeTitle) {
  showPage('watch');
  const container = document.getElementById('watch-container');
  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;

  try {
    const result = await API.getEpisode(epSlug);
    const data = result?.data || {};

    const servers = data?.server || data?.servers || data?.streamUrls || data?.streamUrl || [];
    const serversArr = Array.isArray(servers) ? servers : (servers ? [servers] : []);

    let embedUrl = data?.embed || data?.embedUrl || data?.url || data?.iframe ||
      data?.stream_url || data?.streamUrl ||
      (serversArr[0]?.url || serversArr[0]?.embed || serversArr[0]?.iframe || '');

    // Try to get embed from server endpoint
    if (!embedUrl && data?.serverId) {
      try {
        const sResult = await API.getServer(data.serverId);
        embedUrl = sResult?.data?.url || sResult?.data?.embed || '';
      } catch {}
    }

    container.innerHTML = `
      <div class="video-container">
        ${embedUrl
          ? `<iframe src="${embedUrl}" allowfullscreen allow="autoplay; encrypted-media" sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>`
          : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;background:#000;gap:12px">
               <svg width="64" height="64" viewBox="0 0 24 24" fill="rgba(255,255,255,0.2)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
               <p style="color:rgba(255,255,255,0.4);font-size:14px">Video tidak tersedia</p>
             </div>`
        }
      </div>
      <div class="watch-body">
        <button class="back-btn" onclick="goBack()">← Kembali ke Detail</button>
        <h2 class="watch-title">${animeTitle}</h2>
        <p style="color:var(--text-muted);font-size:14px;margin-bottom:16px">${epLabel}</p>

        ${serversArr.length > 1 ? `
          <div>
            <p style="font-size:13px;color:var(--text-muted);margin-bottom:10px">Pilih Server:</p>
            <div class="server-list">
              ${serversArr.map((s, i) => `
                <button class="server-btn ${i === 0 ? 'active' : ''}"
                  onclick="switchServer(this, '${(s?.url || s?.embed || s?.iframe || '').replace(/'/g,"\\'")}')">
                  ${s?.name || s?.server || `Server ${i + 1}`}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${window._currentEpisodes?.length ? `
          <div style="margin-top:24px">
            <p style="font-family:var(--font-display);font-size:16px;letter-spacing:1px;margin-bottom:12px">EPISODE LAINNYA</p>
            <div class="episodes-grid">
              ${window._currentEpisodes.map((ep, idx) => {
                const s = ep?.slug || ep?.episode_id || ep?.id || ep?.url || '';
                const l = ep?.episode || ep?.eps || ep?.title || `Episode ${idx + 1}`;
                return `<button class="episode-btn ${s === epSlug ? 'current' : ''}"
                  onclick="openWatch('${s.replace(/'/g,"\\'")}', '${String(l).replace(/'/g,"\\'")}', '${animeTitle.replace(/'/g,"\\'")}')">
                  ${l}
                </button>`;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  } catch {
    container.innerHTML = `
      <div class="error-message" style="padding:80px">
        <h3>Gagal memuat video</h3>
        <p>Silakan coba server lain atau episode lain.</p>
        <button class="btn-secondary" onclick="goBack()" style="margin-top:16px">← Kembali</button>
      </div>
    `;
  }
}

function switchServer(btn, url) {
  document.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const iframe = document.querySelector('#watch-container iframe');
  if (iframe && url) iframe.src = url;
}

// ---- NAVIGATION ----

const pageHistory = ['home'];

function goBack() {
  if (pageHistory.length > 1) {
    pageHistory.pop();
    const prev = pageHistory[pageHistory.length - 1];
    if (prev === 'home') loadHomePage();
    else if (prev === 'browse') showPage('browse');
    else if (prev === 'detail') showPage('detail');
    else showPage(prev);
  } else {
    loadHomePage();
  }
}

// Override showPage to track history
const _showPage = showPage;
window.showPage = function(name) {
  if (pageHistory[pageHistory.length - 1] !== name) pageHistory.push(name);
  _showPage(name);
};

// ---- INIT ----
loadHomePage();
