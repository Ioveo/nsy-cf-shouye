const DEFAULT_POSTER_BASE64 = "data:image/jpeg;base64,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";

/**
 * 天才猫音乐频道 · 白夜十五境 Cinema 引擎 (music.js)
 * 动态加载 /api/config/music-portal 与 /api/catalog
 * 支持真实音频播放、视频舞台交叉淡入淡出、实时频谱与多维度动态筛选
 */

// 预设默认 15 境视觉短片资源库 (由 Muse.ai 电影级视频短片提供)
const DEFAULT_VURL = {
  'aurora': 'https://muse.ai/files/1331075203424773/4652450651659595/n7ovqqi2larx76i5lpywaogj/aurora.mp4',
  'volcano': 'https://muse.ai/files/1331075203424773/1496429802541049/32ptj5b41589vx3gqksl88my/volcano.mp4',
  'storm': 'https://muse.ai/files/1331075203424773/1088652230742754/h6ly755g5wexjub0femjdphe/storm.mp4',
  'deepsea': 'https://muse.ai/files/1331075203424773/1846872469843698/ka99z5x3vs32micm76g3cg1y/deepsea.mp4',
  'mist': 'https://muse.ai/files/1331075203424773/1612634110411938/v879j4nzo4vdwyl14x76qato/mist.mp4',
  'sakura': 'https://muse.ai/files/1331075203424773/991808380633304/cu2y3j7cp38qgtmftmvj1l0p/sakura.mp4',
  'desert': 'https://muse.ai/files/1331075203424773/2138727663703231/k6g39iora7p6a5w8qzlzaj0k/desert.mp4',
  'alpine': 'https://muse.ai/files/1331075203424773/1419755236313998/5a2i0htxgurkatrscrjhmkwx/alpine.mp4',
  'falls': 'https://muse.ai/files/1331075203424773/955234357656073/e0qdyvew5atqd9r1kgeqndjc/falls.mp4',
  'cloudsea': 'https://muse.ai/files/1331075203424773/4033096033492611/kxyw991u5ma9zpmr4mryf34f/cloudsea.mp4',
  'dragon': 'https://muse.ai/files/1331075203424773/2009118896428863/tke42k321webkvmq91h16h5z/dragon.mp4',
  'void': 'https://muse.ai/files/1331075203424773/1432839098826596/g7flky81f7shf2cuktqqwaej/void.mp4',
  'luxe': 'https://muse.ai/files/1331075203424773/2089745241650351/sjfiq5m18bl0p0nrwf0wcfm4/luxe.mp4',
  'nebula': 'https://muse.ai/files/1331075203424773/1111954698096282/l0gspntqz6w0a5cvml3sxe7e/nebula.mp4',
  'noir': 'https://muse.ai/files/1331075203424773/1432998841610842/xq500iv9v5g5t769vpxqq7gw/noir.mp4'
};

