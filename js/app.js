// ============================================
// KLUNE STREAM - App v4
// ============================================

window._cards = [];
var _curCat = 'anime';

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function getImg(o){if(!o)return'';return o.poster||o.image||o.img||o.thumb||o.thumbnail||o.cover||o.foto||o.banner||o.coverImage||o.poster_url||o.image_url||''}
function getTitle(o){if(!o)return'Unknown';return o.title||o.judul||o.name||o.anime_title||o.animeTitle||o.romaji||o.english||'Unknown'}
function getSlug(o){if(!o)return'';return o.slug||o.animeId||o.anime_id||o.id||o.url||o.link||o.endpoint||o.href||''}
function getEpSlug(ep){if(!ep)return'';return ep._slug||ep.slug||ep.episode_id||ep.id||ep.url||ep.link||ep.href||ep.endpoint||''}
function getEpLabel(ep,i){if(!ep)return'Episode '+(i+1);return ep._label||ep.episode||ep.eps||ep.name||ep.title||ep.judul||ep.label||ep.no||('Episode '+(i+1))}
function getSynopsis(o){if(!o)return'';return o.synopsis||o.sinopsis||o.description||o.deskripsi||o.overview||o.plot||o.summary||''}
function ph(){return'https://placehold.co/300x450/1c1c22/444?text='}

function getEpisodes(o){
  if(!o)return[];
  var candidates=[o.episodeList,o.episodes,o.episode_list,o.listEpisode,o.list_episode,o.daftar_episode,o.eps,o.episodesList,o.daftarEpisode,o.listEps];
  for(var i=0;i<candidates.length;i++){var e=candidates[i];if(Array.isArray(e)&&e.length>0)return normalizeEpList(e)}
  var nested=o.data||o.result||o.anime||o.detail||{};
  if(nested&&typeof nested==='object'&&!Array.isArray(nested)){
    var c2=[nested.episodeList,nested.episodes,nested.episode_list,nested.listEpisode,nested.list_episode,nested.daftar_episode,nested.eps,nested.episodesList];
    for(var j=0;j<c2.length;j++){var e2=c2[j];if(Array.isArray(e2)&&e2.length>0)return normalizeEpList(e2)}
  }
  return[];
}

function normalizeEpList(arr){
  return arr.map(function(ep,i){
    if(!ep||typeof ep!=='object')return{_slug:String(ep),_label:'Episode '+(i+1)};
    var rawSlug=ep.episodeId||ep.episode_id||ep.slug||ep.id||ep.url||ep.link||ep.href||ep.endpoint||'';
    var slug=_cleanEpSlug(rawSlug);
    var label=ep.episode||ep.eps||ep.no||ep.number||ep.num||ep.ep_number||ep.name||ep.title||ep.judul||ep.label||('Episode '+(i+1));
    if(typeof label==='string'&&label.length>40){var nm=slug.match(/episode[- ](\d+)/i);label=nm?nm[1]:('Ep '+(i+1))}
    return Object.assign({},ep,{_slug:slug,_label:String(label)});
  });
}

