// ============================================
// KLUNE STREAM - App v5 (Sidebar Layout)
// ============================================

window._cards = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function gImg(o){if(!o)return'';return o.poster||o.image||o.img||o.thumb||o.thumbnail||o.cover||o.foto||o.banner||o.coverImage||o.image_url||''}
function gTitle(o){if(!o)return'Unknown';return o.title||o.judul||o.name||o.anime_title||o.animeTitle||o.romaji||o.english||'Unknown'}
function gSlug(o){if(!o)return'';return o.slug||o.animeId||o.anime_id||o.id||o.url||o.link||o.endpoint||o.href||''}
function gEpSlug(ep){if(!ep)return'';return ep._slug||ep.slug||ep.episodeId||ep.episode_id||ep.id||ep.url||ep.link||ep.href||ep.endpoint||''}
function gEpLabel(ep,i){if(!ep)return'Episode '+(i+1);return ep._label||ep.episode||ep.eps||ep.no||ep.number||ep.name||ep.title||('Episode '+(i+1))}
function gSyn(o){if(!o)return'';return o.synopsis||o.sinopsis||o.description||o.deskripsi||o.overview||o.plot||o.summary||''}
function ph(){return'https://placehold.co/300x450/1a1a22/444?text='}

function gEps(o){
  if(!o)return[];
  var c=[o.episodeList,o.episodes,o.episode_list,o.listEpisode,o.list_episode,o.daftar_episode,o.eps,o.episodesList,o.daftarEpisode];
  for(var i=0;i<c.length;i++){if(Array.isArray(c[i])&&c[i].length>0)return normEps(c[i])}
  var n=o.data||o.result||o.anime||o.detail||{};
  if(n&&typeof n==='object'){var c2=[n.episodeList,n.episodes,n.episode_list,n.listEpisode,n.list_episode,n.daftar_episode,n.eps];for(var j=0;j<c2.length;j++){if(Array.isArray(c2[j])&&c2[j].length>0)return normEps(c2[j])}}
  return[];
}

function normEps(arr){
  return arr.map(function(ep,i){
    if(!ep||typeof ep!=='object')return{_slug:String(ep),_label:'Episode '+(i+1)};
    var raw=ep.episodeId||ep.episode_id||ep.slug||ep.id||ep.url||ep.link||ep.href||ep.endpoint||'';
    var slug=cleanEpSlug(raw);
    var label=ep.episode||ep.eps||ep.no||ep.number||ep.name||ep.title||ep.judul||ep.label||('Episode '+(i+1));
    if(typeof label==='string'&&label.length>40){var m=slug.match(/episode[- ](\d+)/i);label=m?m[1]:('Ep '+(i+1))}
    return Object.assign({},ep,{_slug:slug,_label:String(label)});
  });
}