const DEFAULT_TRACKS = [
  { v: 'noir', cn: '霓虹雨夜', en: 'Neon Rain', dur: '4:12', tag: 'SYNTHWAVE', c: '#57e6ff', bpm: 102, plays: '286万', trend: 'new', audioUrl: '' },
  { v: 'nebula', cn: '星云漫游', en: 'Nebula Drift', dur: '5:03', tag: 'AMBIENT', c: '#8a7cff', bpm: 90, plays: '254万', trend: 'up', audioUrl: '' },
  { v: 'aurora', cn: '极光幕', en: 'Aurora Veil', dur: '3:47', tag: 'DOWNTEMPO', c: '#4ade80', bpm: 88, plays: '198万', trend: 'up', audioUrl: '' },
  { v: 'volcano', cn: '熔岩之心', en: 'Magma Heart', dur: '4:31', tag: 'INDUSTRIAL', c: '#ff5c38', bpm: 128, plays: '176万', trend: 'down', audioUrl: '' },
  { v: 'storm', cn: '风暴潮', en: 'Storm Surge', dur: '5:18', tag: 'EPIC', c: '#5aa2ff', bpm: 140, plays: '152万', trend: 'up', audioUrl: '' },
  { v: 'deepsea', cn: '深渊', en: 'Abyssal', dur: '6:02', tag: 'DEEP AMBIENT', c: '#3d7bff', bpm: 70, plays: '141万', trend: 'same', audioUrl: '' },
  { v: 'mist', cn: '雾林', en: 'Mistwood', dur: '4:44', tag: 'FOLKTRONICA', c: '#9fd8b4', bpm: 98, plays: '128万', trend: 'new', audioUrl: '' },
  { v: 'sakura', cn: '樱落', en: 'Petal Fall', dur: '3:56', tag: 'LO-FI', c: '#ff8fb3', bpm: 84, plays: '117万', trend: 'down', audioUrl: '' },
  { v: 'desert', cn: '沙漠金辉', en: 'Dune Gold', dur: '4:20', tag: 'WORLD', c: '#f0a840', bpm: 110, plays: '103万', trend: 'up', audioUrl: '' },
  { v: 'alpine', cn: '寂静峰', en: 'Silent Peak', dur: '5:41', tag: 'CINEMATIC', c: '#bfe3ff', bpm: 100, plays: '96万', trend: 'down', audioUrl: '' },
  { v: 'falls', cn: '瀑布', en: 'Cascade', dur: '4:08', tag: 'LIQUID DNB', c: '#2dd4bf', bpm: 174, plays: '92万', trend: 'up', audioUrl: '' },
  { v: 'cloudsea', cn: '云海日出', en: 'Cloudsea Dawn', dur: '5:27', tag: 'UPLIFTING', c: '#ffc94d', bpm: 128, plays: '89万', trend: 'same', audioUrl: '' },
  { v: 'dragon', cn: '龙升', en: 'Dragon Rise', dur: '6:15', tag: 'ORCHESTRAL', c: '#3ddc84', bpm: 120, plays: '85万', trend: 'up', audioUrl: '' },
  { v: 'void', cn: '虚空粒子', en: 'Void Particles', dur: '4:50', tag: 'DARK TECHNO', c: '#a855f7', bpm: 132, plays: '81万', trend: 'down', audioUrl: '' },
  { v: 'luxe', cn: '奢华终章', en: 'Luxe Finale', dur: '5:09', tag: 'ART POP', c: '#e6c26e', bpm: 116, plays: '78万', trend: 'same', audioUrl: '' }
];

let ACC = '#57e6ff';
let ACCD = '#2a7a8f';
let currentTracks = [...DEFAULT_TRACKS];
let currentConfig = null;
let curA = true;
let activeIdx = -1;
let curGenre = -1;
let audioElement = null;

// 主初始化入口
document.addEventListener('DOMContentLoaded', () => {
  initAudioEngine();
  initPreloader();
  initProgressScroll();
  initSpectrumCanvas();
  initHeroParallax();
  initNavScroll();
  hookHeroVideoFadeIn();
  loadPortalDataAndRender();
});


function hookHeroVideoFadeIn() {
  const v = document.querySelector('.hero-vcard video');
  if (!v) return;
  const on = () => v.classList.add('ready');
  v.addEventListener('canplay', on);
  v.addEventListener('playing', on);
  if (v.readyState >= 3) on();
}

function initAudioEngine() {
  audioElement = document.getElementById('audioEngine');
  if (!audioElement) {
    audioElement = document.createElement('audio');
    audioElement.id = 'audioEngine';
    document.body.appendChild(audioElement);
  }

  audioElement.addEventListener('ended', () => {
    // 自动播放下一首
    const nextIdx = (activeIdx + 1) % currentTracks.length;
    playTrack(nextIdx);
  });

  audioElement.addEventListener('play', () => {
    updateEqState(true);
  });

  audioElement.addEventListener('pause', () => {
    updateEqState(false);
  });
}

function updateEqState(isPlaying) {
  const allEq = document.querySelectorAll('.eq');
  allEq.forEach(eq => {
    eq.style.opacity = isPlaying ? '1' : '0.5';
  });
}

// 1. Preloader 加载进度条
function initPreloader() {
  let n = 0;
  const el = document.getElementById('loadN');
  const bar = document.getElementById('loadB');
  const iv = setInterval(() => {
    n += Math.ceil(Math.random() * 9);
    if (n >= 100) {
      n = 100;
      clearInterval(iv);
      setTimeout(() => {
        document.getElementById('loader')?.classList.add('done');
        heroKineticReveal();
      }, 350);
    }
    if (el) el.textContent = (n < 10 ? '0' : '') + n;
    if (bar) bar.style.width = n + '%';
  }, 75);
}

