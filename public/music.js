// 天才猫音乐频道 v4 升级：场景歌单、统一推广位与悬浮胶囊播放器

const SCENE_DEFINITIONS = [
  { key: "all", label: "全部场景", icon: "apps", color: "#cfbcff" },
  { key: "live", label: "直播暖场", icon: "radio", color: "#EF4444" },
  { key: "soundcheck", label: "试音调音", icon: "mic", color: "#3B82F6" },
  { key: "night", label: "沉浸夜聊", icon: "bedtime", color: "#8B5CF6" },
  { key: "sales", label: "爆单带货", icon: "shopping_bag", color: "#F59E0B" },
  { key: "other", label: "其它场景", icon: "sparkles", color: "#06B6D4" }
];

let tracks = [];
let playlists = [];
let promotions = { items: [] };

let queue = [];
let queueIndex = -1;
let activeTrack = null;
let parsedLyrics = [];
let activeLyricIndex = -1;

let activeScene = "all";
let activeTag = "all";

// Elements
const audio = byId("playerAudio");
const player = byId("musicPlayer");
const coverWrap = byId("capsuleCoverWrap");
const playerCover = byId("playerCover");
const playerTitle = byId("playerTitle");
const playerArtist = byId("playerArtist");
const playerPrev = byId("playerPrev");
const playerPlay = byId("playerPlay");
const playerPlayIcon = byId("playerPlayIcon");
const playerNext = byId("playerNext");
const playerProgress = byId("playerProgress");
const playerCurrentTime = byId("playerCurrentTime");
const playerDuration = byId("playerDuration");
const playerVolumeBtn = byId("playerVolumeBtn");
const playerVolumeIcon = byId("playerVolumeIcon");
const playerVolume = byId("playerVolume");
const playerQueueBtn = byId("playerQueueBtn");
const playerQueueBadge = byId("playerQueueBadge");
const playerLyricsBtn = byId("playerLyricsBtn");

const queueDrawer = byId("playerQueueDrawer");
const queueList = byId("playerQueueList");
const queueCount = byId("queueCount");
const clearQueueBtn = byId("clearQueueBtn");
const closeQueueBtn = byId("closeQueueBtn");

const lyricsPanel = byId("playerLyricsPanel");
const lyricsBody = byId("playerLyricsBody");
const lyricsHeaderTitle = byId("lyricsHeaderTitle");
const closeLyricsBtn = byId("closeLyricsBtn");

const musicMainHome = byId("musicMainHome");
const playlistDetailView = byId("playlistDetailView");
const search = byId("musicSearch");
const clearSearch = byId("clearMusicSearch");
const heroPlay = byId("heroPlay");
const grid = byId("musicGrid");

init();

async function init() {
  bindPlayerEvents();
  bindSearchEvents();
  window.addEventListener("popstate", handleRoute);

  await loadData();
  restoreSessionState();
  handleRoute();
}

async function loadData() {
  try {
    const [catRes, promoRes, plRes] = await Promise.all([
      fetch("/api/catalog", { cache: "no-store" }).catch(() => null),
      fetch("/api/config/promotions", { cache: "no-store" }).catch(() => null),
      fetch("/api/config/playlists", { cache: "no-store" }).catch(() => null)
    ]);

    const catalog = catRes && catRes.ok ? await catRes.json() : { music: [], navigation: [] };
    promotions = promoRes && promoRes.ok ? await promoRes.json() : { items: [] };
    const plData = plRes && plRes.ok ? await plRes.json() : { items: [] };

    tracks = (catalog.music || []).map(normalizeTrack);
    playlists = (plData.items || []).filter(p => p && p.status === "published");

    renderNavigation(catalog.navigation || []);
    renderOverview();
    renderHero(catalog);
    renderSceneChannels();
    renderMusic();
  } catch (err) {
    console.error("加载音乐频道数据异常:", err);
  }
}

function handleRoute() {
  const params = new URLSearchParams(window.location.search);
  const playlistId = params.get("playlist");

  if (playlistId) {
    renderPlaylistDetail(playlistId);
  } else {
    playlistDetailView.hidden = true;
    playlistDetailView.replaceChildren();
    musicMainHome.hidden = false;
  }
}