function _cleanEpSlug(slug){
  if(!slug)return'';
  if(slug.startsWith('http')){try{slug=new URL(slug).pathname}catch(e){}}
  slug=slug.replace(/^\/+/,'').replace(/\/+$/,'');
  var prev;
  do{
    prev=slug;
    slug=slug.replace(/^(?:anime\/)?(?:samehadaku|animasu|animekuindo|stream|animesail|oploverz|anoboy|nimegami|donghub|donghua|kura|kusonime|winbu|alqanime|otakudesu)\/(?:episode|anime|detail|watch|series|film|batch|server)\//,'');
    slug=slug.replace(/^(?:anime\/)?(?:episode|anime|detail|watch|server)\//,'');
    slug=slug.replace(/^\/+/,'');
  }while(slug!==prev);
  return slug;
}

function getEmbed(o){
  if(!o)return'';
  var u=o.defaultStreamingUrl||o.embed||o.embedUrl||o.iframe||o.iframeUrl||o.stream_url||o.streamUrl||o.url||o.link||o.src||'';
  if(u)return u;
  if(o.streams&&Array.isArray(o.streams)&&o.streams.length){var s=o.streams[0];u=s.url||s.embed||s.iframe||s.src||'';if(u)return u}
  if(o.server){var sv=Array.isArray(o.server)?o.server[0]:o.server;if(sv){u=sv.url||sv.embed||sv.iframe||sv.src||'';if(u)return u}}
  if(o.servers){var sv2=Array.isArray(o.servers)?o.servers[0]:o.servers;if(sv2){u=sv2.url||sv2.embed||sv2.iframe||sv2.src||'';if(u)return u}}
  return'';
}

function getServers(o){
  if(!o)return[];
  var result=[];
  if(o.streams&&Array.isArray(o.streams)){o.streams.forEach(function(s,i){var url=s.url||s.embed||s.iframe||s.src||'';if(url)result.push({name:s.quality||s.name||('Stream '+(i+1)),url:url,type:'direct'})})}
  var svObj=o.server||o.servers||o;
  if(svObj&&svObj.qualities&&Array.isArray(svObj.qualities)){svObj.qualities.forEach(function(q){var list=q.serverList||[];if(Array.isArray(list)){list.forEach(function(sv){var sid=sv.serverId||sv.server_id||sv.id||'';if(sid)result.push({name:(sv.title||sv.name||'Server')+(q.title&&q.title!=='unknown'?' ('+q.title+')':''),serverId:sid,type:'samehadaku'})})}})}
  var raw=Array.isArray(o.server)?o.server:(Array.isArray(o.servers)?o.servers:[]);
  raw.forEach(function(s,i){if(!s||s.qualities)return;if(typeof s==='string'){result.push({name:'Server '+(i+1),url:s,type:'direct'});return}var url=s.url||s.embed||s.iframe||s.src||'';var sid=s.serverId||s.server_id||'';var name=s.name||s.server||s.quality||s.title||('Server '+(i+1));if(url)result.push({name:name,url:url,type:'direct'});else if(sid)result.push({name:name,serverId:sid,href:s.href||'',type:'samehadaku'})});
  if(o.iframes&&Array.isArray(o.iframes)){o.iframes.forEach(function(url,i){if(url)result.push({name:'Server '+(i+1),url:url,type:'direct'})})}
  return result;
}

async function resolveServerId(serverId){
  try{
    var raw=await API.getServer(serverId);
    if(!raw)return'';
    var url=raw.url||raw.embed||raw.embedUrl||raw.iframe||raw.src||raw.stream_url||'';
    if(!url&&raw.data){var d=raw.data;url=d.url||d.embed||d.embedUrl||d.iframe||d.src||''}
    return url||'';
  }catch(e){return''}
}

// ── Skeletons ──────────────────────────────────────────────────────────────────
function skels(n,inGrid){
  var w=inGrid?'':' style="flex-shrink:0;width:152px"';
  var h='';
  for(var i=0;i<n;i++)h+='<div class="sk-card"'+w+'><div class="sk sk-thumb"></div><div class="sk sk-line"></div><div class="sk sk-line s60"></div></div>';
  return h;
}

// ── Card builder ───────────────────────────────────────────────────────────────
function card(item,catOverride){
  var idx=window._cards.length;
  window._cards.push(item);
  var image=getImg(item)||(ph()+encodeURIComponent(getTitle(item).slice(0,14)));
  var title=getTitle(item);
  var score=item.score||item.rating||item.nilai||'';
  var status=(item.status||item.tipe_status||'').toLowerCase();
  var type=(item.type||item.tipe||'').toLowerCase();
  var eps=item.total_episode||item.episodes||item.episode_count||item.totalEpisode||'';
  var cat=catOverride||item._cat||'';

  var badges='';
  if(cat==='komik'||type.includes('komik'))badges+='<span class="badge b-komik">Komik</span>';
  else if(cat==='manhwa'||type.includes('manhwa')||type.includes('webtoon'))badges+='<span class="badge b-manhwa">Manhwa</span>';
  else if(cat==='film'||type.includes('film')||type.includes('drama'))badges+='<span class="badge b-film">Film</span>';
  else if(type.includes('donghua'))badges+='<span class="badge b-donghua">Donghua</span>';
  else if(type.includes('movie'))badges+='<span class="badge b-movie">Movie</span>';
  else if(status.includes('ongoing')||status.includes('airing')||status.includes('tayang'))badges+='<span class="badge b-ongoing">Ongoing</span>';
  else if(status.includes('complet')||status.includes('tamat'))badges+='<span class="badge b-completed">Tamat</span>';

  var onclick='';
  if(cat==='komik')onclick='_openKomikDetail('+idx+')';
  else if(cat==='manhwa')onclick='_openManhwaDetail('+idx+')';
  else if(cat==='film')onclick='_openFilmDetail('+idx+')';
  else onclick='_openDetail('+idx+')';

  return '<div class="anime-card" onclick="'+onclick+'">'+
    '<div class="card-thumb">'+
    '<img src="'+esc(image)+'" alt="" loading="lazy" onerror="this.src=\''+ph()+'No+Image\'">'+
    '<div class="card-badges">'+badges+'</div>'+
    (score?'<div class="card-score">★ '+parseFloat(score).toFixed(1)+'</div>':'')+
    '<div class="card-overlay">'+
    '<div class="ov-title">'+esc(title)+'</div>'+
    '<div class="ov-btns">'+
    '<button class="ov-btn play" onclick="event.stopPropagation();'+onclick+'"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>'+
    '</div></div></div>'+
    '<div class="card-info"><div class="card-title">'+esc(title)+'</div>'+
    '<div class="card-sub">'+(eps?eps+' Eps · ':'')+((item.type||item.tipe||'—'))+'</div>'+
    '</div></div>';
}

// ── Page system ────────────────────────────────────────────────────────────────
var _hist=['home'];
function showPage(name){
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  var el=document.getElementById('page-'+name);
  if(el)el.classList.add('active');
  document.getElementById('search-results-container').classList.remove('visible');
  window.scrollTo({top:0,behavior:'smooth'});
  if(_hist[_hist.length-1]!==name)_hist.push(name);
}
function goBack(){
  if(_hist.length>1)_hist.pop();
  var prev=_hist[_hist.length-1]||'home';
  _hist.pop();
  if(prev==='home')loadHome();
  else if(prev==='donghua-home')loadDonghuaHome();
  else if(prev==='film-home')switchCat('film');
  else if(prev==='komik-home')switchCat('komik');
  else if(prev==='manhwa-home')switchCat('manhwa');
  else if(prev==='browse')showPage('browse');
  else if(prev==='genre')loadGenrePage();
  else if(prev==='schedule')loadSchedulePage();
  else showPage(prev);
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
window.addEventListener('scroll',function(){document.getElementById('navbar').classList.toggle('solid',window.scrollY>50)});

// ── Category switch ────────────────────────────────────────────────────────────
function switchCat(cat){
  _curCat=cat;
  document.querySelectorAll('.nav-cat').forEach(function(b){b.classList.toggle('active',b.dataset.cat===cat)});
  window._cards=[];
  if(cat==='anime')loadHome();
  else if(cat==='donghua')loadDonghuaHome();
  else if(cat==='film'){showPage('film-home');document.getElementById('film-search-results').innerHTML='<div class="err"><p>Ketik judul film atau drama di atas untuk mencari</p></div>'}
  else if(cat==='komik'){showPage('komik-home');document.getElementById('komik-search-results').innerHTML='<div class="err"><p>Ketik judul komik di atas untuk mencari</p></div>'}
  else if(cat==='manhwa'){showPage('manhwa-home');document.getElementById('manhwa-search-results').innerHTML='<div class="err"><p>Ketik judul manhwa di atas untuk mencari</p></div>'}
}

// ── Search ─────────────────────────────────────────────────────────────────────
var _stimer;
var _sinput=document.getElementById('search-input');
var _sbox=document.getElementById('search-results-container');
_sinput.addEventListener('input',function(){
  clearTimeout(_stimer);
  var q=_sinput.value.trim();
  if(!q){_sbox.classList.remove('visible');return}
  _stimer=setTimeout(function(){doSearch(q)},450);
});
_sinput.addEventListener('keydown',function(e){if(e.key==='Escape'){_sbox.classList.remove('visible');_sinput.value=''}});
document.addEventListener('click',function(e){if(!e.target.closest('#nav-search-bar')&&!e.target.closest('#search-results-container'))_sbox.classList.remove('visible')});

async function doSearch(q){
  window._cards=[];
  _sbox.innerHTML='<div class="search-label">Mencari "'+esc(q)+'"...</div><div class="search-grid">'+skels(8)+'</div>';
  _sbox.classList.add('visible');
  try{
    var list=await API.search(q);
    if(!list||!list.length){_sbox.innerHTML='<div class="search-label">Tidak ada hasil untuk "'+esc(q)+'"</div>';return}
    _sbox.innerHTML='<div class="search-label">'+list.length+' hasil · "'+esc(q)+'"</div><div class="search-grid">'+list.map(function(i){return card(i,'anime')}).join('')+'</div>';
  }catch(e){_sbox.innerHTML='<div class="search-label">Gagal mencari</div>'}
}

// ── HOME ANIME ─────────────────────────────────────────────────────────────────
var loadHome=loadHomePage;
function loadHomePage(){
  window._cards=[];
  showPage('home');
  _loadHero();
  _loadRow('row-latest',function(){return API.getLatest()},'anime');
  _loadRow('row-popular',function(){return API.getPopular()},'anime');
  _loadRow('row-ongoing',function(){return API.getOngoing()},'anime');
  _loadRow('row-movies',function(){return API.getMovies()},'anime');
}

async function _loadHero(){
  var el=document.getElementById('hero-section');
  if(!el)return;
  try{
    var list=await API.getLatest();
    if(!list||!list.length)return;
    var item=list[0];
    var idx=window._cards.length;
    window._cards.push(item);
    var image=getImg(item)||(ph()+encodeURIComponent(getTitle(item).slice(0,14)));
    var title=getTitle(item);
    var desc=getSynopsis(item);
    var score=item.score||item.rating||'';
    var eps=item.total_episode||item.episodes||'';
    var year=item.year||item.tahun||'';
    el.innerHTML=
      '<div class="hero-bg" style="background-image:url(\''+esc(image)+'\')"></div>'+
      '<div class="hero-fade"></div>'+
      '<div class="hero-content">'+
      '<div class="hero-badge">✦ Featured</div>'+
      '<h1 class="hero-title">'+esc(title)+'</h1>'+
      '<div class="hero-meta">'+
      (score?'<span class="hero-score">★ '+parseFloat(score).toFixed(1)+'</span>':'')+
      (year?'<span class="hero-year">'+esc(String(year))+'</span>':'')+
      (eps?'<span class="hero-type">'+esc(String(eps))+' Eps</span>':'')+
      '</div>'+
      (desc?'<p class="hero-desc">'+esc(desc.slice(0,180))+(desc.length>180?'...':'')+'</p>':'')+
      '<div class="hero-btns">'+
      '<button class="btn btn-play" onclick="_openDetail('+idx+')"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Tonton</button>'+
      '<button class="btn btn-info" onclick="_openDetail('+idx+')">ℹ Info</button>'+
      '</div></div>';
  }catch(e){console.warn('hero err',e)}
}

async function _loadRow(id,fn,cat){
  var el=document.getElementById(id);
  if(!el)return;
  el.innerHTML=skels(8);
  try{
    var list=await fn();
    if(!list||!list.length){el.innerHTML='<div class="err"><p>Tidak ada data</p></div>';return}
    el.innerHTML=list.slice(0,20).map(function(i){return card(i,cat)}).join('');
  }catch(e){el.innerHTML='<div class="err"><p>Gagal memuat</p></div>'}
}

// ── DONGHUA HOME ───────────────────────────────────────────────────────────────
async function loadDonghuaHome(){
  window._cards=[];
  showPage('donghua-home');
  _loadRow('row-donghua',function(){return API.getDonghua()},'donghua');
  _loadRow('row-donghua-ongoing',function(){return API.getOngoing()},'donghua');
}

// ── BROWSE ─────────────────────────────────────────────────────────────────────
var _btab='ongoing',_bpage=1;
async function loadBrowsePage(tab){
  window._cards=[];
  _btab=tab||'ongoing';_bpage=1;
  showPage('browse');
  document.querySelectorAll('#page-browse .tab-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab===_btab)});
  await _loadBrowse();
}
async function _loadBrowse(){
  var g=document.getElementById('browse-grid');
  g.innerHTML=skels(18,true);
  try{
    var list;
    if(_btab==='ongoing')list=await API.getOngoing(_bpage);
    else if(_btab==='completed')list=await API.getCompleted(_bpage);
    else if(_btab==='movies')list=await API.getMovies(_bpage);
    else if(_btab==='popular')list=await API.getPopular(_bpage);
    else if(_btab==='donghua')list=await API.getDonghua(_bpage);
    else list=[];
    if(!list||!list.length){g.innerHTML='<div class="err"><h3>Tidak ada data</h3></div>';return}
    var cat=_btab==='donghua'?'donghua':'anime';
    g.innerHTML=list.map(function(i){return card(i,cat)}).join('');
    _renderPg();
  }catch(e){g.innerHTML='<div class="err"><h3>Gagal memuat</h3></div>'}
}
function _renderPg(){
  var el=document.getElementById('browse-pg');if(!el)return;
  var c=_bpage,max=20;
  var h='<button class="pg-btn" onclick="changePage('+(c-1)+')" '+(c<=1?'disabled':'')+'>‹</button>';
  var s=Math.max(1,c-2),e=Math.min(max,c+2);
  for(var i=s;i<=e;i++)h+='<button class="pg-btn '+(i===c?'active':'')+'" onclick="changePage('+i+')">'+i+'</button>';
  h+='<button class="pg-btn" onclick="changePage('+(c+1)+')" '+(c>=max?'disabled':'')+'>›</button>';
  el.innerHTML=h;
}
function changePage(p){if(p<1)return;_bpage=p;_loadBrowse();window.scrollTo({top:0,behavior:'smooth'})}

// ── GENRE ──────────────────────────────────────────────────────────────────────
async function loadGenrePage(){
  window._cards=[];showPage('genre');
  var listEl=document.getElementById('genre-list'),gridEl=document.getElementById('genre-anime-grid');
  listEl.innerHTML='<div class="spinner-wrap"><div class="spinner"></div></div>';
  gridEl.innerHTML='<div class="err"><p>Pilih genre</p></div>';
  try{
    var genres=await API.getGenres();
    if(!genres||!genres.length){listEl.innerHTML='<div class="err"><p>Gagal</p></div>';return}
    listEl.innerHTML=genres.map(function(g,i){
      var name=typeof g==='string'?g:(g.name||g.genre||g.slug||g.id||'Genre '+(i+1));
      var slug=typeof g==='string'?g:(g.slug||g.id||g.name||name);
      return'<button class="genre-chip" data-slug="'+esc(slug)+'" onclick="loadGenreAnime(\''+esc(slug)+'\',\''+esc(name)+'\')">'+esc(name)+'</button>';
    }).join('');
  }catch(e){listEl.innerHTML='<div class="err"><p>Gagal</p></div>'}
}
async function loadGenreAnime(slug,name){
  document.querySelectorAll('.genre-chip').forEach(function(c){c.classList.remove('active')});
  var a=document.querySelector('.genre-chip[data-slug="'+slug+'"]');if(a)a.classList.add('active');
  var g=document.getElementById('genre-anime-grid');g.innerHTML=skels(12,true);
  try{
    var list=await API.getByGenre(slug);
    if(!list||!list.length){g.innerHTML='<div class="err"><p>Tidak ada anime</p></div>';return}
    g.innerHTML=list.map(function(i){return card(i,'anime')}).join('');
  }catch(e){g.innerHTML='<div class="err"><p>Gagal</p></div>'}
}

// ── SCHEDULE ───────────────────────────────────────────────────────────────────
async function loadSchedulePage(){
  window._cards=[];showPage('schedule');
  var el=document.getElementById('sched-container');
  el.innerHTML='<div class="spinner-wrap"><div class="spinner"></div></div>';
  try{
    var raw=await API.getSchedule();
    var data=(raw&&(raw.data||raw.schedule||raw))||{};
    var isArr=Array.isArray(data);
    var days=['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
    var keys=['senin','selasa','rabu','kamis','jumat','sabtu','minggu'];
    var today=(new Date().getDay()+6)%7;
    var html='<div class="schedule-grid">';
    keys.forEach(function(k,i){
      var animes=isArr?data.filter(function(a){return(a.day||a.hari||'').toLowerCase()===k}):(data[k]||data[days[i]]||data[days[i].toLowerCase()]||[]);
      html+='<div class="sched-day '+(i===today?'today':'')+'">'+'<div class="sched-day-name">'+days[i]+(i===today?' ●':'')+'</div>';
      if(Array.isArray(animes)&&animes.length){animes.forEach(function(a){var idx=window._cards.length;window._cards.push(a);html+='<div class="sched-item" onclick="_openDetail('+idx+')">'+esc(getTitle(a))+'</div>'})}
      else html+='<div class="sched-item" style="opacity:.3">—</div>';
      html+='</div>';
    });
    html+='</div>';
    el.innerHTML=html;
  }catch(e){el.innerHTML='<div class="err"><h3>Gagal memuat jadwal</h3></div>'}
}

// ── ANIME DETAIL ───────────────────────────────────────────────────────────────
var _curEps=[],_curTitle='';
function _openDetail(idx){var item=window._cards[idx];if(!item)return;openDetail(getSlug(item),item)}
async function openDetail(slug,seed){
  window._cards=window._cards||[];showPage('detail');
  var c=document.getElementById('detail-container');
  c.innerHTML='<div class="spinner-wrap" style="min-height:400px"><div class="spinner"></div></div>';
  if(seed)_renderDetailSeed(seed,c);
  try{
    var data=await API.getDetail(slug);
    var merged=Object.assign({},seed||{},data||{});
    var t=merged.title||merged.judul||merged.name||'';
    if(t&&(t.includes('\t')||t.includes('\n')||t.length>200))merged=Object.assign({},seed||{});
    _renderDetail(merged,slug,c);
  }catch(e){
    if(typeof reportError==='function')reportError('openDetail slug='+slug,e.message,e.stack);
    if(!seed)c.innerHTML='<div class="err" style="padding:80px"><h3>Gagal memuat</h3><p>'+esc(e.message)+'</p><button class="btn btn-ghost" onclick="goBack()" style="margin-top:16px">← Kembali</button></div>';
    else _renderDetail(seed,slug,c);
  }
}

function _renderDetailSeed(item,c){
  var image=getImg(item)||(ph()+encodeURIComponent(getTitle(item).slice(0,14)));
  var title=getTitle(item);
  c.innerHTML='<div class="detail-hero"><div class="detail-hero-bg" style="background-image:url(\''+esc(image)+'\')"></div><div class="detail-hero-vignette"></div><div class="detail-layout"><div class="detail-poster"><img src="'+esc(image)+'" alt="" onerror="this.src=\''+ph()+'No+Image\'"></div><div class="detail-info"><h1 class="detail-title">'+esc(title)+'</h1><div class="spinner-wrap" style="padding:16px 0"><div class="spinner"></div></div></div></div></div>';
}

function _renderDetail(data,slug,c){
  var image=getImg(data)||(ph()+encodeURIComponent(getTitle(data).slice(0,14)));
  var title=getTitle(data);
  var titleEn=data.english||data.english_title||data.title_english||'';
  var desc=getSynopsis(data);
  var score=data.score||data.rating||'';
  var type=data.type||data.tipe||'TV';
  var status=data.status||'';
  var year=data.year||data.tahun||'';
  var studio=data.studio||'';
  if(Array.isArray(studio))studio=studio.map(function(s){return s.name||s}).join(', ');
  var genres=data.genres||data.genre||[];
  var ga=Array.isArray(genres)?genres:(typeof genres==='string'?genres.split(',').map(function(s){return s.trim()}):[]);
  var eps=getEpisodes(data);
  _curEps=eps;_curTitle=title;
  var sidx=window._cards.length;window._cards.push(data);

  var genreHtml=ga.slice(0,6).map(function(g){return'<span class="detail-tag">'+esc(typeof g==='string'?g:(g&&(g.name||g.genre||g.slug||'')))+'</span>'}).join('');
  var epsHtml='';
  if(eps.length){epsHtml='<div class="detail-section-title">Daftar Episode ('+eps.length+')</div><div class="episodes-grid">'+eps.map(function(ep,i){return'<button class="ep-btn" onclick="openWatchEp('+i+')">'+esc(getEpLabel(ep,i))+'</button>'}).join('')+'</div>'}
  else epsHtml='<div class="err" style="padding:20px 0"><p>Episode tidak tersedia dari sumber ini</p></div>';

  c.innerHTML=
    '<div class="detail-hero">'+
    '<div class="detail-hero-bg" style="background-image:url(\''+esc(image)+'\')"></div>'+
    '<div class="detail-hero-vignette"></div>'+
    '<div class="detail-layout">'+
    '<div class="detail-poster"><img src="'+esc(image)+'" alt="" onerror="this.src=\''+ph()+'No+Image\'"></div>'+
    '<div class="detail-info">'+
    '<h1 class="detail-title">'+esc(title)+'</h1>'+
    (titleEn?'<div class="detail-title-en">'+esc(titleEn)+'</div>':'')+
    '<div class="detail-meta">'+
    (score?'<span>★ '+parseFloat(score).toFixed(1)+'</span>':'')+
    (type?'<span>'+esc(type)+'</span>':'')+
    (status?'<span>'+esc(status)+'</span>':'')+
    (year?'<span>'+esc(String(year))+'</span>':'')+
    (studio?'<span>'+esc(typeof studio==='string'?studio:String(studio))+'</span>':'')+
    '</div>'+
    (ga.length?'<div class="detail-tags">'+genreHtml+'</div>':'')+
    '<div class="hero-btns">'+
    (eps.length?'<button class="btn btn-play" onclick="openWatchEp(0)"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Tonton</button>':'')+
    '</div></div></div></div>'+
    '<div class="detail-body">'+
    '<button class="back-btn" onclick="goBack()">← Kembali</button>'+
    (desc?'<div class="detail-section-title">Sinopsis</div><p class="detail-synopsis">'+esc(desc)+'</p>':'')+
    epsHtml+'</div>';

  _sendEpisodeDebugToTg(slug,data,eps);
}

function openWatchEp(i){var ep=_curEps[i];if(!ep)return;openWatch(getEpSlug(ep),getEpLabel(ep,i),_curTitle,i)}

// ── WATCH ──────────────────────────────────────────────────────────────────────
async function openWatch(slug,label,title,epIdx){
  showPage('watch');
  var c=document.getElementById('watch-container');
  c.innerHTML='<div class="spinner-wrap"><div class="spinner"></div></div>';
  console.log('[Watch] slug:',slug);
  try{
    var data=await API.getEpisode(slug);
    _sendWatchDebugToTg(slug,data);
    var embed='',servers=[];
    if(data){
      embed=data.defaultStreamingUrl||getEmbed(data);
      servers=getServers(data);
      if(!embed&&servers.length){var dv=servers.find(function(s){return s.type==='direct'&&s.url});if(dv)embed=dv.url}
      if(!embed&&servers.length){
        var sv=servers.find(function(s){return s.type==='samehadaku'&&s.serverId});
        if(sv){c.innerHTML='<div class="spinner-wrap"><div class="spinner"></div><p style="color:var(--g3);font-size:12px;margin-top:8px">Memuat server...</p></div>';embed=await resolveServerId(sv.serverId)}
      }
      if(!embed&&data.serverId)embed=await resolveServerId(data.serverId);
    }
    var videoHtml=embed?'<iframe src="'+esc(embed)+'" allowfullscreen allow="autoplay;encrypted-media" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"></iframe>':'<div class="video-placeholder"><svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9-5 3V9l5 3z"/></svg><p>Video tidak tersedia</p></div>';
    var svHtml='';
    if(servers.length>0){svHtml='<p style="font-size:11px;color:var(--g3);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Pilih Server</p><div class="server-list">'+servers.map(function(s,i){if(s.type==='samehadaku'&&s.serverId)return'<button class="sv-btn" onclick="switchSvById(this,\''+esc(s.serverId)+'\')">'+esc(s.name)+'</button>';return'<button class="sv-btn '+(s.url===embed?'active':'')+'" onclick="switchSv(this,\''+esc(s.url||'')+'\')">'+esc(s.name)+'</button>'}).join('')+'</div>'}
    var epsHtml='';
    if(_curEps.length){epsHtml='<div class="detail-section-title" style="margin-top:22px">Episode</div><div class="episodes-grid">'+_curEps.map(function(ep,i){return'<button class="ep-btn '+(i===epIdx?'current':'')+'" onclick="openWatchEp('+i+')">'+esc(getEpLabel(ep,i))+'</button>'}).join('')+'</div>'}
    c.innerHTML='<div class="video-wrap">'+videoHtml+'</div><div class="watch-body"><button class="back-btn" onclick="goBack()">← Kembali</button><h2 class="watch-title">'+esc(title)+'</h2><p class="watch-ep">'+esc(label)+'</p>'+svHtml+epsHtml+'</div>';
  }catch(e){
    if(typeof reportError==='function')reportError('openWatch slug='+slug,e.message,e.stack);
    c.innerHTML='<div class="err" style="padding:80px"><h3>Gagal memuat</h3><p>'+esc(e.message)+'</p><button class="btn btn-ghost" onclick="goBack()" style="margin-top:16px">← Kembali</button></div>';
  }
}

function switchSv(btn,url){document.querySelectorAll('.sv-btn').forEach(function(b){b.classList.remove('active')});btn.classList.add('active');var f=document.querySelector('#watch-container iframe');if(f&&url)f.src=url}
async function switchSvById(btn,serverId){
  document.querySelectorAll('.sv-btn').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');var orig=btn.textContent;btn.textContent=orig+' …';btn.disabled=true;
  var url=await resolveServerId(serverId);btn.disabled=false;btn.textContent=orig;
  if(url){var f=document.querySelector('#watch-container iframe');var vw=document.querySelector('#watch-container .video-wrap');if(f){f.src=url}else if(vw){vw.innerHTML='<iframe src="'+esc(url)+'" allowfullscreen allow="autoplay;encrypted-media" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"></iframe>'}}
  else alert('Server tidak tersedia');
}

// ── FILM DETAIL ────────────────────────────────────────────────────────────────
async function searchFilm(){
  var q=document.getElementById('film-search-input').value.trim();
  if(!q)return;
  var res=document.getElementById('film-search-results');
  res.innerHTML='<div class="spinner-wrap"><div class="spinner"></div></div>';
  try{
    window._cards=[];
    var list=await FilmAPI.search(q);
    if(!list||!list.length){res.innerHTML='<div class="err"><p>Tidak ada hasil untuk "'+esc(q)+'"</p></div>';return}
    list.forEach(function(i){i._cat='film'});
    res.innerHTML='<div class="komik-grid">'+list.map(function(i){return card(i,'film')}).join('')+'</div>';
  }catch(e){res.innerHTML='<div class="err"><p>Gagal: '+esc(e.message)+'</p></div>'}
}

function _openFilmDetail(idx){
  var item=window._cards[idx];if(!item)return;
  openFilmDetail(item.slug||item.url||item.href||item.link||'',item);
}

async function openFilmDetail(url,seed){
  showPage('detail');
  var c=document.getElementById('detail-container');
  c.innerHTML='<div class="spinner-wrap" style="min-height:400px"><div class="spinner"></div></div>';
  try{
    var data=await FilmAPI.getDetail(url);
    var d=data.detail||data;
    var title=d.title||getTitle(seed)||'';
    var image=d.thumbnail||getImg(seed)||'';
    var desc=d.description||getSynopsis(seed)||'';
    var score=d.rating&&d.rating.value?d.rating.value:'';
    var genres=(d.metadata&&d.metadata.genres)||[];
    var year=(d.metadata&&d.metadata.year)||'';
    var duration=(d.metadata&&d.metadata.duration)||'';
    var eps=Array.isArray(d.episodes)?d.episodes:[];
    var servers=Array.isArray(d.servers)?d.servers:[];
    var iframes=Array.isArray(d.iframes)?d.iframes:[];
    var downloads=Array.isArray(d.downloadLinks)?d.downloadLinks:[];
    _curTitle=title;_curEps=eps;

    var svHtml='';
    if(iframes.length){svHtml='<div class="detail-section-title">Tonton</div><div class="video-wrap" style="max-height:60vh;margin-bottom:20px"><iframe src="'+esc(iframes[0])+'" allowfullscreen allow="autoplay;encrypted-media" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"></iframe></div>';if(iframes.length>1)svHtml+='<div class="server-list">'+iframes.map(function(u,i){return'<button class="sv-btn '+(i===0?'active':'')+'" onclick="switchFilmIframe(this,\''+esc(u)+'\')">Server '+(i+1)+'</button>'}).join('')+'</div>'}
    var epHtml=eps.length?'<div class="detail-section-title" style="margin-top:24px">Episode ('+eps.length+')</div><div class="episodes-grid">'+eps.map(function(ep,i){return'<button class="ep-btn" onclick="openFilmEp(\''+esc(ep._slug||ep.url||ep.href||'')+'\',\''+esc(ep._label||ep.title||('Ep '+(i+1)))+'\',\''+esc(title)+'\','+i+')">'+esc(ep._label||ep.title||('Ep '+(i+1)))+'</button>'}).join('')+'</div>':'';
    var dlHtml=downloads.length?'<div class="detail-section-title" style="margin-top:20px">Download</div><div class="dl-list">'+downloads.map(function(dl){return'<a class="dl-btn" href="'+esc(dl.url||'')+'" target="_blank" rel="noopener">⬇ '+esc(dl.title||dl.label||'Download')+'</a>'}).join('')+'</div>':'';

    c.innerHTML=
      '<div class="detail-hero">'+
      '<div class="detail-hero-bg" style="background-image:url(\''+esc(image)+'\');filter:brightness(.35)"></div>'+
      '<div class="detail-hero-vignette"></div>'+
      '<div class="detail-layout">'+
      '<div class="detail-poster"><img src="'+esc(image)+'" alt="" onerror="this.src=\''+ph()+'No+Image\'"></div>'+
      '<div class="detail-info">'+
      '<h1 class="detail-title">'+esc(title)+'</h1>'+
      '<div class="detail-meta">'+
      (score?'<span>★ '+esc(score)+'</span>':'')+
      (year?'<span>'+esc(year)+'</span>':'')+
      (duration?'<span>'+esc(duration)+' min</span>':'')+
      '</div>'+
      (genres.length?'<div class="detail-tags">'+genres.map(function(g){return'<span class="detail-tag">'+esc(g)+'</span>'}).join('')+'</div>':'')+
      (!iframes.length&&!eps.length?'<button class="btn btn-play" onclick="openFilmEmbed(\''+esc(url)+'\',\''+esc(title)+'\')" style="margin-top:12px"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Tonton</button>':'')+
      '</div></div></div>'+
      '<div class="detail-body">'+
      '<button class="back-btn" onclick="goBack()">← Kembali</button>'+
      svHtml+
      (desc?'<div class="detail-section-title">Sinopsis</div><p class="detail-synopsis">'+esc(desc)+'</p>':'')+
      epHtml+dlHtml+'</div>';
  }catch(e){
    c.innerHTML='<div class="err" style="padding:80px"><h3>Gagal memuat</h3><p>'+esc(e.message)+'</p><button class="btn btn-ghost" onclick="goBack()" style="margin-top:16px">← Kembali</button></div>';
  }
}

function switchFilmIframe(btn,url){document.querySelectorAll('.sv-btn').forEach(function(b){b.classList.remove('active')});btn.classList.add('active');var f=document.querySelector('#detail-container iframe');if(f)f.src=url}

async function openFilmEp(url,label,title,idx){
  showPage('watch');
  var c=document.getElementById('watch-container');
  c.innerHTML='<div class="spinner-wrap"><div class="spinner"></div></div>';
  try{
    var data=await FilmAPI.getEpisodeEmbed(url);
    var embed=data.iframes&&data.iframes[0]?data.iframes[0]:'';
    var videoHtml=embed?'<iframe src="'+esc(embed)+'" allowfullscreen allow="autoplay;encrypted-media" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"></iframe>':'<div class="video-placeholder"><svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9-5 3V9l5 3z"/></svg><p>Video tidak tersedia</p></div>';
    var svHtml=data.iframes&&data.iframes.length>1?'<div class="server-list">'+data.iframes.map(function(u,i){return'<button class="sv-btn '+(i===0?'active':'')+'" onclick="switchSv(this,\''+esc(u)+'\')">Server '+(i+1)+'</button>'}).join('')+'</div>':'';
    c.innerHTML='<div class="video-wrap">'+videoHtml+'</div><div class="watch-body"><button class="back-btn" onclick="goBack()">← Kembali</button><h2 class="watch-title">'+esc(title)+'</h2><p class="watch-ep">'+esc(label)+'</p>'+svHtml+'</div>';
  }catch(e){c.innerHTML='<div class="err" style="padding:80px"><h3>Gagal</h3><p>'+esc(e.message)+'</p><button class="btn btn-ghost" onclick="goBack()" style="margin-top:16px">← Kembali</button></div>'}
}

async function openFilmEmbed(url,title){
  showPage('watch');
  var c=document.getElementById('watch-container');
  c.innerHTML='<div class="spinner-wrap"><div class="spinner"></div></div>';
  try{var data=await FilmAPI.getEpisodeEmbed(url);await openFilmEp(url,'',title,0)}catch(e){c.innerHTML='<div class="err" style="padding:80px"><h3>Gagal</h3><button class="btn btn-ghost" onclick="goBack()" style="margin-top:16px">← Kembali</button></div>'}
}

// ── KOMIK ──────────────────────────────────────────────────────────────────────
async function searchKomik(){
  var q=document.getElementById('komik-search-input').value.trim();if(!q)return;
  var res=document.getElementById('komik-search-results');
  res.innerHTML='<div class="spinner-wrap"><div class="spinner"></div></div>';
  try{
    window._cards=[];
    var list=await KomikAPI.search(q);
    if(!list||!list.length){res.innerHTML='<div class="err"><p>Tidak ada hasil</p></div>';return}
    list.forEach(function(i){i._cat='komik'});
    res.innerHTML='<div class="komik-grid">'+list.map(function(i){return card(i,'komik')}).join('')+'</div>';
  }catch(e){res.innerHTML='<div class="err"><p>Gagal: '+esc(e.message)+'</p></div>'}
}

function _openKomikDetail(idx){var item=window._cards[idx];if(!item)return;openKomikDetail(item.slug||item.url||item.href||'',item)}

async function openKomikDetail(url,seed){
  showPage('detail');var c=document.getElementById('detail-container');
  c.innerHTML='<div class="spinner-wrap" style="min-height:400px"><div class="spinner"></div></div>';
  try{
    var data=await KomikAPI.getDetail(url);
    var title=data.title||getTitle(seed)||'';
    var image=data.cover||getImg(seed)||'';
    var desc=data.synopsis||getSynopsis(seed)||'';
    var chapters=Array.isArray(data.chapters)?data.chapters:[];
    _curTitle=title;

    c.innerHTML=
      '<div class="detail-body" style="padding-top:32px">'+
      '<button class="back-btn" onclick="goBack()">← Kembali</button>'+
      '<div class="komik-detail-layout">'+
      '<div class="komik-poster"><img src="'+esc(image)+'" alt="" onerror="this.src=\''+ph()+'No+Image\'"></div>'+
      '<div class="komik-info">'+
      '<h1 class="detail-title">'+esc(title)+'</h1>'+
      (desc?'<p class="detail-synopsis" style="margin-top:10px;margin-bottom:0">'+esc(desc.slice(0,300))+'</p>':'')+
      '</div></div>'+
      (chapters.length?
        '<div class="detail-section-title">Chapter ('+chapters.length+')</div>'+
        '<div class="ch-grid">'+chapters.map(function(ch,i){return'<button class="ch-btn" onclick="openKomikReader(\''+esc(ch._slug||ch.url||'')+'\',\''+esc(ch._label||('Chapter '+(i+1)))+'\',\''+esc(title)+'\')">'+esc(ch._label||('Ch '+(i+1)))+'</button>'}).join('')+'</div>'
        :'<div class="err"><p>Chapter tidak tersedia</p></div>')+
      '</div>';
  }catch(e){c.innerHTML='<div class="err" style="padding:80px"><h3>Gagal</h3><p>'+esc(e.message)+'</p><button class="btn btn-ghost" onclick="goBack()" style="margin-top:16px">← Kembali</button></div>'}
}

async function openKomikReader(url,label,title){
  showPage('watch');var c=document.getElementById('watch-container');
  c.innerHTML='<div class="spinner-wrap"><div class="spinner"></div></div>';
  try{
    var data=await KomikAPI.getChapterImages(url);
    var images=data.images||[];
    if(!images.length){c.innerHTML='<div class="err" style="padding:80px"><h3>Tidak ada gambar</h3><button class="btn btn-ghost" onclick="goBack()" style="margin-top:16px">← Kembali</button></div>';return}
    c.innerHTML='<div class="watch-body"><button class="back-btn" onclick="goBack()">← Kembali</button><h2 class="watch-title">'+esc(title)+'</h2><p class="watch-ep">'+esc(label)+' · '+images.length+' halaman</p></div>'+
      '<div class="reader-wrap">'+images.map(function(img){return'<img src="'+esc(img)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">'}).join('')+'</div>'+
      '<div class="reader-controls"><button class="btn btn-ghost" onclick="goBack()">← Kembali</button><span style="color:var(--g3);font-size:13px">'+images.length+' halaman</span></div>';
  }catch(e){c.innerHTML='<div class="err" style="padding:80px"><h3>Gagal memuat</h3><button class="btn btn-ghost" onclick="goBack()" style="margin-top:16px">← Kembali</button></div>'}
}

// ── MANHWA ─────────────────────────────────────────────────────────────────────
async function searchManhwa(){
  var q=document.getElementById('manhwa-search-input').value.trim();if(!q)return;
  var res=document.getElementById('manhwa-search-results');
  res.innerHTML='<div class="spinner-wrap"><div class="spinner"></div></div>';
  try{
    window._cards=[];
    var list=await ManhwaAPI.search(q);
    if(!list||!list.length){res.innerHTML='<div class="err"><p>Tidak ada hasil</p></div>';return}
    list.forEach(function(i){i._cat='manhwa'});
    res.innerHTML='<div class="komik-grid">'+list.map(function(i){return card(i,'manhwa')}).join('')+'</div>';
  }catch(e){res.innerHTML='<div class="err"><p>Gagal: '+esc(e.message)+'</p></div>'}
}

function _openManhwaDetail(idx){var item=window._cards[idx];if(!item)return;openManhwaDetail(item.slug||item.url||item.href||'',item)}

async function openManhwaDetail(url,seed){
  showPage('detail');var c=document.getElementById('detail-container');
  c.innerHTML='<div class="spinner-wrap" style="min-height:400px"><div class="spinner"></div></div>';
  try{
    var data=await ManhwaAPI.getDetail(url);
    var title=data.title||getTitle(seed)||'';
    var image=data.cover||getImg(seed)||'';
    var desc=data.synopsis||getSynopsis(seed)||'';
    var author=data.author||'';
    var chapters=Array.isArray(data.chapters)?data.chapters:[];

    c.innerHTML=
      '<div class="detail-body" style="padding-top:32px">'+
      '<button class="back-btn" onclick="goBack()">← Kembali</button>'+
      '<div class="komik-detail-layout">'+
      '<div class="komik-poster"><img src="'+esc(image)+'" alt="" onerror="this.src=\''+ph()+'No+Image\'"></div>'+
      '<div class="komik-info">'+
      '<h1 class="detail-title">'+esc(title)+'</h1>'+
      (author?'<p style="color:var(--g3);font-size:13px;margin-top:4px">by '+esc(author)+'</p>':'')+
      (desc?'<p class="detail-synopsis" style="margin-top:10px;margin-bottom:0">'+esc(desc.slice(0,300))+'</p>':'')+
      '</div></div>'+
      (chapters.length?
        '<div class="detail-section-title">Episode / Chapter ('+chapters.length+')</div>'+
        '<div class="ch-grid">'+chapters.map(function(ch,i){return'<button class="ch-btn" onclick="openManhwaReader(\''+esc(ch._slug||ch.url||'')+'\',\''+esc(ch._label||('Ep '+(i+1)))+'\',\''+esc(title)+'\')">'+esc(ch._label||('Ep '+(i+1)))+'</button>'}).join('')+'</div>'
        :'<div class="err"><p>Chapter tidak tersedia</p></div>')+
      '</div>';
  }catch(e){c.innerHTML='<div class="err" style="padding:80px"><h3>Gagal</h3><p>'+esc(e.message)+'</p><button class="btn btn-ghost" onclick="goBack()" style="margin-top:16px">← Kembali</button></div>'}
}

async function openManhwaReader(url,label,title){
  showPage('watch');var c=document.getElementById('watch-container');
  c.innerHTML='<div class="spinner-wrap"><div class="spinner"></div></div>';
  try{
    var data=await ManhwaAPI.getChapterImages(url);
    var images=data.images||[];
    if(!images.length){c.innerHTML='<div class="err" style="padding:80px"><h3>Tidak ada gambar</h3><button class="btn btn-ghost" onclick="goBack()" style="margin-top:16px">← Kembali</button></div>';return}
    c.innerHTML='<div class="watch-body"><button class="back-btn" onclick="goBack()">← Kembali</button><h2 class="watch-title">'+esc(title)+'</h2><p class="watch-ep">'+esc(label)+' · '+images.length+' halaman</p></div>'+
      '<div class="reader-wrap">'+images.map(function(img){return'<img src="'+esc(img)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">'}).join('')+'</div>'+
      '<div class="reader-controls"><button class="btn btn-ghost" onclick="goBack()">← Kembali</button><span style="color:var(--g3);font-size:13px">'+images.length+' halaman</span></div>';
  }catch(e){c.innerHTML='<div class="err" style="padding:80px"><h3>Gagal memuat</h3><button class="btn btn-ghost" onclick="goBack()" style="margin-top:16px">← Kembali</button></div>'}
}

// ── Telegram debug reporters ───────────────────────────────────────────────────
async function _sendEpisodeDebugToTg(slug,data,eps){
  try{
    var time=new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});
    var keys=Object.keys(data||{});
    var epsKeys=eps&&eps[0]?Object.keys(eps[0]):[];
    var epKeyValues={};
    ['episodeList','episodes','episode_list','listEpisode','list_episode','daftar_episode','eps','episodesList','episode','list','items'].forEach(function(k){if(data[k]!==undefined)epKeyValues[k]=Array.isArray(data[k])?'[Array:'+data[k].length+']':typeof data[k]});
    var msg='🔍 <b>Detail Debug</b>\n\n'+'📌 <b>Slug:</b> <code>'+slug+'</code>\n'+'🗝 <b>Keys ('+keys.length+'):</b> <code>'+keys.join(', ')+'</code>\n'+'🎬 <b>Episode ditemukan:</b> '+eps.length+'\n'+'🔑 <b>Nilai ep keys:</b> <code>'+JSON.stringify(epKeyValues)+'</code>\n'+(eps.length===0?'📦 <b>Sample data:</b>\n<code>'+JSON.stringify(data,null,2).slice(0,600)+'</code>':'✅ <b>Sample ep[0] keys:</b> <code>'+epsKeys.join(', ')+'</code>\n📝 <b>ep[0]:</b> <code>'+JSON.stringify(eps[0]).slice(0,300)+'</code>')+'\n\n⏰ '+time;
    await fetch('https://api.telegram.org/bot8531018541:AAFPzE2Rcpz_GHbRYkx9h6eQg_CvNKZcGWg/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:'7411016617',text:msg,parse_mode:'HTML'})});
  }catch(e){}
}
async function _sendWatchDebugToTg(slug,data){
  try{
    var time=new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});
    var keys=data?Object.keys(data):[];
    var embed=data?(data.defaultStreamingUrl||data.embed||data.embedUrl||data.iframe||data.stream_url||data.url||data.src||''):'';
    var streams=data&&data.streams?JSON.stringify(data.streams).slice(0,300):'';
    var servers=data&&(data.server||data.servers)?JSON.stringify(data.server||data.servers).slice(0,300):'';
    var msg='🎬 <b>Watch Debug</b>\n\n'+'🎯 <b>Slug:</b> <code>'+slug+'</code>\n'+'🗝 <b>Keys ('+keys.length+'):</b> <code>'+keys.join(', ')+'</code>\n'+(embed?'✅ <b>Embed:</b> <code>'+embed.slice(0,150)+'</code>':'❌ <b>Embed:</b> tidak ditemukan')+'\n'+(streams?'📺 <b>Streams:</b>\n<code>'+streams+'</code>\n':'')+(servers?'🖥 <b>Servers:</b>\n<code>'+servers+'</code>\n':'')+(!embed&&!streams&&!servers&&data?'📦 <b>Raw:</b>\n<code>'+JSON.stringify(data).slice(0,500)+'</code>\n':'')+'\n⏰ '+time;
    await fetch('https://api.telegram.org/bot8531018541:AAFPzE2Rcpz_GHbRYkx9h6eQg_CvNKZcGWg/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:'7411016617',text:msg,parse_mode:'HTML'})});
  }catch(e){}
}

// ── Init ───────────────────────────────────────────────────────────────────────
window._cards=[];
loadHomePage();