// 2. 顶部阅读/浏览进度
function initProgressScroll() {
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const prog = document.getElementById('prog');
    if (prog) {
      prog.style.width = ((h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100) + '%';
    }
  }, { passive: true });
}

// 3. 顶栏滚动显隐
function initNavScroll() {
  window.addEventListener('scroll', () => {
    const topnav = document.getElementById('topnav');
    if (topnav) {
      topnav.classList.toggle('show', window.scrollY > window.innerHeight * 0.55);
    }
  }, { passive: true });
}

// 4. Hero 动力学字符依次淡入
function heroKineticReveal(customTitle) {
  const h = document.getElementById('heroH1');
  if (!h) return;
  const t = customTitle || (currentConfig?.hero?.title || '白夜');
  h.innerHTML = '';
  t.split('').forEach(c => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.textContent = c;
    h.appendChild(s);
  });
  let i = 0;
  const iv = setInterval(() => {
    const ch = h.children[i];
    if (!ch) {
      clearInterval(iv);
      return;
    }
    ch.classList.add('in');
    i++;
  }, 140);
}

// 5. Hero 鼠标视差微动
function initHeroParallax() {
  const hero = document.querySelector('.hero');
  const inner = document.querySelector('.hero-in');
  if (!hero || !inner) return;

  hero.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    inner.style.transform = `translate(${x * 24}px, ${y * 16}px)`;
  });

  hero.addEventListener('mouseleave', () => {
    inner.style.transform = '';
  });
}

// 6. 实时动态音频频谱 Canvas 渲染
function initSpectrumCanvas() {
  const cv = document.getElementById('spec');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W, H, mx = 0.5, energy = 0;
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  function resize() {
    W = cv.width = cv.offsetWidth * dpr;
    H = cv.height = cv.offsetHeight * dpr;
  }
  resize();
  window.addEventListener('resize', resize);

  const hero = document.querySelector('.hero');
  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      const r = cv.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width;
      energy = Math.min(1, energy + 0.28);
    });
  }

  function hexA(hx, a) {
    const n = parseInt(hx.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  (function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const n = 72;
    const bw = W / n;
    energy *= 0.984;

    for (let i = 0; i < n; i++) {
      const p = i / n;
      const b1 = Math.sin(t * 0.0016 + i * 0.55) * 0.5 + 0.5;
      const b2 = Math.sin(t * 0.00093 + i * 1.31 + 2) * 0.5 + 0.5;
      const md = Math.max(0, 1 - Math.abs(p - mx) * 4.5);
      const h = (b1 * 0.34 + b2 * 0.24 + 0.1 + energy * 0.55 + md * 0.6) * H * 0.94;
      const g = ctx.createLinearGradient(0, H, 0, Math.max(0, H - h));
      g.addColorStop(0, hexA(ACC, 0.9));
      g.addColorStop(1, hexA(ACCD, 0.9));
      ctx.fillStyle = g;
      const bh = Math.max(2 * dpr, h);
      ctx.fillRect(i * bw + bw * 0.22, H - bh, bw * 0.56, bh);
    }
    requestAnimationFrame(draw);
  })(0);
}