function navigateToPlaylist(id) {
  const url = new URL(window.location);
  url.searchParams.set("playlist", id);
  window.history.pushState({}, "", url);
  handleRoute();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function navigateToHome() {
  const url = new URL(window.location);
  url.searchParams.delete("playlist");
  window.history.pushState({}, "", url);
  handleRoute();
}

/* ========================================================
   Hero 渲染：推广位 > featured 歌单 > catalog 主推曲目
   ======================================================== */
function renderHero(catalog) {
  let promoHero = null;
  if (window.NsyPromotions?.resolvePromotions) {
    const resolvedPromos = window.NsyPromotions.resolvePromotions(promotions, catalog, "music");
    if (resolvedPromos.length > 0) {
      promoHero = resolvedPromos[0];
    }
  }

  const featuredPlaylist = playlists.find(p => p.featured);
  const heroKicker = byId("heroKicker");
  const heroHeadline = byId("heroHeadline");
  const heroLead = byId("heroLead");
  const heroCover = byId("heroCover");
  const heroTitle = byId("heroTitle");
  const heroArtist = byId("heroArtist");

  if (promoHero) {
    if (heroKicker) heroKicker.textContent = promoHero.badge || "Featured Promotion";
    if (heroHeadline) heroHeadline.textContent = promoHero.title;
    if (heroLead) heroLead.textContent = promoHero.subtitle || "精选推广频道";
    if (heroCover) heroCover.src = promoHero.image || "/logo.png";
    if (heroTitle) heroTitle.textContent = promoHero.title;
    if (heroArtist) heroArtist.textContent = promoHero.ctaText || "点击查看详情";

    heroPlay.onclick = () => {
      if (promoHero.ctaHref) window.location.href = promoHero.ctaHref;
    };
    return;
  }

  if (featuredPlaylist) {
    const validTracks = getPlaylistPlayableTracks(featuredPlaylist);
    if (heroKicker) heroKicker.textContent = "Featured Playlist";
    if (heroHeadline) heroHeadline.textContent = featuredPlaylist.title;
    if (heroLead) heroLead.textContent = featuredPlaylist.description || "官方推荐精选场景歌单";
    if (heroCover) heroCover.src = featuredPlaylist.cover || getPlaylistFirstCover(featuredPlaylist) || "/logo.png";
    if (heroTitle) heroTitle.textContent = `${featuredPlaylist.title} · ${validTracks.length} 首曲目`;
    if (heroArtist) heroArtist.textContent = "点击播放全部曲目";

    heroPlay.onclick = () => {
      if (validTracks.length > 0) {
        playTrack(validTracks[0], validTracks);
      } else {
        navigateToPlaylist(featuredPlaylist.id);
      }
    };
    return;
  }

  // Fallback to top track
  const featuredTracks = tracks.filter(t => t.featured);
  const heroTrack = featuredTracks[0] || tracks[0];
  if (heroTrack) {
    if (heroCover) heroCover.src = heroTrack.coverUrl || "/logo.png";
    if (heroTitle) heroTitle.textContent = heroTrack.title;
    if (heroArtist) heroArtist.textContent = heroTrack.artist;
    heroPlay.onclick = () => playTrack(heroTrack, tracks);
  }
}

/* ========================================================
   场景歌单频道 (Scene Channels)
   ======================================================== */
function renderSceneChannels() {
  const tabsRoot = byId("sceneTabs");
  const gridRoot = byId("scenePlaylistsGrid");
  if (!tabsRoot || !gridRoot) return;

  // Render Tabs
  tabsRoot.innerHTML = SCENE_DEFINITIONS.map(sc => {
    const count = sc.key === "all"
      ? playlists.length
      : playlists.filter(p => p.scene === sc.key).length;
    return `
      <button type="button" class="scene-tab-btn ${sc.key === activeScene ? "is-active" : ""}" data-scene="${sc.key}">
        <span class="material-symbols-outlined">${escapeAttr(sc.icon)}</span>
        <span>${escapeHtml(sc.label)}</span>
        <span style="opacity:0.75;font-size:11px;">(${count})</span>
      </button>
    `;
  }).join("");

  tabsRoot.querySelectorAll(".scene-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeScene = btn.getAttribute("data-scene");
      renderSceneChannels();
    });
  });

  // Filter playlists
  const list = activeScene === "all"
    ? playlists
    : playlists.filter(p => p.scene === activeScene);

  if (!list.length) {
    gridRoot.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--music-dim);">
        <span class="material-symbols-outlined" style="font-size: 36px; opacity: 0.5;">queue_music</span>
        <p style="margin-top: 8px; font-size: 14px;">当前场景暂未发布歌单</p>
      </div>
    `;
    return;
  }

  gridRoot.replaceChildren(...list.map(renderPlaylistCard));
}

function renderPlaylistCard(playlist) {
  const card = document.createElement("article");
  card.className = "playlist-card";

  const playableTracks = getPlaylistPlayableTracks(playlist);
  const count = playableTracks.length;
  const sceneDef = SCENE_DEFINITIONS.find(s => s.key === playlist.scene) || SCENE_DEFINITIONS[5];

  // Cover: if custom cover exists, single image; if not, composite 2x2 or single or gradient
  let coverHtml = "";
  if (playlist.cover) {
    coverHtml = `<img src="${escapeAttr(playlist.cover)}" alt="${escapeAttr(playlist.title)}" loading="lazy">`;
  } else {
    const covers = playableTracks.map(t => t.coverUrl).filter(Boolean).slice(0, 4);
    if (covers.length >= 4) {
      coverHtml = `
        <div class="collage-2x2">
          ${covers.map(c => `<img src="${escapeAttr(c)}" alt="" loading="lazy">`).join("")}
        </div>
      `;
    } else if (covers.length > 0) {
      coverHtml = `<img src="${escapeAttr(covers[0])}" alt="" loading="lazy">`;
    } else {
      coverHtml = `
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1f1c2b,#110e17);">
          <span class="material-symbols-outlined" style="font-size:42px;color:rgba(207,188,255,0.4);">album</span>
        </div>
      `;
    }
  }

  card.innerHTML = `
    <div class="playlist-card__cover">
      ${coverHtml}
      <div class="playlist-card__badge">
        <span class="material-symbols-outlined" style="font-size:14px;color:${sceneDef.color}">${sceneDef.icon}</span>
        ${escapeHtml(sceneDef.label)}
      </div>
      <div class="playlist-card__count">
        <span class="material-symbols-outlined" style="font-size:13px;color:var(--music-cyan);">music_note</span>
        ${count} 首
      </div>
      <button type="button" class="playlist-card__play-btn" title="播放此歌单">
        <span class="material-symbols-outlined">play_arrow</span>
      </button>
    </div>
    <div class="playlist-card__body">
      <h3 class="playlist-card__title">${escapeHtml(playlist.title)}</h3>
      <p class="playlist-card__desc">${escapeHtml(playlist.description || "点击浏览此歌单内的精选曲目")}</p>
    </div>
  `;

  // Click card to open playlist detail
  card.addEventListener("click", (e) => {
    if (e.target.closest(".playlist-card__play-btn")) {
      e.stopPropagation();
      if (playableTracks.length > 0) {
        playTrack(playableTracks[0], playableTracks);
      } else {
        navigateToPlaylist(playlist.id);
      }
      return;
    }
    navigateToPlaylist(playlist.id);
  });

  return card;
}

/* ========================================================
   歌单详情视图 (?playlist=<id>)
   ======================================================== */
function renderPlaylistDetail(playlistId) {
  const pl = playlists.find(p => p.id === playlistId);
  musicMainHome.hidden = true;
  playlistDetailView.hidden = false;

  if (!pl) {
    playlistDetailView.innerHTML = `
      <button type="button" class="playlist-detail__back" id="backToHomeBtn">
        <span class="material-symbols-outlined">arrow_back</span>
        返回全部歌单
      </button>
      <div class="music-empty">
        <h3>未找到歌单</h3>
        <p>该歌单可能已被删除或设为草稿。</p>
      </div>
    `;
    byId("backToHomeBtn")?.addEventListener("click", navigateToHome);
    return;
  }

  const validTracks = getPlaylistPlayableTracks(pl);
  const sceneDef = SCENE_DEFINITIONS.find(s => s.key === pl.scene) || SCENE_DEFINITIONS[5];
  const coverUrl = pl.cover || getPlaylistFirstCover(pl) || "/logo.png";

  playlistDetailView.innerHTML = `
    <button type="button" class="playlist-detail__back" id="backToHomeBtn">
      <span class="material-symbols-outlined">arrow_back</span>
      返回全部歌单
    </button>

    <div class="playlist-detail__header">
      <div class="playlist-detail__cover">
        <img src="${escapeAttr(coverUrl)}" alt="${escapeAttr(pl.title)}">
      </div>
      <div class="playlist-detail__meta">
        <div class="playlist-detail__scene-badge">
          <span class="material-symbols-outlined" style="font-size:16px;color:${sceneDef.color}">${sceneDef.icon}</span>
          ${escapeHtml(sceneDef.label)}
        </div>
        <h1 class="playlist-detail__title">${escapeHtml(pl.title)}</h1>
        <p class="playlist-detail__desc">${escapeHtml(pl.description || "暂无描述")}</p>
        <div class="playlist-detail__stats">
          <span>共 ${validTracks.length} 首曲目</span>
          <span>·</span>
          <span>按场景精选编排</span>
        </div>
        <div class="playlist-detail__actions">
          <button type="button" class="playlist-play-all-btn" id="playAllBtn">
            <span class="material-symbols-outlined">play_arrow</span>
            播放全部
          </button>
        </div>
      </div>
    </div>

    <div class="playlist-tracks-table">
      ${validTracks.length === 0 ? `
        <div style="padding: 40px; text-align: center; color: var(--music-dim);">
          歌单内暂无可播放曲目（可能仍在曲库审核或待发布）
        </div>
      ` : validTracks.map((track, idx) => `
        <div class="playlist-track-row ${activeTrack && activeTrack.id === track.id ? "is-playing" : ""}" data-track-id="${escapeAttr(track.id)}" data-idx="${idx}">
          <span class="playlist-track-row__idx">${String(idx + 1).padStart(2, "0")}</span>
          <img class="playlist-track-row__cover" src="${escapeAttr(track.coverUrl || "/logo.png")}" alt="">
          <span class="playlist-track-row__title">${escapeHtml(track.title)}</span>
          <span class="playlist-track-row__artist">${escapeHtml(track.artist || "未知歌手")}</span>
          <div class="playlist-track-row__action">
            <button type="button" class="track-play-single-btn" title="播放这首">
              <span class="material-symbols-outlined" style="font-size:18px;">
                ${activeTrack && activeTrack.id === track.id && !audio.paused ? "pause" : "play_arrow"}
              </span>
            </button>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  byId("backToHomeBtn")?.addEventListener("click", navigateToHome);

  byId("playAllBtn")?.addEventListener("click", () => {
    if (validTracks.length > 0) {
      playTrack(validTracks[0], validTracks);
    }
  });

  playlistDetailView.querySelectorAll(".playlist-track-row").forEach(row => {
    row.addEventListener("click", () => {
      const idx = Number(row.getAttribute("data-idx"));
      if (validTracks[idx]) {
        playTrack(validTracks[idx], validTracks);
      }
    });
  });
}

function getPlaylistPlayableTracks(playlist) {
  if (!playlist || !Array.isArray(playlist.trackIds)) return [];
  const trackMap = new Map(tracks.map(t => [String(t.id), t]));
  // 铁律：找不到（被删、下架、草稿）就跳过这条，不报错
  return playlist.trackIds
    .map(tid => trackMap.get(String(tid)))
    .filter(t => t && (t.status === undefined || t.status === "published" || t.status === "active"));
}

function getPlaylistFirstCover(playlist) {
  const valid = getPlaylistPlayableTracks(playlist);
  for (const t of valid) {
    if (t.coverUrl) return t.coverUrl;
  }
  return "";
}

/* ========================================================
   底部悬浮胶囊播放器核心逻辑
   ======================================================== */
function bindPlayerEvents() {
  playerPlay.addEventListener("click", togglePlay);
  playerPrev.addEventListener("click", playPrev);
  playerNext.addEventListener("click", playNext);

  audio.addEventListener("play", () => {
    playerPlayIcon.textContent = "pause";
    coverWrap.classList.add("is-playing");
    updatePlayingRowIndicators();
    saveSessionState();
  });

  audio.addEventListener("pause", () => {
    playerPlayIcon.textContent = "play_arrow";
    coverWrap.classList.remove("is-playing");
    updatePlayingRowIndicators();
    saveSessionState();
  });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    playerProgress.value = String(pct);
    playerCurrentTime.textContent = formatTime(audio.currentTime);
    playerDuration.textContent = formatTime(audio.duration);
    syncLyrics(audio.currentTime);
  });

  audio.addEventListener("loadedmetadata", () => {
    playerDuration.textContent = formatTime(audio.duration);
    saveSessionState();
  });

  audio.addEventListener("ended", () => {
    playNext();
  });

  audio.addEventListener("error", () => {
    playerPlayIcon.textContent = "play_arrow";
    coverWrap.classList.remove("is-playing");
    playerArtist.textContent = activeTrack?.neteaseId
      ? "网易云暂时不可播放，建议使用 R2 音频"
      : "音频地址暂时不可播放";
  });

  playerProgress.addEventListener("input", () => {
    if (!audio.duration) return;
    audio.currentTime = (Number(playerProgress.value) / 100) * audio.duration;
    saveSessionState();
  });

  // Volume
  playerVolume.addEventListener("input", () => {
    const val = Number(playerVolume.value) / 100;
    audio.volume = val;
    updateVolumeIcon(val);
    saveSessionState();
  });

  playerVolumeBtn.addEventListener("click", () => {
    if (audio.volume > 0) {
      audio.dataset.prevVol = String(audio.volume);
      audio.volume = 0;
      playerVolume.value = "0";
      updateVolumeIcon(0);
    } else {
      const prev = Number(audio.dataset.prevVol || 0.85);
      audio.volume = prev;
      playerVolume.value = String(prev * 100);
      updateVolumeIcon(prev);
    }
    saveSessionState();
  });

  // Queue Panel Toggle
  playerQueueBtn.addEventListener("click", () => {
    queueDrawer.hidden = !queueDrawer.hidden;
    lyricsPanel.hidden = true;
    if (!queueDrawer.hidden) renderQueueDrawer();
  });
  closeQueueBtn.addEventListener("click", () => queueDrawer.hidden = true);
  clearQueueBtn.addEventListener("click", () => {
    queue = activeTrack ? [activeTrack] : [];
    queueIndex = activeTrack ? 0 : -1;
    renderQueueDrawer();
    updateQueueBadge();
    saveSessionState();
  });

  // Lyrics Panel Toggle
  playerLyricsBtn.addEventListener("click", () => {
    lyricsPanel.hidden = !lyricsPanel.hidden;
    queueDrawer.hidden = true;
    if (!lyricsPanel.hidden) renderLyricsPanel();
  });
  closeLyricsBtn.addEventListener("click", () => lyricsPanel.hidden = true);
}

function updateVolumeIcon(vol) {
  if (vol === 0) playerVolumeIcon.textContent = "volume_off";
  else if (vol < 0.5) playerVolumeIcon.textContent = "volume_down";
  else playerVolumeIcon.textContent = "volume_up";
}

function togglePlay() {
  if (!audio.src) {
    if (tracks.length > 0) playTrack(tracks[0], tracks);
    return;
  }
  if (audio.paused) {
    audio.play().catch(e => {
      playerArtist.textContent = "请再次点击以开始播放";
    });
  } else {
    audio.pause();
  }
}

function playTrack(track, newQueue = null) {
  if (!track) return;
  const url = playableUrl(track);
  if (!url) {
    playerArtist.textContent = "曲目无有效音频链接";
    return;
  }

  if (newQueue && Array.isArray(newQueue) && newQueue.length > 0) {
    queue = [...newQueue];
    queueIndex = queue.findIndex(t => t.id === track.id);
    if (queueIndex < 0) queueIndex = 0;
  } else if (!queue.some(t => t.id === track.id)) {
    queue.push(track);
    queueIndex = queue.length - 1;
  } else {
    queueIndex = queue.findIndex(t => t.id === track.id);
  }

  activeTrack = track;
  playerCover.src = track.coverUrl || "/logo.png";
  playerTitle.textContent = track.title;
  playerArtist.textContent = `${track.artist || "未知歌手"}${track.neteaseId && !track.audioUrl ? " · 网易云音乐" : ""}`;

  parseLyrics(track.lyric || "");

  audio.src = url;
  player.hidden = false;
  updateQueueBadge();
  renderQueueDrawer();
  renderLyricsPanel();
  updatePlayingRowIndicators();

  audio.play().catch(() => {
    playerArtist.textContent = "浏览器阻止自动播放，请点一次播放";
  });

  saveSessionState();
}

function playPrev() {
  if (!queue.length) return;
  queueIndex = queueIndex <= 0 ? queue.length - 1 : queueIndex - 1;
  playTrack(queue[queueIndex]);
}

function playNext() {
  if (!queue.length) return;
  queueIndex = (queueIndex + 1) % queue.length;
  playTrack(queue[queueIndex]);
}

function updateQueueBadge() {
  if (playerQueueBadge) {
    playerQueueBadge.textContent = String(queue.length);
  }
  if (queueCount) {
    queueCount.textContent = String(queue.length);
  }
}

function renderQueueDrawer() {
  if (!queueList) return;
  updateQueueBadge();
  if (!queue.length) {
    queueList.innerHTML = `<div style="padding:20px;text-align:center;color:var(--music-dim);font-size:12px;">播放队列为空</div>`;
    return;
  }

  queueList.innerHTML = queue.map((t, idx) => `
    <div class="queue-item ${idx === queueIndex ? "is-active" : ""}" data-idx="${idx}">
      <img src="${escapeAttr(t.coverUrl || "/logo.png")}" alt="">
      <div class="queue-item__info">
        <strong>${escapeHtml(t.title)}</strong>
        <span>${escapeHtml(t.artist || "未知歌手")}</span>
      </div>
      <button type="button" class="queue-item__remove" data-remove-idx="${idx}" title="从队列移除">
        <span class="material-symbols-outlined" style="font-size:16px;">close</span>
      </button>
    </div>
  `).join("");

  queueList.querySelectorAll(".queue-item").forEach(item => {
    item.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".queue-item__remove");
      if (removeBtn) {
        e.stopPropagation();
        const rIdx = Number(removeBtn.getAttribute("data-remove-idx"));
        queue.splice(rIdx, 1);
        if (queueIndex >= queue.length) queueIndex = queue.length - 1;
        renderQueueDrawer();
        saveSessionState();
        return;
      }
      const idx = Number(item.getAttribute("data-idx"));
      if (queue[idx]) {
        queueIndex = idx;
        playTrack(queue[idx]);
      }
    });
  });
}

/* ========================================================
   歌词秀逻辑 (LRC Timestamp parser & Auto-scroll)
   ======================================================== */
function parseLyrics(rawLrc) {
  parsedLyrics = [];
  activeLyricIndex = -1;
  if (!rawLrc || !rawLrc.trim()) return;

  const lines = rawLrc.split("\n");
  const regex = /\[(\d{2}):(\d{2}(?:\.\d+)?)\](.*)/;
  for (const line of lines) {
    const match = regex.exec(line);
    if (match) {
      const min = Number(match[1]);
      const sec = Number(match[2]);
      const text = match[3].trim();
      if (text) {
        parsedLyrics.push({ time: min * 60 + sec, text });
      }
    }
  }
  parsedLyrics.sort((a, b) => a.time - b.time);
}

function renderLyricsPanel() {
  if (!lyricsBody) return;
  if (lyricsHeaderTitle) {
    lyricsHeaderTitle.textContent = activeTrack ? `${activeTrack.title} - 歌词秀` : "歌词秀";
  }

  if (!parsedLyrics.length) {
    lyricsBody.innerHTML = `
      <div class="lyric-empty">
        <span class="material-symbols-outlined" style="font-size:36px;opacity:0.4;">lyrics</span>
        <p>暂无歌词或此曲为纯音乐</p>
      </div>
    `;
    return;
  }

  lyricsBody.innerHTML = parsedLyrics.map((line, idx) => `
    <div class="lyric-line ${idx === activeLyricIndex ? "is-active" : ""}" data-idx="${idx}" data-time="${line.time}">
      ${escapeHtml(line.text)}
    </div>
  `).join("");
}

function syncLyrics(currTime) {
  if (!parsedLyrics.length || lyricsPanel.hidden) return;

  let targetIdx = -1;
  for (let i = 0; i < parsedLyrics.length; i++) {
    if (currTime >= parsedLyrics[i].time) {
      targetIdx = i;
    } else {
      break;
    }
  }

  if (targetIdx !== activeLyricIndex && targetIdx >= 0) {
    activeLyricIndex = targetIdx;
    const allLines = lyricsBody.querySelectorAll(".lyric-line");
    allLines.forEach((el, idx) => {
      if (idx === targetIdx) {
        el.classList.add("is-active");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        el.classList.remove("is-active");
      }
    });
  }
}

function updatePlayingRowIndicators() {
  document.querySelectorAll(".playlist-track-row").forEach(row => {
    const tid = row.getAttribute("data-track-id");
    const icon = row.querySelector(".track-play-single-btn .material-symbols-outlined");
    if (activeTrack && activeTrack.id === tid) {
      row.classList.add("is-playing");
      if (icon) icon.textContent = audio.paused ? "play_arrow" : "pause";
    } else {
      row.classList.remove("is-playing");
      if (icon) icon.textContent = "play_arrow";
    }
  });
}

/* ========================================================
   SessionStorage 状态持久化（刷新本页续播）
   ======================================================== */
const SESSION_KEY = "nsy_music_player_v4_state";

function saveSessionState() {
  try {
    const state = {
      activeTrackId: activeTrack?.id || null,
      currentTime: audio.currentTime || 0,
      queueIds: queue.map(t => t.id),
      queueIndex,
      volume: audio.volume
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch (e) {
    // ignore quota error
  }
}

function restoreSessionState() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);
    if (!state) return;

    if (state.volume !== undefined) {
      audio.volume = state.volume;
      playerVolume.value = String(state.volume * 100);
      updateVolumeIcon(state.volume);
    }

    if (Array.isArray(state.queueIds) && state.queueIds.length > 0) {
      const trackMap = new Map(tracks.map(t => [String(t.id), t]));
      queue = state.queueIds.map(id => trackMap.get(String(id))).filter(Boolean);
      queueIndex = state.queueIndex ?? 0;
      updateQueueBadge();
    }

    if (state.activeTrackId) {
      const track = tracks.find(t => String(t.id) === String(state.activeTrackId));
      if (track) {
        activeTrack = track;
        playerCover.src = track.coverUrl || "/logo.png";
        playerTitle.textContent = track.title;
        playerArtist.textContent = track.artist || "未知歌手";
        parseLyrics(track.lyric || "");

        const url = playableUrl(track);
        if (url) {
          audio.src = url;
          if (state.currentTime) {
            audio.currentTime = state.currentTime;
          }
          player.hidden = false;
        }
      }
    }
  } catch (err) {
    console.warn("恢复播放器状态失败:", err);
  }
}

/* ========================================================
   辅助业务函数（数据处理、标签、搜索）
   ======================================================== */
function bindSearchEvents() {
  search.addEventListener("input", renderMusic);
  clearSearch.addEventListener("click", () => {
    search.value = "";
    activeTag = "all";
    renderMusic();
  });
}

function renderOverview() {
  const featured = tracks.filter(track => track.featured);
  const tags = tagList();
  byId("statTracks").textContent = String(tracks.length);
  const plStat = byId("statPlaylists");
  if (plStat) plStat.textContent = String(playlists.length);
  byId("statNew").textContent = String(Math.min(tracks.length, 8));
  byId("statTags").textContent = String(tags.length);

  renderNewReleases();
  renderCharts();
  renderTags(tags);
}

function renderNewReleases() {
  const latest = [...tracks].sort((a, b) => (b.createdAt || b.updatedAt || 0) - (a.createdAt || a.updatedAt || 0));
  const main = latest[0];
  const root = byId("newRelease");
  const list = byId("newReleaseList");
  if (!root || !list) return;

  if (!main) {
    root.innerHTML = emptyBlock("暂无上新", "后台发布音乐后，这里会显示最新曲目。");
    list.replaceChildren();
    return;
  }
  root.innerHTML = `
    <button type="button" class="new-release__cover">
      <img src="${escapeAttr(main.coverUrl || "/logo.png")}" alt="">
      <span>播放</span>
    </button>
    <div>
      <p class="music-kicker">Latest Drop</p>
      <h3>${escapeHtml(main.title)}</h3>
      <strong>${escapeHtml(main.artist)}</strong>
      <small>${escapeHtml(trackSource(main))} · ${formatDate(main.createdAt || main.updatedAt)}</small>
      <button type="button">立即试听</button>
    </div>
  `;
  root.querySelectorAll("button").forEach(button => button.addEventListener("click", () => playTrack(main, tracks)));
  list.replaceChildren(...latest.slice(1, 5).map((track, index) => compactTrack(track, index + 2)));
}

function renderCharts() {
  const ranked = [...tracks].sort((a, b) => {
    return (b.playCount || 0) - (a.playCount || 0)
      || Number(Boolean(b.featured)) - Number(Boolean(a.featured))
      || (b.updatedAt || 0) - (a.updatedAt || 0);
  }).slice(0, 8);
  const root = byId("chartList");
  if (!root) return;
  if (!ranked.length) {
    root.innerHTML = emptyBlock("排行榜待生成", "播放和推荐数据积累后会自动更新。");
    return;
  }
  root.replaceChildren(...ranked.map((track, index) => chartRow(track, index + 1)));
}

function renderTags(tags) {
  const root = byId("tagStrip");
  if (!root) return;
  const buttons = [{ label: "全部", value: "all" }, ...tags.map(tag => ({ label: tag, value: tag }))];
  root.replaceChildren(...buttons.map(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.label;
    button.className = item.value === activeTag ? "is-active" : "";
    button.addEventListener("click", () => {
      activeTag = item.value;
      renderMusic();
    });
    return button;
  }));
}

function renderMusic() {
  if (!grid) return;
  const keyword = search.value.trim().toLowerCase();
  const visible = tracks.filter(track => {
    const haystack = [track.title, track.artist, track.album, track.neteaseId, ...(track.tags || [])].join(" ").toLowerCase();
    const tagOk = activeTag === "all" || (track.tags || []).includes(activeTag);
    return tagOk && (!keyword || haystack.includes(keyword));
  });
  renderTags(tagList());
  grid.replaceChildren();
  if (!visible.length) {
    grid.innerHTML = emptyBlock("没有匹配歌曲", "换个关键词或清空标签筛选再试。");
    return;
  }
  grid.replaceChildren(...visible.map(trackCard));
}

function trackCard(track) {
  const card = document.createElement("article");
  card.className = "music-card";
  card.innerHTML = `
    <button class="music-card__cover" type="button">
      <img src="${escapeAttr(track.coverUrl || "/logo.png")}" alt="">
      <span>${track.featured ? "Featured" : "Play"}</span>
    </button>
    <div>
      <p>${escapeHtml(track.album || trackSource(track))}</p>
      <h3>${escapeHtml(track.title)}</h3>
      <strong>${escapeHtml(track.artist)}</strong>
      <small>${trackTags(track)}</small>
    </div>
  `;
  card.addEventListener("click", () => playTrack(track, tracks));
  return card;
}

function compactTrack(track, index) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "release-row";
  row.innerHTML = `<span>${String(index).padStart(2, "0")}</span><img src="${escapeAttr(track.coverUrl || "/logo.png")}" alt=""><strong>${escapeHtml(track.title)}</strong><small>${escapeHtml(track.artist)}</small>`;
  row.addEventListener("click", () => playTrack(track, tracks));
  return row;
}

function chartRow(track, rank) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "chart-row";
  row.innerHTML = `<span>${rank}</span><img src="${escapeAttr(track.coverUrl || "/logo.png")}" alt=""><strong>${escapeHtml(track.title)}</strong><small>${escapeHtml(track.artist)}</small><em>${track.featured ? "推荐" : trackSource(track)}</em>`;
  row.addEventListener("click", () => playTrack(track, tracks));
  return row;
}

function playableUrl(track) {
  if (track.audioUrl) return track.audioUrl;
  if (track.neteaseId) return `/api/music/netease?id=${encodeURIComponent(track.neteaseId)}`;
  return "";
}

function normalizeTrack(track) {
  return {
    ...track,
    tags: Array.isArray(track.tags) ? track.tags : String(track.tags || "").split(/[,，\n]/).map(item => item.trim()).filter(Boolean),
    playCount: Number(track.playCount || 0),
    createdAt: Number(track.createdAt || 0),
    updatedAt: Number(track.updatedAt || 0)
  };
}

function tagList() {
  return Array.from(new Set(tracks.flatMap(track => track.tags || []))).slice(0, 12);
}

function trackTags(track) {
  const tags = (track.tags || []).slice(0, 3).map(escapeHtml).join(" / ");
  return tags || (track.neteaseId ? `网易云 ID ${escapeHtml(track.neteaseId)}` : "R2 音频");
}

function trackSource(track) {
  return track.audioUrl ? "R2 音频" : track.neteaseId ? "网易云音乐" : "在线音乐";
}

function formatDate(value) {
  if (!value) return "刚刚上新";
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function emptyBlock(title, body) {
  return `<article class="music-empty"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></article>`;
}

function renderNavigation(items) {
  const nav = document.querySelector("[data-nav]");
  if (!nav || !items.length) return;
  nav.innerHTML = items.filter(item => item.status !== "disabled" && !isAdminHref(item.href)).map(item => `<a href="${escapeAttr(item.href)}"${item.external ? ` target="_blank" rel="noopener"` : ""}>${escapeHtml(item.label)}</a>`).join("");
}

function isAdminHref(href) {
  return /^\/(lvtuang|admin\.html)(?:$|[?#])/.test(String(href || ""));
}

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
