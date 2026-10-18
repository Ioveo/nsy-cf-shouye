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
  loadPortalDataAndRender();
});

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

  // 渲染 Hero 背景视频/图片
  const mediaContainer = document.getElementById('heroMediaContainer');
  if (mediaContainer && hero.mediaUrl) {
    if (hero.mediaType === 'image') {
      mediaContainer.innerHTML = `<img src="${escapeAttr(hero.mediaUrl)}" alt="Hero Cover" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;" />`;
    } else {
      mediaContainer.innerHTML = `<video src="${escapeAttr(hero.mediaUrl)}" autoplay muted loop playsinline></video>`;
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

// 10. 跑马灯渲染
function renderMarquee(marquee) {
  const stripIn = document.getElementById('stripIn');
  if (!stripIn) return;
  const text = marquee?.text || '十五境 FIFTEEN REALMS ◆ 白夜 WHITE NIGHT ◆';
  let s = '';
  for (let k = 0; k < 6; k++) {
    s += `<span>${escapeHtml(text)}</span><i>◆</i>`;
  }
  stripIn.innerHTML = s;
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