// 7. 颜色计算加深辅助函数
function shade(hx, f) {
  const n = parseInt(hx.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.round(r * f);
  g = Math.round(g * f);
  b = Math.round(b * f);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// 8. 核心业务数据加载并装配
async function loadPortalDataAndRender() {
  try {
    const [configRes, catalogRes] = await Promise.allSettled([
      fetch('/api/config/music-portal').then(r => r.ok ? r.json() : null),
      fetch('/api/catalog').then(r => r.ok ? r.json() : null)
    ]);

    const portalConfig = configRes.status === 'fulfilled' ? configRes.value : null;
    const catalog = catalogRes.status === 'fulfilled' ? catalogRes.value : null;

    currentConfig = portalConfig;

    if (portalConfig && portalConfig.pageTitle) {
      document.title = portalConfig.pageTitle;
    }

    // 如果后台有独立上传的曲目，则融合曲目列表
    if (catalog && Array.isArray(catalog.music) && catalog.music.length > 0) {
      mergeCatalogTracks(catalog.music);
    }

    renderHero(portalConfig?.hero);
    renderMarquee(portalConfig?.marquee);
    renderManifesto(portalConfig?.manifesto);
    renderChart();
    renderAlbums(portalConfig?.albums);
    renderGenres(portalConfig?.genres);
    renderTracks();
    renderTours(portalConfig?.tours);
    renderAbout(portalConfig?.about);
    renderFooter(portalConfig?.footer);

    initWordMaskAnimation();
    initIntersectionReveals();

    // 默认激活第一首
    setActive(0);
  } catch (err) {
    console.warn('[MusicPortal] 使用默认配置渲染:', err);
    renderChart();
    renderAlbums();
    renderGenres();
    renderTracks();
    renderTours();
    initWordMaskAnimation();
    initIntersectionReveals();
    setActive(0);
  }
}

function mergeCatalogTracks(catalogMusic) {
  // 将后台录入的曲目转换为规范形态
  const mapped = catalogMusic.map((m, idx) => {
    const preset = DEFAULT_TRACKS[idx % DEFAULT_TRACKS.length];
    return {
      v: m.videoKey || preset.v,
      cn: m.title || preset.cn,
      en: m.album || preset.en,
      dur: m.duration || preset.dur,
      tag: (m.tags && m.tags[0]) || preset.tag,
      c: m.accentColor || preset.c,
      bpm: Number(m.bpm) || preset.bpm,
      plays: m.plays || preset.plays,
      trend: m.trend || preset.trend,
      audioUrl: m.audioUrl || '',
      coverUrl: m.coverUrl || '',
      videoUrl: m.videoUrl || ''
    };
  });
  if (mapped.length > 0) {
    currentTracks = mapped;
  }
}

// 9. 渲染 Hero 首屏
function renderHero(hero) {
  if (!hero) return;

  const chipEl = document.getElementById('heroChip');
  if (chipEl && hero.chip) chipEl.textContent = hero.chip;

  const titleEnEl = document.getElementById('heroEn');
  if (titleEnEl && hero.titleEn) titleEnEl.textContent = hero.titleEn;

  const subEl = document.getElementById('heroSub');
  if (subEl && hero.subtitle) subEl.innerHTML = hero.subtitle.replace(/\n/g, '<br>');

  const btnPrimary = document.getElementById('heroBtnPrimary');
  if (btnPrimary) {
    if (hero.ctaPrimaryText) btnPrimary.querySelector('span:last-child')?.replaceWith(hero.ctaPrimaryText);
    if (hero.ctaPrimaryHref) btnPrimary.href = hero.ctaPrimaryHref;
  }

  const btnSecondary = document.getElementById('heroBtnSecondary');
  if (btnSecondary) {
    if (hero.ctaSecondaryText) btnSecondary.textContent = hero.ctaSecondaryText;
    if (hero.ctaSecondaryHref) btnSecondary.href = hero.ctaSecondaryHref;
  }

  // 渲染 Hero 统计数据
  const statsWrap = document.getElementById('heroStats');
  if (statsWrap && Array.isArray(hero.stats) && hero.stats.length > 0) {
    statsWrap.innerHTML = hero.stats.map(s => `
      <div><b>${escapeHtml(s.value)}</b><span>${escapeHtml(s.label)}</span></div>
    `).join('');
  }

  // 渲染 Hero 背景视频/图片 (双保险：内联真实首帧海报垫底，视频播放后淡入)
  const mediaContainer = document.getElementById('heroMediaContainer');
  if (mediaContainer && hero) {
    if (hero.mediaType === 'image') {
      mediaContainer.innerHTML = `<img src="${escapeAttr(hero.mediaUrl)}" alt="Hero Cover" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1;" />`;
    } else {
      const vidUrl = hero.mediaUrl || 'https://muse.ai/files/1331075203424773/1432998841610842/xq500iv9v5g5t769vpxqq7gw/noir.mp4';
      mediaContainer.innerHTML = `
        <img class="hv-poster" src="${DEFAULT_POSTER_BASE64}" alt="霓虹雨夜" />
        <video src="${escapeAttr(vidUrl)}" autoplay muted loop playsinline></video>
      `;
      hookHeroVideoFadeIn();
    }
  }

  // 浮动主推信息
  const nowT = document.getElementById('heroNowTitle');
  const nowS = document.getElementById('heroNowSub');
  if (nowT && hero.nowPlayingTitle) nowT.textContent = hero.nowPlayingTitle;
  if (nowS && hero.nowPlayingSub) nowS.textContent = hero.nowPlayingSub;

  const sticker = document.getElementById('heroSticker');
  if (sticker && hero.stickerText) sticker.innerHTML = hero.stickerText.replace(/\n/g, '<br>');
}

// 10. 跑马灯渲染 (支持后台任意编辑并动态分段循环)
function renderMarquee(marquee) {
  const stripIn = document.getElementById('stripIn');
  if (!stripIn) return;
  const rawText = (marquee?.text || '').trim() || '十五境 FIFTEEN REALMS ◆ 白夜 WHITE NIGHT ◆';
  const parts = rawText.split(/[◆◇|\n]/).map(s => s.trim()).filter(Boolean);
  const items = parts.length > 0 ? parts : ['十五境 FIFTEEN REALMS', '白夜 WHITE NIGHT'];

  let block = '';
  items.forEach(it => {
    block += `<span>${escapeHtml(it)}</span><i>◆</i>`;
  });

  let full = '';
  for (let k = 0; k < 6; k++) {
    full += block;
  }
  stripIn.innerHTML = full;
}

// 11. 宣言卡片渲染
function renderManifesto(manifesto) {
  if (!manifesto) return;
  const card = document.querySelector('.mani');
  if (!card) return;
  if (manifesto.show === false) {
    card.style.display = 'none';
    return;
  }
  card.style.display = 'block';

  const chip = document.getElementById('maniChip');
  if (chip && manifesto.chip) chip.textContent = manifesto.chip;

  const title = document.getElementById('maniTitle');
  if (title) {
    title.innerHTML = `${escapeHtml(manifesto.title || '十五首曲子，')}<br><span class="hl">${escapeHtml(manifesto.highlight || '十五个世界。')}</span>`;
  }

  const desc = document.getElementById('maniDesc');
  if (desc && manifesto.description) desc.innerHTML = escapeHtml(manifesto.description);

  const statsWrap = document.getElementById('maniStats');
  if (statsWrap && Array.isArray(manifesto.stats) && manifesto.stats.length > 0) {
    const classes = ['s1', 's2', 's3'];
    statsWrap.innerHTML = manifesto.stats.map((s, idx) => `
      <div class="mstat ${classes[idx % classes.length]}">
        <b>${escapeHtml(s.value)}</b>
        <span>${escapeHtml(s.label)}</span>
      </div>
    `).join('');
  }
}

// 12. 新歌排行 (Chart) 横向卡片
function renderChart() {
  const box = document.getElementById('chartRows');
  if (!box) return;
  box.innerHTML = '';

  const chartTracks = currentTracks.slice(0, 10);
  chartTracks.forEach((t, i) => {
    const d = document.createElement('div');
    d.className = 'ccard rv' + (i < 3 ? ' top3' : '');
    d.dataset.tag = t.tag;

    let tr = '<span class="trend same">—</span>';
    if (t.trend === 'new') tr = '<span class="trend new">NEW</span>';
    else if (t.trend === 'up') tr = '<span class="trend up">▲</span>';
    else if (t.trend === 'down') tr = '<span class="trend down">▼</span>';

    const rk = (i < 9 ? '0' : '') + (i + 1);
    d.innerHTML = `
      <div class="ctop"><span class="crank">NO.${rk}</span>${tr}</div>
      <div class="cthumb" style="--tc: ${t.c};"><b>${rk}</b></div>
      <div class="ct">${escapeHtml(t.cn)}</div>
      <div class="ce">${escapeHtml(t.en)}</div>
      <div class="cplays">▶ ${t.plays || '100万+'} · ${t.bpm} BPM</div>
    `;
    d.addEventListener('click', () => {
      playTrack(i);
    });
    box.appendChild(d);
  });
}

// 13. 专辑 (Albums) 唱片卡片
function renderAlbums(albumsConfig) {
  const g = document.getElementById('albumGrid');
  if (!g) return;
  g.innerHTML = '';

  const albums = (albumsConfig && albumsConfig.length > 0) ? albumsConfig : (currentConfig?.albums || [
    { cn: '霓虹雨夜', en: 'NEON RAIN', year: '2026 · EP', color1: '#57e6ff', color2: '#a855f7', trackIds: [0, 4, 13] },
    { cn: '万物有声', en: 'WILD', year: '2025', color1: '#4ade80', color2: '#bfe3ff', trackIds: [2, 9, 10, 11] },
    { cn: '东方既白', en: 'ORIENT', year: '2024', color1: '#3ddc84', color2: '#f0a840', trackIds: [12, 7, 6, 8] },
    { cn: '深渊', en: 'ABYSS', year: '2023', color1: '#3d7bff', color2: '#8a7cff', trackIds: [5, 1, 3, 14] }
  ]);

  albums.forEach((a, i) => {
    const card = document.createElement('div');
    card.className = 'acard rv';
    const c1 = a.color1 || '#57e6ff';
    const c2 = a.color2 || '#a855f7';
    const trackCount = Array.isArray(a.trackIds) ? a.trackIds.length : 4;
    const coverStyle = a.coverUrl ? `background-image: url(${escapeAttr(a.coverUrl)}); background-size: cover;` : `background: linear-gradient(135deg, ${c1}, ${c2});`;

    card.innerHTML = `
      <div class="acov" style="--c1: ${c1}; --c2: ${c2}; ${coverStyle}">
        <span class="anum">0${i + 1}</span>
        <div class="at">
          <b>${escapeHtml(a.name || a.cn)}</b>
          <span>${escapeHtml(a.nameEn || a.en)}</span>
        </div>
        <div class="play"><span class="tri">▶</span></div>
      </div>
      <div class="ainfo">
        <div class="t">${escapeHtml(a.name || a.cn)} <small style="color:var(--muted);font-weight:400">${escapeHtml(a.nameEn || a.en)}</small></div>
        <div class="m">${escapeHtml(a.year || '2026')} · ${trackCount} 首</div>
      </div>
    `;

    card.addEventListener('click', () => {
      const firstTrackIdx = (a.trackIds && a.trackIds[0] !== undefined) ? Number(a.trackIds[0]) : 0;
      playTrack(firstTrackIdx % currentTracks.length);
    });
    g.appendChild(card);
  });
}

// 14. 音乐流派与分类 (Genres)
function renderGenres(genresConfig) {
  const g = document.getElementById('genreGrid');
  const note = document.getElementById('genreNote');
  if (!g) return;
  g.innerHTML = '';

  const genres = (genresConfig && genresConfig.length > 0) ? genresConfig : (currentConfig?.genres || [
    { name: '电子舞曲', nameEn: 'ELECTRONIC', color: '#a855f7', tags: ['INDUSTRIAL', 'DARK TECHNO', 'LIQUID DNB', 'UPLIFTING'] },
    { name: '环境氛围', nameEn: 'AMBIENT', color: '#4ade80', tags: ['AMBIENT', 'DEEP AMBIENT', 'DOWNTEMPO'] },
    { name: '合成器浪潮', nameEn: 'SYNTHWAVE', color: '#57e6ff', tags: ['SYNTHWAVE', 'EPIC'] },
    { name: '世界融合', nameEn: 'WORLD', color: '#f0a840', tags: ['WORLD', 'FOLKTRONICA'] },
    { name: '电影管弦', nameEn: 'CINEMATIC', color: '#bfe3ff', tags: ['CINEMATIC', 'ORCHESTRAL'] },
    { name: '独立流行', nameEn: 'INDIE', color: '#ff8fb3', tags: ['LO-FI', 'ART POP'] }
  ]);

  genres.forEach((gr, gi) => {
    const count = currentTracks.filter(t => (gr.tags || []).includes(t.tag)).length;
    const c = document.createElement('div');
    c.className = 'gcard rv';
    c.style.setProperty('--gc', gr.color || '#57e6ff');
    c.innerHTML = `
      <div class="gt">${escapeHtml(gr.name || gr.cn)}</div>
      <div class="ge">${escapeHtml(gr.nameEn || gr.en)}</div>
      <div class="gn">${count} 首曲目 →</div>
    `;

    c.addEventListener('click', () => {
      curGenre = curGenre === gi ? -1 : gi;
      document.querySelectorAll('.gcard').forEach((x, k) => x.classList.toggle('on', k === curGenre));
      const cards = document.querySelectorAll('.ccard');
      const trks = document.querySelectorAll('.trk');

      if (curGenre < 0) {
        cards.forEach(r => r.classList.remove('dim'));
        trks.forEach(r => r.classList.remove('dim'));
        if (note) note.textContent = '点击卡片筛选排行';
      } else {
        const tags = gr.tags || [];
        let cnt = 0;
        cards.forEach(r => {
          const hit = tags.includes(r.dataset.tag);
          r.classList.toggle('dim', !hit);
          if (hit) cnt++;
        });
        trks.forEach(r => {
          const hit = tags.includes(r.dataset.tag);
          r.classList.toggle('dim', !hit);
        });
        if (note) note.textContent = `${gr.name || gr.cn} · ${cnt} 首上榜`;
      }
    });

    g.appendChild(c);
  });
}

// 15. 曲目列表构建与折叠控制
function renderTracks() {
  const list = document.getElementById('trkList');
  if (!list) return;
  list.innerHTML = '';
  list.classList.add('collapsed');

  currentTracks.forEach((t, i) => {
    const d = document.createElement('div');
    d.className = 'trk';
    d.dataset.i = i;
    d.dataset.tag = t.tag;

    d.innerHTML = `
      <span class="no">${i < 9 ? '0' : ''}${i + 1}</span>
      <span class="tt">${escapeHtml(t.cn)}<small>${escapeHtml(t.en)}</small></span>
      <span>
        <span class="tag">${escapeHtml(t.tag)}</span>
        <div class="dur">${escapeHtml(t.dur)}<span class="bpm">${t.bpm} BPM</span></div>
      </span>
      <span class="eq"><i></i><i></i><i></i><i></i><i></i></span>
    `;

    d.addEventListener('click', () => {
      d.scrollIntoView({ behavior: 'smooth', block: 'center' });
      playTrack(i);
    });

    list.appendChild(d);
  });

  // 展开全部按钮
  const b = document.createElement('button');
  b.className = 'more-btn';
  b.innerHTML = `展开全部 ${currentTracks.length} 首 <span>↓</span>`;
  b.addEventListener('click', () => {
    const c = list.classList.toggle('collapsed');
    b.innerHTML = c ? `展开全部 ${currentTracks.length} 首 <span>↓</span>` : '收起 <span>↑</span>';
  });
  list.appendChild(b);

  // 滚动相交观察器，滚动时自动换视窗
  const rows = document.querySelectorAll('.trk');
  const io = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (e.isIntersecting) {
        setActive(parseInt(e.target.dataset.i, 10));
      }
    });
  }, { rootMargin: '-40% 0px -40% 0px' });

  rows.forEach(r => io.observe(r));
}