function cleanEpSlug(s){
  if(!s)return'';
  if(s.startsWith('http')){try{s=new URL(s).pathname}catch(e){}}
  s=s.replace(/^\/+/,'').replace(/\/+$/,'');
  var p;do{p=s;s=s.replace(/^(?:anime\/)?(?:samehadaku|animasu|animekuindo|stream|animesail|oploverz|anoboy|nimegami|donghub|donghua|kura|kusonime|winbu|alqanime|otakudesu)\/(?:episode|anime|detail|watch|series|film|batch|server)\//,'');s=s.replace(/^(?:anime\/)?(?:episode|anime|detail|watch|server)\//,'');s=s.replace(/^\/+/,'')}while(s!==p);
  return s;
}

function gEmbed(o){
  if(!o)return'';
  var u=o.defaultStreamingUrl||o.embed||o.embedUrl||o.iframe||o.iframeUrl||o.stream_url||o.streamUrl||o.url||o.link||o.src||'';if(u)return u;
  if(o.streams&&Array.isArray(o.streams)&&o.streams.length){var s=o.streams[0];u=s.url||s.embed||s.iframe||s.src||'';if(u)return u}
  if(o.server){var sv=Array.isArray(o.server)?o.server[0]:o.server;if(sv){u=sv.url||sv.embed||sv.iframe||sv.src||'';if(u)return u}}
  if(o.servers){var sv2=Array.isArray(o.servers)?o.servers[0]:o.servers;if(sv2){u=sv2.url||sv2.embed||sv2.iframe||sv2.src||'';if(u)return u}}
  return'';
}

function gServers(o){
  if(!o)return[];
  var r=[];
  if(o.streams&&Array.isArray(o.streams)){o.streams.forEach(function(s,i){var u=s.url||s.embed||s.iframe||s.src||'';if(u)r.push({name:s.quality||s.name||('Stream '+(i+1)),url:u,type:'direct'})})}
  var sv=o.server||o.servers||o;
  if(sv&&sv.qualities&&Array.isArray(sv.qualities)){sv.qualities.forEach(function(q){(q.serverList||[]).forEach(function(s){if(s.serverId)r.push({name:(s.title||'Server')+(q.title&&q.title!=='unknown'?' ('+q.title+')':''),serverId:s.serverId,type:'sh'})})})}
  var raw=Array.isArray(o.server)?o.server:(Array.isArray(o.servers)?o.servers:[]);
  raw.forEach(function(s,i){if(!s||s.qualities)return;if(typeof s==='string'){r.push({name:'Server '+(i+1),url:s,type:'direct'});return}var u=s.url||s.embed||s.iframe||s.src||'';if(u)r.push({name:s.name||s.server||s.quality||s.title||('Server '+(i+1)),url:u,type:'direct'});else if(s.serverId)r.push({name:s.name||('Server '+(i+1)),serverId:s.serverId,type:'sh'})});
  if(o.iframes&&Array.isArray(o.iframes)){o.iframes.forEach(function(u,i){if(u)r.push({name:'Server '+(i+1),url:u,type:'direct'})})}
  return r;
}

async function resolveServerId(id){
  try{var d=await API.getServer(id);if(!d)return'';var u=d.url||d.embed||d.embedUrl||d.iframe||d.src||d.stream_url||'';if(!u&&d.data){var x=d.data;u=x.url||x.embed||x.iframe||x.src||''}return u||''}catch(e){return''}
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function skels(n,grid){var w=grid?'':' style="flex-shrink:0;width:148px"';var h='';for(var i=0;i<n;i++)h+='<div class="sk-card"'+w+'><div class="sk sk-thumb"></div><div class="sk sk-line"></div><div class="sk sk-line s60"></div></div>';return h}

// ── Card ───────────────────────────────────────────────────────────────────────
function card(item,cat){
  var idx=window._cards.length;window._cards.push(item);
  var img=gImg(item)||(ph()+encodeURIComponent(gTitle(item).slice(0,14)));
  var title=gTitle(item);
  var score=item.score||item.rating||item.nilai||'';
  var status=(item.status||item.tipe_status||'').toLowerCase();
  var type=(item.type||item.tipe||'').toLowerCase();
  var eps=item.total_episode||item.episodes||item.episode_count||item.totalEpisode||'';
  var badges='';
  if(cat==='komik'||type.includes('komik'))badges='<span class="badge b-komik">Komik</span>';
  else if(cat==='manhwa'||type.includes('manhwa')||type.includes('webtoon'))badges='<span class="badge b-manhwa">Manhwa</span>';
  else if(cat==='film')badges='<span class="badge b-film">Film</span>';
  else if(cat==='donghua'||type.includes('donghua'))badges='<span class="badge b-donghua">Donghua</span>';
  else if(type.includes('movie'))badges='<span class="badge b-movie">Movie</span>';
  else if(status.includes('ongoing')||status.includes('airing')||status.includes('tayang'))badges='<span class="badge b-ongoing">Ongoing</span>';
  else if(status.includes('complet')||status.includes('tamat'))badges='<span class="badge b-completed">Tamat</span>';
  var fn='';
  if(cat==='komik')fn='openKomikDetail('+idx+')';
  else if(cat==='manhwa')fn='openManhwaDetail('+idx+')';
  else if(cat==='film')fn='openFilmDetail('+idx+')';
  else fn='openAnimeDetail('+idx+')';
  return '<div class="card" onclick="'+fn+'">'+'<div class="c-thumb">'+'<img src="'+esc(img)+'" alt="" loading="lazy" onerror="this.src=\''+ph()+'No+Image\'">'+'<div class="c-badges">'+badges+'</div>'+(score?'<div class="c-score">★ '+parseFloat(score).toFixed(1)+'</div>':'')+'<div class="c-ov"><div class="c-ov-title">'+esc(title)+'</div><button class="c-play" onclick="event.stopPropagation();'+fn+'"><svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button></div></div>'+'<div class="c-info"><div class="c-title">'+esc(title)+'</div><div class="c-sub">'+(eps?eps+' Eps · ':'')+esc(item.type||item.tipe||'—')+'</div></div></div>';
}

// ── Navigation ─────────────────────────────────────────────────────────────────
var _hist=[];
var _pageConfigs={
  home:{title:'Beranda'},ongoing:{title:'Sedang Tayang'},completed:{title:'Sudah Tamat'},
  movies:{title:'Movie Anime'},popular:{title:'Terpopuler'},donghua:{title:'Donghua'},
  genre:{title:'Genre'},schedule:{title:'Jadwal Tayang'},film:{title:'Film & Drama'},
  komik:{title:'Komik'},manhwa:{title:'Manhwa'},detail:{title:'Detail'},watch:{title:'Tonton'},
};

function showPage(name){
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  var el=document.getElementById('page-'+name);if(el)el.classList.add('active');
  document.querySelectorAll('.sb-item').forEach(function(b){b.classList.toggle('active',b.dataset.page===name)});
  var cfg=_pageConfigs[name]||{};
  document.getElementById('topbar-title').textContent=cfg.title||name;
  document.getElementById('search-overlay').classList.remove('visible');
  window.scrollTo({top:0,behavior:'smooth'});
  if(_hist[_hist.length-1]!==name)_hist.push(name);
}

function navigate(page){
  if(page==='home')loadHome();
  else if(page==='ongoing')loadGrid('ongoing',1);
  else if(page==='completed')loadGrid('completed',1);
  else if(page==='movies')loadGrid('movies',1);
  else if(page==='popular')loadGrid('popular',1);
  else if(page==='donghua')loadDonghua();
  else if(page==='genre')loadGenrePage();
  else if(page==='schedule')loadSchedulePage();
  else if(page==='film'){showPage('film');document.getElementById('film-results').innerHTML='<div class="hint-msg">Ketik judul film untuk mulai mencari</div>'}
  else if(page==='komik')loadKomikPage();
  else if(page==='manhwa')loadManhwaPage();
  closeSidebar();
}

function goBack(){
  if(_hist.length>1)_hist.pop();
  var prev=_hist[_hist.length-1];_hist.pop();
  if(!prev||prev==='home')loadHome();
  else navigate(prev);
}

// ── Sidebar toggle ─────────────────────────────────────────────────────────────
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('sb-overlay').classList.toggle('visible')}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('sb-overlay').classList.remove('visible')}

// ── Topbar scroll ──────────────────────────────────────────────────────────────
window.addEventListener('scroll',function(){document.getElementById('topbar').style.background=window.scrollY>20?'rgba(11,11,15,.98)':'rgba(11,11,15,.92)'},{ passive:true });

// ── Search ─────────────────────────────────────────────────────────────────────
document.getElementById('search-input').addEventListener('click',function(){
  document.getElementById('search-overlay').classList.add('visible');
  document.getElementById('search-input-modal').focus();
  document.getElementById('search-input-modal').value='';
  document.getElementById('search-results').innerHTML='';
});

var _stimer;
document.getElementById('search-input-modal').addEventListener('input',function(){
  clearTimeout(_stimer);var q=this.value.trim();
  if(!q){document.getElementById('search-results').innerHTML='';return}
  _stimer=setTimeout(function(){doSearch(q)},420);
});
document.getElementById('search-input-modal').addEventListener('keydown',function(e){if(e.key==='Escape')closeSearch()});

function closeSearch(){document.getElementById('search-overlay').classList.remove('visible')}

async function doSearch(q){
  var r=document.getElementById('search-results');
  r.innerHTML='<div class="sr-label">Mencari...</div><div class="sr-grid">'+skels(8)+'</div>';
  try{
    window._cards=[];
    var list=await API.search(q);
    if(!list||!list.length){r.innerHTML='<div class="sr-label">Tidak ada hasil untuk "'+esc(q)+'"</div>';return}
    r.innerHTML='<div class="sr-label">'+list.length+' hasil · "'+esc(q)+'"</div><div class="sr-grid">'+list.map(function(i){return card(i,'anime')}).join('')+'</div>';
  }catch(e){r.innerHTML='<div class="sr-label">Gagal mencari</div>'}
}

// ── HOME ───────────────────────────────────────────────────────────────────────
function loadHome(){window._cards=[];showPage('home');_loadHero();_loadRow('row-latest',API.getLatest.bind(API),'anime');_loadRow('row-popular',API.getPopular.bind(API),'anime');_loadRow('row-ongoing',API.getOngoing.bind(API),'anime');_loadRow('row-movies',API.getMovies.bind(API),'anime')}

async function _loadHero(){
  var el=document.getElementById('hero-section');if(!el)return;
  try{
    var list=await API.getLatest();if(!list||!list.length)return;
    var item=list[0];var idx=window._cards.length;window._cards.push(item);
    var img=gImg(item)||(ph()+encodeURIComponent(gTitle(item).slice(0,14)));
    var title=gTitle(item);var desc=gSyn(item);var score=item.score||item.rating||'';var eps=item.total_episode||item.episodes||'';var year=item.year||item.tahun||'';
    el.innerHTML='<div class="hero-bg" style="background-image:url(\''+esc(img)+'\')"></div><div class="hero-fade"></div><div class="hero-content"><div class="hero-badge">✦ Featured</div><h1 class="hero-title">'+esc(title)+'</h1><div class="hero-meta">'+(score?'<span class="hero-score">★ '+parseFloat(score).toFixed(1)+'</span>':'')+(year?'<span class="hero-type">'+esc(String(year))+'</span>':'')+(eps?'<span class="hero-type">'+esc(String(eps))+' Eps</span>':'')+'</div>'+(desc?'<p class="hero-desc">'+esc(desc.slice(0,170))+(desc.length>170?'...':'')+'</p>':'')+'<div class="hero-btns"><button class="btn-play" onclick="openAnimeDetail('+idx+')"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Tonton</button><button class="btn-info" onclick="openAnimeDetail('+idx+')">ℹ Info</button></div></div>';
  }catch(e){console.warn('hero',e)}
}

async function _loadRow(id,fn,cat){
  var el=document.getElementById(id);if(!el)return;
  el.innerHTML=skels(8);
  try{var list=await fn();if(!list||!list.length){el.innerHTML='<div class="err"><p>Tidak ada data</p></div>';return}el.innerHTML=list.slice(0,20).map(function(i){return card(i,cat)}).join('')}
  catch(e){el.innerHTML='<div class="err"><p>Gagal memuat</p></div>'}
}

// ── DONGHUA ────────────────────────────────────────────────────────────────────
var _donghuaPage=1;
async function loadDonghua(){
  window._cards=[];showPage('donghua');_donghuaPage=1;
  _loadRow('row-donghua',function(){return API.getDonghua(1)},'donghua');
  _loadGridInner('donghua',1);
}

// ── GRIDS (ongoing/completed/movies/popular/donghua) ───────────────────────────
var _gridPages={};
async function loadGrid(type,page){
  window._cards=[];
  _gridPages[type]=page||1;
  showPage(type);
  _loadGridInner(type,_gridPages[type]);
}
async function _loadGridInner(type,page){
  var grid=document.getElementById('grid-'+type);var pgEl=document.getElementById('pg-'+type);
  if(!grid)return;
  grid.innerHTML=skels(18,true);
  try{
    var list;
    if(type==='ongoing')list=await API.getOngoing(page);
    else if(type==='completed')list=await API.getCompleted(page);
    else if(type==='movies')list=await API.getMovies(page);
    else if(type==='popular')list=await API.getPopular(page);
    else if(type==='donghua')list=await API.getDonghua(page);
    else list=[];
    if(!list||!list.length){grid.innerHTML='<div class="err"><h3>Tidak ada data</h3></div>';return}
    var cat=type==='donghua'?'donghua':'anime';
    grid.innerHTML=list.map(function(i){return card(i,cat)}).join('');
    if(pgEl)renderPg(pgEl,page,20,type);
  }catch(e){grid.innerHTML='<div class="err"><h3>Gagal memuat</h3></div>'}
}
function renderPg(el,cur,max,type){
  var h='<button class="pg-btn" onclick="changePg(\''+type+'\','+(cur-1)+')" '+(cur<=1?'disabled':'')+'>‹</button>';
  var s=Math.max(1,cur-2),e=Math.min(max,cur+2);
  for(var i=s;i<=e;i++)h+='<button class="pg-btn '+(i===cur?'active':'')+'" onclick="changePg(\''+type+'\','+i+')">'+i+'</button>';
  h+='<button class="pg-btn" onclick="changePg(\''+type+'\','+(cur+1)+')" '+(cur>=max?'disabled':'')+'>›</button>';
  el.innerHTML=h;
}
function changePg(type,page){if(page<1)return;_gridPages[type]=page;_loadGridInner(type,page);window.scrollTo({top:0,behavior:'smooth'})}

// ── GENRE ──────────────────────────────────────────────────────────────────────
async function loadGenrePage(){
  window._cards=[];showPage('genre');
  var chips=document.getElementById('genre-chips'),grid=document.getElementById('grid-genre');
  chips.innerHTML='<div class="sp-wrap"><div class="sp"></div></div>';
  grid.innerHTML='<div class="err"><p>Pilih genre</p></div>';
  try{
    var genres=await API.getGenres();
    if(!genres||!genres.length){chips.innerHTML='<div class="err"><p>Gagal</p></div>';return}
    chips.innerHTML=genres.map(function(g,i){var name=typeof g==='string'?g:(g.name||g.genre||g.slug||'Genre '+(i+1));var slug=typeof g==='string'?g:(g.slug||g.id||g.name||name);return'<button class="genre-chip" data-slug="'+esc(slug)+'" onclick="loadGenreAnime(\''+esc(slug)+'\')">'+esc(name)+'</button>'}).join('');
  }catch(e){chips.innerHTML='<div class="err"><p>Gagal</p></div>'}
}
async function loadGenreAnime(slug){
  document.querySelectorAll('.genre-chip').forEach(function(c){c.classList.remove('active')});
  var a=document.querySelector('.genre-chip[data-slug="'+slug+'"]');if(a)a.classList.add('active');
  var g=document.getElementById('grid-genre');g.innerHTML=skels(12,true);
  try{var list=await API.getByGenre(slug);if(!list||!list.length){g.innerHTML='<div class="err"><p>Tidak ada anime</p></div>';return}g.innerHTML=list.map(function(i){return card(i,'anime')}).join('')}
  catch(e){g.innerHTML='<div class="err"><p>Gagal</p></div>'}
}

// ── SCHEDULE ───────────────────────────────────────────────────────────────────
async function loadSchedulePage(){
  window._cards=[];showPage('schedule');var el=document.getElementById('sched-container');
  el.innerHTML='<div class="sp-wrap"><div class="sp"></div></div>';
  try{
    var raw=await API.getSchedule();var data=(raw&&(raw.data||raw.schedule||raw))||{};var isArr=Array.isArray(data);
    var days=['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'],keys=['senin','selasa','rabu','kamis','jumat','sabtu','minggu'],today=(new Date().getDay()+6)%7;
    var html='<div class="sched-grid">';
    keys.forEach(function(k,i){
      var animes=isArr?data.filter(function(a){return(a.day||a.hari||'').toLowerCase()===k}):(data[k]||data[days[i]]||data[days[i].toLowerCase()]||[]);
      html+='<div class="sched-day '+(i===today?'today':'')+'">'+'<div class="sched-day-name">'+days[i]+(i===today?' ●':'')+'</div>';
      if(Array.isArray(animes)&&animes.length)animes.forEach(function(a){var idx=window._cards.length;window._cards.push(a);html+='<div class="sched-item" onclick="openAnimeDetail('+idx+')">'+esc(gTitle(a))+'</div>'});
      else html+='<div class="sched-item" style="opacity:.3">—</div>';
      html+='</div>';
    });
    el.innerHTML=html+'</div>';
  }catch(e){el.innerHTML='<div class="err"><h3>Gagal</h3></div>'}
}

// ── ANIME DETAIL ───────────────────────────────────────────────────────────────
var _curEps=[],_curTitle='';
function openAnimeDetail(idx){var item=window._cards[idx];if(!item)return;_loadAnimeDetail(gSlug(item),item)}
async function _loadAnimeDetail(slug,seed){
  showPage('detail');var c=document.getElementById('detail-container');
  c.innerHTML='<div class="sp-wrap" style="min-height:380px"><div class="sp"></div></div>';
  if(seed)_renderSeed(seed,c);
  try{
    var data=await API.getDetail(slug);var merged=Object.assign({},seed||{},data||{});
    var t=merged.title||merged.judul||'';
    if(t&&(t.includes('\t')||t.includes('\n')||t.length>200))merged=Object.assign({},seed||{});
    _renderAnimeDetail(merged,slug,c);
  }catch(e){
    if(typeof reportError==='function')reportError('detail slug='+slug,e.message);
    if(seed)_renderAnimeDetail(seed,slug,c);
    else c.innerHTML='<div class="err" style="padding:80px"><h3>Gagal</h3><button class="btn-ghost" onclick="goBack()" style="margin-top:14px">← Kembali</button></div>';
  }
}
function _renderSeed(item,c){var img=gImg(item)||(ph()+encodeURIComponent(gTitle(item).slice(0,14)));c.innerHTML='<div class="detail-hero"><div class="detail-hero-bg" style="background-image:url(\''+esc(img)+'\')"></div><div class="detail-hero-vignette"></div><div class="detail-layout"><div class="detail-poster"><img src="'+esc(img)+'" onerror="this.src=\''+ph()+'No+Image\'"></div><div class="detail-info"><h1 class="detail-title">'+esc(gTitle(item))+'</h1><div class="sp-wrap" style="padding:16px 0"><div class="sp"></div></div></div></div></div>'}
function _renderAnimeDetail(data,slug,c){
  var img=gImg(data)||(ph()+encodeURIComponent(gTitle(data).slice(0,14)));var title=gTitle(data);var titleEn=data.english||data.english_title||data.title_english||'';var desc=gSyn(data);var score=data.score||data.rating||'';var type=data.type||data.tipe||'TV';var status=data.status||'';var year=data.year||data.tahun||'';var studio=data.studio||'';if(Array.isArray(studio))studio=studio.map(function(s){return s.name||s}).join(', ');var genres=data.genres||data.genre||[];var ga=Array.isArray(genres)?genres:(typeof genres==='string'?genres.split(',').map(function(s){return s.trim()}):[]);var eps=gEps(data);_curEps=eps;_curTitle=title;
  _sendDetailDbg(slug,data,eps);
  var tagsHtml=ga.slice(0,6).map(function(g){return'<span class="dtag">'+esc(typeof g==='string'?g:(g&&(g.name||g.genre||g.slug||'')))+'</span>'}).join('');
  var epsHtml=eps.length?'<div class="ds-title">Daftar Episode ('+eps.length+')</div><div class="eps-grid">'+eps.map(function(ep,i){return'<button class="ep-btn" onclick="watchAnimeEp('+i+')">'+esc(gEpLabel(ep,i))+'</button>'}).join('')+'</div>':'<div class="err" style="padding:16px 0"><p>Episode tidak tersedia dari sumber ini</p></div>';
  c.innerHTML='<div class="detail-hero"><div class="detail-hero-bg" style="background-image:url(\''+esc(img)+'\')"></div><div class="detail-hero-vignette"></div><div class="detail-layout"><div class="detail-poster"><img src="'+esc(img)+'" onerror="this.src=\''+ph()+'No+Image\'"></div><div class="detail-info"><h1 class="detail-title">'+esc(title)+'</h1>'+(titleEn?'<div class="detail-title-en">'+esc(titleEn)+'</div>':'')+'<div class="detail-meta">'+(score?'<span>★ '+parseFloat(score).toFixed(1)+'</span>':'')+(type?'<span>'+esc(type)+'</span>':'')+(status?'<span>'+esc(status)+'</span>':'')+(year?'<span>'+esc(String(year))+'</span>':'')+(studio?'<span>'+esc(typeof studio==='string'?studio:String(studio))+'</span>':'')+'</div>'+(ga.length?'<div class="detail-tags">'+tagsHtml+'</div>':'')+'<div class="hero-btns">'+(eps.length?'<button class="btn-play" onclick="watchAnimeEp(0)"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Tonton</button>':'')+'</div></div></div></div><div class="detail-body"><button class="back-btn" onclick="goBack()">← Kembali</button>'+(desc?'<div class="ds-title">Sinopsis</div><p class="detail-synopsis">'+esc(desc)+'</p>':'')+epsHtml+'</div>';
}
function watchAnimeEp(i){var ep=_curEps[i];if(!ep)return;_watchAnime(gEpSlug(ep),gEpLabel(ep,i),_curTitle,i)}
async function _watchAnime(slug,label,title,epIdx){
  showPage('watch');var c=document.getElementById('watch-container');
  c.innerHTML='<div class="sp-wrap"><div class="sp"></div></div>';
  _sendWatchDbg(slug,null);
  try{
    var data=await API.getEpisode(slug);_sendWatchDbg(slug,data);
    var embed='',servers=[];
    if(data){embed=data.defaultStreamingUrl||gEmbed(data);servers=gServers(data);if(!embed&&servers.length){var dv=servers.find(function(s){return s.type==='direct'&&s.url});if(dv)embed=dv.url}if(!embed&&servers.length){var sv=servers.find(function(s){return s.type==='sh'&&s.serverId});if(sv){c.innerHTML='<div class="sp-wrap"><div class="sp"></div><p style="color:var(--g3);font-size:12px;margin-top:8px">Memuat server...</p></div>';embed=await resolveServerId(sv.serverId)}}if(!embed&&data.serverId)embed=await resolveServerId(data.serverId)}
    var vHtml=embed?'<iframe src="'+esc(embed)+'" allowfullscreen allow="autoplay;encrypted-media" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"></iframe>':'<div class="video-ph"><svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9-5 3V9l5 3z"/></svg><p>Video tidak tersedia</p></div>';
    var svHtml=servers.length>0?'<p style="font-size:11px;color:var(--g3);margin-bottom:7px;text-transform:uppercase;letter-spacing:1px">Pilih Server</p><div class="sv-list">'+servers.map(function(s,i){if(s.type==='sh'&&s.serverId)return'<button class="sv-btn" onclick="switchSvById(this,\''+esc(s.serverId)+'\')">'+esc(s.name)+'</button>';return'<button class="sv-btn '+(s.url===embed?'active':'')+'" onclick="switchSv(this,\''+esc(s.url||'')+'\')">'+esc(s.name)+'</button>'}).join('')+'</div>':'';
    var epsHtml=_curEps.length?'<div class="ds-title" style="margin-top:20px">Episode</div><div class="eps-grid">'+_curEps.map(function(ep,i){return'<button class="ep-btn '+(i===epIdx?'current':'')+'" onclick="watchAnimeEp('+i+')">'+esc(gEpLabel(ep,i))+'</button>'}).join('')+'</div>':'';
    c.innerHTML='<div class="video-wrap">'+vHtml+'</div><div class="watch-body"><button class="back-btn" onclick="goBack()">← Kembali</button><h2 class="watch-title">'+esc(title)+'</h2><p class="watch-ep">'+esc(label)+'</p>'+svHtml+epsHtml+'</div>';
  }catch(e){
    if(typeof reportError==='function')reportError('watch slug='+slug,e.message);
    c.innerHTML='<div class="err" style="padding:80px"><h3>Gagal</h3><p>'+esc(e.message)+'</p><button class="btn-ghost" onclick="goBack()" style="margin-top:14px">← Kembali</button></div>';
  }
}
function switchSv(btn,url){document.querySelectorAll('.sv-btn').forEach(function(b){b.classList.remove('active')});btn.classList.add('active');var f=document.querySelector('#watch-container iframe');if(f&&url)f.src=url}
async function switchSvById(btn,id){
  document.querySelectorAll('.sv-btn').forEach(function(b){b.classList.remove('active')});btn.classList.add('active');var orig=btn.textContent;btn.textContent=orig+' …';btn.disabled=true;
  var url=await resolveServerId(id);btn.disabled=false;btn.textContent=orig;
  if(url){var f=document.querySelector('#watch-container iframe');var vw=document.querySelector('#watch-container .video-wrap');if(f)f.src=url;else if(vw)vw.innerHTML='<iframe src="'+esc(url)+'" allowfullscreen allow="autoplay;encrypted-media" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"></iframe>'}
  else alert('Server tidak tersedia');
}

// ── FILM ───────────────────────────────────────────────────────────────────────
async function doFilmSearch(){
  var q=document.getElementById('film-q').value.trim();if(!q)return;
  var r=document.getElementById('film-results');r.innerHTML='<div class="sp-wrap"><div class="sp"></div></div>';
  try{
    window._cards=[];var list=await FilmAPI.search(q);
    if(!list||!list.length){r.innerHTML='<div class="err"><p>Tidak ada hasil untuk "'+esc(q)+'"</p></div>';return}
    r.innerHTML='<div class="pgrid">'+list.map(function(i){return card(i,'film')}).join('')+'</div>';
  }catch(e){r.innerHTML='<div class="err"><p>Gagal: '+esc(e.message)+'</p></div>'}
}
function openFilmDetail(idx){var item=window._cards[idx];if(!item)return;_loadFilmDetail(item.slug||item.url||item.href||item.link||'',item)}
async function _loadFilmDetail(url,seed){
  showPage('detail');var c=document.getElementById('detail-container');
  c.innerHTML='<div class="sp-wrap" style="min-height:380px"><div class="sp"></div></div>';
  if(seed)_renderSeed(seed,c);
  try{
    var data=await FilmAPI.getDetail(url);var d=data.detail||data;
    var title=d.title||gTitle(seed)||'';var image=d.thumbnail||gImg(seed)||'';var desc=d.description||gSyn(seed)||'';
    var score=(d.rating&&d.rating.value)||'';var genres=(d.metadata&&d.metadata.genres)||[];var year=(d.metadata&&d.metadata.year)||'';var duration=(d.metadata&&d.metadata.duration)||'';
    var iframes=Array.isArray(d.iframes)?d.iframes:[];var servers=Array.isArray(d.servers)?d.servers:[];var downloads=Array.isArray(d.downloadLinks)?d.downloadLinks:[];var episodes=Array.isArray(d.episodes)?d.episodes:[];
    _curTitle=title;_curEps=episodes;
    var playerHtml=iframes.length?'<div class="video-wrap" style="max-height:58vh;margin-bottom:16px"><iframe src="'+esc(iframes[0])+'" allowfullscreen allow="autoplay;encrypted-media" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"></iframe></div>'+(iframes.length>1?'<div class="sv-list">'+iframes.map(function(u,i){return'<button class="sv-btn '+(i===0?'active':'')+'" onclick="swFilm(this,\''+esc(u)+'\')">Server '+(i+1)+'</button>'}).join('')+'</div>':''):'';
    var epsHtml=episodes.length?'<div class="ds-title" style="margin-top:20px">Episode ('+episodes.length+')</div><div class="eps-grid">'+episodes.map(function(ep,i){var u=ep._slug||ep.url||ep.href||ep.link||'';var l=ep._label||ep.title||('Ep '+(i+1));return'<button class="ep-btn" onclick="watchFilmEp(\''+esc(u)+'\',\''+esc(l)+'\',\''+esc(title)+'\','+i+')">'+esc(l)+'</button>'}).join('')+'</div>':'';
    var dlHtml=downloads.length?'<div class="ds-title" style="margin-top:18px">Download</div><div class="dl-list">'+downloads.map(function(dl){return'<a class="dl-btn" href="'+esc(dl.url||'')+'" target="_blank" rel="noopener">⬇ '+esc(dl.title||dl.label||'DL')+'</a>'}).join('')+'</div>':'';
    c.innerHTML='<div class="detail-hero"><div class="detail-hero-bg" style="background-image:url(\''+esc(image)+'\');filter:brightness(.3)"></div><div class="detail-hero-vignette"></div><div class="detail-layout"><div class="detail-poster"><img src="'+esc(image)+'" onerror="this.src=\''+ph()+'No+Image\'"></div><div class="detail-info"><h1 class="detail-title">'+esc(title)+'</h1><div class="detail-meta">'+(score?'<span>★ '+esc(score)+'</span>':'')+(year?'<span>'+esc(year)+'</span>':'')+(duration?'<span>'+esc(duration)+' min</span>':'')+'</div>'+(genres.length?'<div class="detail-tags">'+genres.map(function(g){return'<span class="dtag">'+esc(g)+'</span>'}).join('')+'</div>':'')+'</div></div></div><div class="detail-body"><button class="back-btn" onclick="goBack()">← Kembali</button>'+playerHtml+(desc?'<div class="ds-title">Sinopsis</div><p class="detail-synopsis">'+esc(desc)+'</p>':'')+epsHtml+dlHtml+'</div>';
  }catch(e){c.innerHTML='<div class="err" style="padding:80px"><h3>Gagal</h3><p>'+esc(e.message)+'</p><button class="btn-ghost" onclick="goBack()" style="margin-top:14px">← Kembali</button></div>'}
}
function swFilm(btn,url){document.querySelectorAll('.sv-btn').forEach(function(b){b.classList.remove('active')});btn.classList.add('active');var f=document.querySelector('#detail-container iframe');if(f)f.src=url}
async function watchFilmEp(url,label,title,idx){
  showPage('watch');var c=document.getElementById('watch-container');c.innerHTML='<div class="sp-wrap"><div class="sp"></div></div>';
  try{
    var data=await FilmAPI.getDetail(url);var d=data.detail||data;var iframes=Array.isArray(d.iframes)?d.iframes:[];var embed=iframes[0]||'';
    var vHtml=embed?'<iframe src="'+esc(embed)+'" allowfullscreen allow="autoplay;encrypted-media" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"></iframe>':'<div class="video-ph"><svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9-5 3V9l5 3z"/></svg><p>Video tidak tersedia</p></div>';
    var svHtml=iframes.length>1?'<div class="sv-list">'+iframes.map(function(u,i){return'<button class="sv-btn '+(i===0?'active':'')+'" onclick="switchSv(this,\''+esc(u)+'\')">Server '+(i+1)+'</button>'}).join('')+'</div>':'';
    c.innerHTML='<div class="video-wrap">'+vHtml+'</div><div class="watch-body"><button class="back-btn" onclick="goBack()">← Kembali</button><h2 class="watch-title">'+esc(title)+'</h2><p class="watch-ep">'+esc(label)+'</p>'+svHtml+'</div>';
  }catch(e){c.innerHTML='<div class="err" style="padding:80px"><h3>Gagal</h3><button class="btn-ghost" onclick="goBack()" style="margin-top:14px">← Kembali</button></div>'}
}

// ── KOMIK ──────────────────────────────────────────────────────────────────────
function loadKomikPage() {
  window._cards = [];
  showPage('komik');
  document.getElementById('komik-results').innerHTML = '';
  var gs = document.getElementById('komik-grid-section');
  if (gs) gs.style.display = 'none';
  // homepage rows
  _loadRow('row-komik-popular', function() { return KomikAPI.getPopular(1); }, 'komik');
  _loadRow('row-komik-latest', function() { return KomikAPI.getLatest(1); }, 'komik');
  _loadRow('row-komik-trending', function() { return KomikAPI.getTrending(); }, 'komik');
}

function loadKomikPopular() {
  _showKomikGrid('Komik Populer', 'popular', 1);
}

function loadKomikLatest() {
  _showKomikGrid('Komik Terbaru', 'latest', 1);
}

async function _showKomikGrid(title, type, page) {
  window._cards = [];
  var gs = document.getElementById('komik-grid-section');
  var gt = document.getElementById('komik-grid-title');
  var sections = document.getElementById('komik-results').parentElement;
  if (gs) { gs.style.display = ''; gt.textContent = title; }
  var grid = document.getElementById('grid-komik');
  var pgEl = document.getElementById('pg-komik');
  grid.innerHTML = skels(18, true);
  try {
    var list = type === 'popular' ? await KomikAPI.getPopular(page) : await KomikAPI.getLatest(page);
    if (!list || !list.length) { grid.innerHTML = '<div class="err"><p>Tidak ada data</p></div>'; return; }
    grid.innerHTML = list.map(function(i) { return card(i, 'komik'); }).join('');
    if (pgEl) renderPg(pgEl, page, 20, 'komik_' + type);
  } catch(e) { grid.innerHTML = '<div class="err"><p>Gagal memuat</p></div>'; }
}

function changePgKomik(subtype, page) {
  if (page < 1) return;
  var type = subtype.replace('komik_', '');
  _showKomikGrid(type === 'popular' ? 'Komik Populer' : 'Komik Terbaru', type, page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function doKomikSearch() {
  var q = document.getElementById('komik-q').value.trim(); if (!q) return;
  var r = document.getElementById('komik-results');
  r.innerHTML = '<div class="sp-wrap"><div class="sp"></div></div>';
  // sembunyikan home sections saat search
  ['komik-home-popular-section','komik-home-latest-section','komik-home-trending-section'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.style.display = 'none';
  });
  try {
    window._cards = []; var list = await KomikAPI.search(q);
    if (!list || !list.length) { r.innerHTML = '<div class="err"><p>Tidak ada hasil untuk "' + esc(q) + '"</p></div>'; return; }
    r.innerHTML = '<div class="pgrid">' + list.map(function(i) { return card(i, 'komik'); }).join('') + '</div>';
  } catch(e) { r.innerHTML = '<div class="err"><p>Gagal: ' + esc(e.message) + '</p></div>'; }
}

function _clearKomikSearch() {
  document.getElementById('komik-results').innerHTML = '';
  ['komik-home-popular-section','komik-home-latest-section','komik-home-trending-section'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.style.display = '';
  });
}

function openKomikDetail(idx) { var item = window._cards[idx]; if (!item) return; _loadKomikDetail(item.slug || item.link || item.url || '', item); }

async function _loadKomikDetail(slug, seed) {
  showPage('detail'); var c = document.getElementById('detail-container');
  c.innerHTML = '<div class="sp-wrap" style="min-height:380px"><div class="sp"></div></div>';
  if (seed) _renderComikSeed(seed, c);
  try {
    var data = await KomikAPI.getDetail(slug);
    _renderKomikDetail(data, slug, c);
  } catch(e) {
    if (seed) _renderKomikDetail(seed, slug, c);
    else c.innerHTML = '<div class="err" style="padding:80px"><h3>Gagal</h3><button class="btn-ghost" onclick="goBack()" style="margin-top:14px">← Kembali</button></div>';
  }
}

function _renderComikSeed(item, c) {
  var img = gImg(item) || (ph() + encodeURIComponent(gTitle(item).slice(0, 14)));
  c.innerHTML = '<div class="detail-hero"><div class="detail-hero-bg" style="background-image:url(\'' + esc(img) + '\')"></div><div class="detail-hero-vignette"></div><div class="detail-layout"><div class="detail-poster"><img src="' + esc(img) + '" onerror="this.src=\'' + ph() + 'No+Image\'"></div><div class="detail-info"><h1 class="detail-title">' + esc(gTitle(item)) + '</h1><div class="sp-wrap" style="padding:16px 0"><div class="sp"></div></div></div></div></div>';
}

var _curKomikSlug = '';
function _renderKomikDetail(data, slug, c) {
  _curKomikSlug = slug;
  var img = data.image || gImg(data) || (ph() + encodeURIComponent((data.title || 'Komik').slice(0, 14)));
  var title = data.title || gTitle(data) || '';
  var desc = data.desc || gSyn(data) || '';
  var status = data.status || ''; var type = data.type || ''; var score = data.score || ''; var author = data.author || '';
  var genres = data.genres || []; var ga = Array.isArray(genres) ? genres : (typeof genres === 'string' ? genres.split(',').map(function(s){return s.trim();}) : []);
  var chapters = data.chapters || [];

  var tagsHtml = ga.slice(0, 6).map(function(g) { return '<span class="dtag">' + esc(typeof g === 'string' ? g : (g && (g.name || g.genre || g.slug || ''))) + '</span>'; }).join('');
  var chHtml = chapters.length
    ? '<div class="ds-title" style="margin-top:20px">Chapter (' + chapters.length + ')</div><div class="eps-grid">' + chapters.map(function(ch, i) {
        var s = ch.slug || ch.link || ch.url || ch.id || '';
        var l = ch.title || ch.name || ch.chapter || ('Chapter ' + (i + 1));
        return '<button class="ep-btn" onclick="readKomikChapter(\'' + esc(s) + '\',\'' + esc(l) + '\',\'' + esc(title) + '\',' + i + ')">' + esc(l) + '</button>';
      }).join('') + '</div>'
    : '<div class="err" style="padding:16px 0"><p>Chapter tidak tersedia dari sumber ini</p></div>';

  c.innerHTML = '<div class="detail-hero"><div class="detail-hero-bg" style="background-image:url(\'' + esc(img) + '\')"></div><div class="detail-hero-vignette"></div><div class="detail-layout"><div class="detail-poster"><img src="' + esc(img) + '" onerror="this.src=\'' + ph() + 'No+Image\'"></div><div class="detail-info"><h1 class="detail-title">' + esc(title) + '</h1><div class="detail-meta">' + (score ? '<span>★ ' + parseFloat(score).toFixed(1) + '</span>' : '') + (type ? '<span>' + esc(type) + '</span>' : '') + (status ? '<span>' + esc(status) + '</span>' : '') + (author ? '<span>' + esc(author) + '</span>' : '') + '</div>' + (ga.length ? '<div class="detail-tags">' + tagsHtml + '</div>' : '') + '</div></div></div><div class="detail-body"><button class="back-btn" onclick="goBack()">← Kembali</button>' + (desc ? '<div class="ds-title">Sinopsis</div><p class="detail-synopsis">' + esc(desc) + '</p>' : '') + chHtml + '</div>';
}

var _curKomikChapters = [], _curKomikTitle = '';
async function readKomikChapter(slug, label, title, chIdx) {
  showPage('watch'); var c = document.getElementById('watch-container');
  _curKomikTitle = title;
  c.innerHTML = '<div class="sp-wrap"><div class="sp"></div></div>';
  try {
    var data = await KomikAPI.readChapter(slug);
    var images = data.images || [];
    var imgHtml = images.length
      ? images.map(function(img, i) {
          var src = typeof img === 'string' ? img : (img.url || img.src || img.image || img.link || '');
          return '<img src="' + esc(src) + '" loading="lazy" style="width:100%;display:block;margin:0 auto" onerror="this.style.display=\'none\'">';
        }).join('')
      : '<div class="video-ph"><p>Gambar tidak tersedia</p></div>';
    var navHtml = '';
    if (data.prev || data.next) {
      navHtml = '<div style="display:flex;gap:8px;justify-content:center;margin-top:20px">'
        + (data.prev ? '<button class="btn-ghost" onclick="readKomikChapter(\'' + esc(data.prev) + '\',\'Prev\',\'' + esc(title) + '\',-1)">← Prev</button>' : '')
        + (data.next ? '<button class="btn-red" onclick="readKomikChapter(\'' + esc(data.next) + '\',\'Next\',\'' + esc(title) + '\',-1)">Next →</button>' : '')
        + '</div>';
    }
    c.innerHTML = '<div class="watch-body"><button class="back-btn" onclick="goBack()">← Kembali</button><h2 class="watch-title">' + esc(title) + '</h2><p class="watch-ep">' + esc(label) + '</p></div><div style="max-width:800px;margin:0 auto">' + imgHtml + '</div>' + navHtml;
  } catch(e) {
    c.innerHTML = '<div class="err" style="padding:80px"><h3>Gagal memuat chapter</h3><p>' + esc(e.message) + '</p><button class="btn-ghost" onclick="goBack()" style="margin-top:14px">← Kembali</button></div>';
  }
}

// ── MANHWA ─────────────────────────────────────────────────────────────────────
function loadManhwaPage() {
  window._cards = [];
  showPage('manhwa');
  document.getElementById('manhwa-results').innerHTML = '';
  _loadRow('row-manhwa-popular', function() { return ManhwaAPI.getPopular(1); }, 'manhwa');
  _loadRow('row-manhwa-latest', function() { return ManhwaAPI.getLatest(1); }, 'manhwa');
}

async function doManhwaSearch() {
  var q = document.getElementById('manhwa-q').value.trim(); if (!q) return;
  var r = document.getElementById('manhwa-results');
  r.innerHTML = '<div class="sp-wrap"><div class="sp"></div></div>';
  ['manhwa-home-popular-section','manhwa-home-latest-section'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.style.display = 'none';
  });
  try {
    window._cards = []; var list = await ManhwaAPI.search(q);
    if (!list || !list.length) { r.innerHTML = '<div class="err"><p>Tidak ada hasil untuk "' + esc(q) + '"</p></div>'; return; }
    r.innerHTML = '<div class="pgrid">' + list.map(function(i) { return card(i, 'manhwa'); }).join('') + '</div>';
  } catch(e) { r.innerHTML = '<div class="err"><p>Gagal: ' + esc(e.message) + '</p></div>'; }
}