// 16. 激活某首曲目，并驱动视听舞台
function setActive(i) {
  if (i < 0 || i >= currentTracks.length) return;
  activeIdx = i;

  document.querySelectorAll('.trk').forEach((r, j) => {
    r.classList.toggle('active', j === i);
  });

  const t = currentTracks[i];
  const show = curA ? document.getElementById('stgB') : document.getElementById('stgA');
  const hide = curA ? document.getElementById('stgA') : document.getElementById('stgB');
  curA = !curA;

  // 视频地址
  const videoSrc = t.videoUrl || DEFAULT_VURL[t.v] || `https://muse.ai/files/.../${t.v}.mp4`;
  if (show && show.dataset.v !== t.v) {
    show.src = videoSrc;
    show.dataset.v = t.v;
    show.load();
  }
  show?.play().catch(() => {});
  show?.classList.add('on');
  hide?.classList.remove('on');

  // 更新舞台下方标题
  const capT = document.getElementById('capT');
  const capE = document.getElementById('capE');
  if (capT) capT.textContent = `${i < 9 ? '0' : ''}${i + 1} · ${t.cn}`;
  if (capE) capE.textContent = `${t.en} — ${t.dur}`;

  // 旋转黑胶唱片
  const vin = document.getElementById('vinyl');
  if (vin) vin.classList.add('on');

  // 动态主题强调色
  document.documentElement.style.setProperty('--acc', t.c);
  ACC = t.c;
  ACCD = shade(t.c, 0.5);
  document.documentElement.style.setProperty('--accD', ACCD);

  // 脉冲波纹
  const pu = document.getElementById('stagePulse');
  if (pu) {
    pu.classList.remove('go');
    void pu.offsetWidth;
    pu.classList.add('go');
  }
}

// 播放单曲（含真实音频与平滑滚动）
function playTrack(i) {
  setActive(i);
  const t = currentTracks[i];
  if (t && t.audioUrl && audioElement) {
    audioElement.src = t.audioUrl;
    audioElement.play().catch(e => console.warn('音频播放受阻:', e));
  }
  document.getElementById('tracks')?.scrollIntoView({ behavior: 'smooth' });
}

// 17. 巡演日程渲染
function renderTours(toursConfig) {
  const w = document.getElementById('tourRows');
  if (!w) return;
  w.innerHTML = '';

  const tours = (toursConfig && toursConfig.length > 0) ? toursConfig : (currentConfig?.tours || [
    { date: '2026.11.08', city: '上海', venue: 'Modern Sky Lab', status: 'hot', statusLabel: '余票' },
    { date: '2026.11.15', city: '北京', venue: '愚公移山', status: 'hot', statusLabel: '余票' },
    { date: '2026.11.22', city: '深圳', venue: 'B10 Live', status: 'sold', statusLabel: '售罄' },
    { date: '2026.11.29', city: '成都', venue: '正火艺术中心', status: 'soon', statusLabel: '待售' },
    { date: '2026.12.06', city: '杭州', venue: '酒球会', status: 'soon', statusLabel: '待售' }
  ]);

  tours.forEach(t => {
    const d = document.createElement('div');
    d.className = 'trow rv';
    d.innerHTML = `
      <span class="d">${escapeHtml(t.date)}</span>
      <span class="c">${escapeHtml(t.city)}</span>
      <span class="v">${escapeHtml(t.venue)}</span>
      <span class="st ${escapeAttr(t.status)}">${escapeHtml(t.statusLabel || '余票')}</span>
    `;
    w.appendChild(d);
  });
}