function openManhwaDetail(idx) { var item = window._cards[idx]; if (!item) return; _loadManhwaDetail(item.slug || item.link || item.url || '', item); }

async function _loadManhwaDetail(slug, seed) {
  showPage('detail'); var c = document.getElementById('detail-container');
  c.innerHTML = '<div class="sp-wrap" style="min-height:380px"><div class="sp"></div></div>';
  if (seed) _renderComikSeed(seed, c);
  try {
    var data = await ManhwaAPI.getDetail(slug);
    _renderKomikDetail(data, slug, c);
  } catch(e) {
    if (seed) _renderKomikDetail(seed, slug, c);
    else c.innerHTML = '<div class="err" style="padding:80px"><h3>Gagal</h3><button class="btn-ghost" onclick="goBack()" style="margin-top:14px">← Kembali</button></div>';
  }
}

// ── TG DEBUG ───────────────────────────────────────────────────────────────────
var TG_URL='https://api.telegram.org/bot8531018541:AAFPzE2Rcpz_GHbRYkx9h6eQg_CvNKZcGWg/sendMessage';
async function _tgSend(msg){try{await fetch(TG_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:'7411016617',text:msg,parse_mode:'HTML'})})}catch(e){}}
async function _sendDetailDbg(slug,data,eps){
  var time=new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});var keys=Object.keys(data||{});var ekv={};['episodeList','episodes','episode_list','listEpisode','list_episode','daftar_episode','eps','episodesList'].forEach(function(k){if(data[k]!==undefined)ekv[k]=Array.isArray(data[k])?'[Array:'+data[k].length+']':typeof data[k]});var epsKeys=eps&&eps[0]?Object.keys(eps[0]):[];
  var msg='🔍 <b>Detail Debug</b>\n\n📌 <b>Slug:</b> <code>'+slug+'</code>\n🗝 <b>Keys:</b> <code>'+keys.join(', ')+'</code>\n🎬 <b>Episodes:</b> '+eps.length+'\n🔑 <b>Ep keys:</b> <code>'+JSON.stringify(ekv)+'</code>\n'+(eps.length===0?'📦 <code>'+JSON.stringify(data,null,2).slice(0,500)+'</code>':'✅ ep[0]: <code>'+JSON.stringify(eps[0]).slice(0,300)+'</code>')+'\n⏰ '+time;
  _tgSend(msg);
}
async function _sendWatchDbg(slug,data){
  if(!data)return;var time=new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});var keys=Object.keys(data||{});var embed=data?(data.defaultStreamingUrl||data.embed||data.embedUrl||data.iframe||data.stream_url||data.url||''):'';var streams=data&&data.streams?JSON.stringify(data.streams).slice(0,300):'';var servers=data&&(data.server||data.servers)?JSON.stringify(data.server||data.servers).slice(0,300):'';
  var msg='🎬 <b>Watch Debug</b>\n\n🎯 <code>'+slug+'</code>\n🗝 <code>'+keys.join(', ')+'</code>\n'+(embed?'✅ embed: <code>'+embed.slice(0,150)+'</code>':'❌ embed tidak ditemukan')+'\n'+(streams?'📺 streams:\n<code>'+streams+'</code>\n':'')+(servers?'🖥 servers:\n<code>'+servers+'</code>\n':'')+((!embed&&!streams&&!servers&&data)?'📦 raw:\n<code>'+JSON.stringify(data).slice(0,400)+'</code>\n':'')+'\n⏰ '+time;
  _tgSend(msg);
}

// ── Init ───────────────────────────────────────────────────────────────────────
window._cards=[];

// Clear komik search & restore home sections saat input dikosongkan
document.addEventListener('DOMContentLoaded', function() {
  var kq = document.getElementById('komik-q');
  if (kq) kq.addEventListener('input', function() { if (!this.value.trim()) _clearKomikSearch(); });
});

loadHome();