// 18. 关于白夜 (About)
function renderAbout(about) {
  if (!about) return;
  const tEl = document.getElementById('aboutTitle');
  const p1 = document.getElementById('aboutP1');
  const p2 = document.getElementById('aboutP2');
  const sWrap = document.getElementById('aboutStats');

  if (tEl && about.title) tEl.textContent = about.title;
  if (p1 && about.text1) p1.textContent = about.text1;
  if (p2 && about.text2) p2.textContent = about.text2;

  if (sWrap && Array.isArray(about.stats) && about.stats.length > 0) {
    sWrap.innerHTML = about.stats.map(s => `
      <div class="astat"><b>${escapeHtml(s.value)}</b><span>${escapeHtml(s.label)}</span></div>
    `).join('');
  }
}

// 19. 底部 CTA 与社交链接
function renderFooter(footer) {
  if (!footer) return;
  const fTitle = document.getElementById('finalTitle');
  const fSub = document.getElementById('finalSub');
  const fCopy = document.getElementById('finalCopy');
  const fSocs = document.getElementById('finalSocs');

  if (fTitle && footer.title) fTitle.innerHTML = footer.title.replace(/\n/g, '<br>');
  if (fSub && footer.subtitle) fSub.textContent = footer.subtitle;
  if (fCopy && footer.copyright) fCopy.textContent = footer.copyright;

  if (fSocs && Array.isArray(footer.socialLinks)) {
    fSocs.innerHTML = footer.socialLinks.map(l => `
      <a href="${escapeAttr(l.href)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>
    `).join('');
  }
}

// 20. 逐字遮罩上升动画 (Word-Mask)
function initWordMaskAnimation() {
  const sel = '.sec-head h2, .tour-in h2, .about-in h2';
  document.querySelectorAll(sel).forEach(h => {
    if (h.dataset.masked) return;
    h.dataset.masked = '1';
    const words = h.textContent.trim().split(/\s+/);
    h.innerHTML = '';
    words.forEach((w, i) => {
      const m = document.createElement('span');
      m.className = 'wm';
      const wi = document.createElement('span');
      wi.className = 'wi';
      wi.textContent = w;
      wi.style.transitionDelay = (i * 90) + 'ms';
      m.appendChild(wi);
      h.appendChild(m);
      h.appendChild(document.createTextNode(' '));
    });
  });

  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.35 });

  document.querySelectorAll(sel).forEach(h => io.observe(h));
}

// 21. 滚动淡入动效 (Reveal)
function initIntersectionReveals() {
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.rv').forEach(el => io.observe(el));

  // 兜底：防止漏检未淡入元素
  setTimeout(() => {
    document.querySelectorAll('.rv:not(.in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
    });
  }, 3500);
}

// 辅助安全转义
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/`/g, '&#96;');
}

window.playTrack = playTrack;
