const shell = document.querySelector("[data-photo-wall]");
const stage = document.querySelector(".photo-wall-stage");
const track = document.querySelector("[data-photo-wall-track]");
const activeIndex = document.querySelector("[data-photo-wall-index]");
const totalCount = document.querySelector("[data-photo-wall-total]");
const activeTitle = document.querySelector("[data-photo-wall-title]");
const lightbox = document.querySelector("[data-photo-wall-lightbox]");
const lightboxTitle = document.querySelector("[data-photo-wall-lightbox-title]");
const lightboxDesc = document.querySelector("[data-photo-wall-lightbox-desc]");
const lightboxLink = document.querySelector("[data-photo-wall-lightbox-link]");
const lightboxImage = document.querySelector("[data-photo-wall-lightbox-image]");
const closeButton = document.querySelector("[data-photo-wall-close]");

const vsSource = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  attribute vec3 aVertexPosition;
  attribute vec2 aTextureCoord;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform mat4 photoTextureMatrix;

  uniform float uVelocity;
  uniform float uHoverProgress;
  uniform float uExpandProgress;
  uniform float uTime;

  varying vec2 vTextureCoord;
  varying float vDistortion;

  void main() {
    vec3 position = aVertexPosition;
    
    // Wave warp based on scrolling velocity and mesh coordinates
    float curve = cos(position.x * 3.141592) * cos(position.y * 3.141592);
    float velocityEffect = clamp(uVelocity * 0.0055, -0.45, 0.45);
    
    // Liquid bend with smooth elastic damping
    float zDistortion = curve * velocityEffect * 95.0 * (1.0 - uExpandProgress);
    position.z += zDistortion;
    
    float xDistortion = curve * velocityEffect * 0.10 * (1.0 - uExpandProgress);
    position.x -= xDistortion;
    
    // Hover high-frequency ripple
    float ripple = sin(length(position.xy) * 8.0 - uTime * 0.05) * 0.016 * uHoverProgress * (1.0 - uExpandProgress);
    position.z += ripple * 35.0;
    
    // WebGL Liquid Radial Ripple Transition (Aristide Benoist Inspired)
    float dist = length(position.xy);
    float expandWave = sin(dist * 16.0 - uExpandProgress * 22.0) * 0.075 * uExpandProgress * (1.0 - uExpandProgress);
    position.z += expandWave * 150.0;
    
    // Organic liquid X/Y refractions
    position.x += expandWave * sin(position.y * 7.0) * 0.28;
    position.y += expandWave * cos(position.x * 7.0) * 0.28;

    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(position, 1.0);
    
    vTextureCoord = (photoTextureMatrix * vec4(aTextureCoord, 0.0, 1.0)).xy;
    vDistortion = zDistortion * 0.012 + ripple + expandWave;
  }
`;

const fsSource = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  varying vec2 vTextureCoord;
  varying float vDistortion;

  uniform sampler2D photoTexture;
  uniform float uHoverProgress;
  uniform float uExpandProgress;
  uniform float uProximity;

  float getGrayscale(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
  }

  void main() {
    vec2 uv = vTextureCoord;
    
    // Liquid texture UV refraction based on wave distortion
    uv.x += sin(uv.y * 14.0 + vDistortion * 8.0) * vDistortion * 0.045;
    uv.y += cos(uv.x * 14.0 + vDistortion * 8.0) * vDistortion * 0.045;
    
    // Chromatic Aberration (soft clamped RGB shift)
    float shift = clamp(vDistortion * 0.09, -0.022, 0.022);
    
    vec4 colorRed = texture2D(photoTexture, uv + vec2(shift, 0.0));
    vec4 colorGreen = texture2D(photoTexture, uv);
    vec4 colorBlue = texture2D(photoTexture, uv - vec2(shift, 0.0));
    
    vec3 rgbColor = vec3(colorRed.r, colorGreen.g, colorBlue.b);
    float gray = getGrayscale(rgbColor);
    
    float hp = uHoverProgress;
    float ep = uExpandProgress;
    float up = uProximity;
    
    // Spotlight ambient lighting
    float spotlight = 0.32 + 0.68 * up;
    
    // Grayscale blend: center is colorful, sides are elegant monochrome
    float targetGrayscale = (1.0 - up) * (1.0 - hp) * (1.0 - ep);
    
    // Blending filters
    float targetBrightness = spotlight * (1.0 - ep) + ep * 1.0;
    float targetContrast = (1.05 + 0.15 * up) * (1.0 - ep) + ep * 1.0;
    
    vec3 finalColor = mix(rgbColor, vec3(gray), targetGrayscale);
    finalColor *= targetBrightness;
    finalColor = (finalColor - 0.5) * targetContrast + 0.5;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

let items = [];

// =========================================================================
// Pure Semi-Implicit Euler Fluid Mechanics & Kinetic Engine (零滞后流体力学引擎)
// =========================================================================
const state = {
  // Continuous physical coordinates
  x: 0,
  velocity: 0,
  fluidVelocity: 0,
  
  // Dragging & Pointer state
  dragging: false,
  pointerId: null,
  startX: 0,
  lastPointerX: 0,
  pointerHistory: [],
  clickIndex: null,
  moved: false,

  // Geometry Cache (Zero-Reflow Engine)
  cardWidth: 110,
  gap: 10,
  T: 0,
  stageWidth: typeof window !== "undefined" ? window.innerWidth : 1200,
  stageCenter: typeof window !== "undefined" ? window.innerWidth * 0.5 : 600,

  // Interaction indices & progress
  active: 0,
  selectedIndex: null,
  expandProgress: 0,
  hoveredIndex: null,
  hoverProgress: [],

  // Timing & Animation
  lastTime: 0,
  lastFrameTime: 0,
  lastInteractionTime: performance.now(),
  baseLength: 8,
  raf: 0
};

let curtainsInstance = null;
let planes = [];

init();

async function init() {
  if (!shell || !stage || !track) return;

  // Initialize Curtains WebGL
  try {
    if (typeof window.Curtains !== "undefined") {
      curtainsInstance = new window.Curtains({
        container: "photo-wall-canvas",
        pixelRatio: Math.min(1.25, window.devicePixelRatio || 1),
        production: true
      });
      curtainsInstance.onError(() => {
        console.warn("WebGL not supported or context lost. Falling back to CSS 3D.");
        curtainsInstance = null;
      });
    }
  } catch (e) {
    console.warn("Curtains.js initialization failed:", e);
  }

  bindEvents();
  renderWall(await loadItems());
}

async function loadItems() {
  try {
    const response = await fetch("/api/catalog", { cache: "no-store" });
    if (!response.ok) throw new Error("catalog failed");
    const catalog = await response.json();
    const wall = (catalog.photoWall || []).filter(item => item.imageUrl || item.thumbUrl);
    if (wall.length) return wall;
    const gallery = (catalog.gallery || []).filter(item => item.imageUrl || item.thumbUrl);
    if (gallery.length) {
      return gallery.slice(0, 18).map(item => ({
        title: item.title,
        imageUrl: item.imageUrl,
        thumbUrl: item.thumbUrl,
        linkUrl: "/gallery.html",
        linkText: "GALLERY"
      }));
    }
  } catch {
    // Local fallback keeps the page interactive before catalog data arrives.
  }
  return fallbackItems();
}

function resetIdle() {
  state.lastInteractionTime = performance.now();
}

function bindEvents() {
  stage.addEventListener("pointerdown", event => {
    resetIdle();
    if (state.selectedIndex !== null) {
      const card = event.target.closest?.(".photo-wall-card");
      const cardIndex = card ? Number(card.dataset.index || 0) : null;
      if (cardIndex !== state.selectedIndex) {
        closeLightbox();
      }
      return;
    }
    event.preventDefault();
    const card = event.target.closest?.(".photo-wall-card");
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.clickIndex = card ? Number(card.dataset.index || 0) : null;
    state.startX = event.clientX;
    state.lastPointerX = event.clientX;
    state.pointerHistory = [{ x: event.clientX, time: performance.now() }];
    state.velocity = 0;
    state.moved = false;
    stage.classList.add("is-dragging");
    stage.setPointerCapture?.(event.pointerId);
    animate();
  });

  document.addEventListener("pointermove", event => {
    if (!state.dragging) return;
    event.preventDefault();
    resetIdle();

    const now = performance.now();
    const currentX = event.clientX;
    const dx = currentX - state.lastPointerX;
    state.lastPointerX = currentX;

    // 1:1 Direct Coupling (手指动多少屏幕走多少，零延迟)
    state.x += dx;

    const totalDelta = currentX - state.startX;
    if (Math.abs(totalDelta) > 7) {
      state.moved = true;
    }

    // 滑动窗口：记录最近 70ms 的速度特征
    state.pointerHistory.push({ x: currentX, time: now });
    const cutoff = now - 70;
    state.pointerHistory = state.pointerHistory.filter(p => p.time >= cutoff);

    animate();
  });

  document.addEventListener("pointerup", finishDrag);
  document.addEventListener("pointercancel", finishDrag);

  track.addEventListener("click", event => {
    event.preventDefault();
  });

  track.addEventListener("dragstart", event => event.preventDefault());

  shell.addEventListener("wheel", event => {
    resetIdle();
    if (state.selectedIndex !== null) {
      if (event.deltaY > 15) {
        closeLightbox();
      }
      return;
    }
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    // 动力学冲量注入 (Smooth Impulse)，完美适配 Mac/触控板与传统滚轮
    const impulse = -delta * 0.38;
    state.velocity = clamp(state.velocity + impulse, -55, 55);
    animate();
  }, { passive: false });

  closeButton?.addEventListener("click", closeLightbox);
  
  // 3D Parallax Mouse Tilt on Lightbox Open
  lightbox?.addEventListener("pointermove", event => {
    if (state.selectedIndex === null || !lightboxImage) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (event.clientX - cx) / cx;
    const dy = (event.clientY - cy) / cy;
    
    const tiltX = -dy * 12;
    const tiltY = dx * 12;
    
    lightboxImage.style.transform = `translate(-50%, -50%) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
    lightboxImage.style.filter = `brightness(1.04) drop-shadow(${dx * -16}px ${dy * -16}px 38px rgba(0,0,0,0.58))`;
  });

  lightbox?.addEventListener("pointerleave", () => {
    if (lightboxImage) {
      lightboxImage.style.transform = `translate(-50%, -50%) rotateX(0deg) rotateY(0deg) scale(1)`;
      lightboxImage.style.filter = `drop-shadow(0 35px 90px rgba(0, 0, 0, 0.65))`;
    }
  });
  
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeLightbox();
  });
  window.addEventListener("resize", debounce(updateBounds, 120));
}

function finishDrag(event) {
  if (!state.dragging) return;
  if (state.pointerId !== null && event.pointerId !== state.pointerId) return;
  state.dragging = false;
  state.pointerId = null;
  stage.classList.remove("is-dragging");

  if (!state.moved && state.clickIndex !== null) {
    openItem(state.clickIndex);
    state.clickIndex = null;
    state.velocity = 0;
    return;
  }
  state.clickIndex = null;

  // 根据脱手前最后 70ms 计算真实动量 (True Moving-Average Velocity)
  const now = performance.now();
  const history = state.pointerHistory.filter(p => p.time >= now - 80);
  if (history.length >= 2) {
    const oldest = history[0];
    const newest = history[history.length - 1];
    const dt = newest.time - oldest.time;
    if (dt > 8) {
      const vx = ((newest.x - oldest.x) / dt) * 16.67;
      state.velocity = clamp(vx * 1.08, -65, 65);
    }
  } else {
    state.velocity = 0;
  }
  state.pointerHistory = [];
  animate();
}

function renderWall(source) {
  const base = source.length ? source : fallbackItems();
  state.baseLength = base.length;
  const repeated = [];
  while (repeated.length < 30) repeated.push(...base);
  items = repeated.slice(0, Math.max(30, base.length));

  if (curtainsInstance) {
    planes.forEach(plane => {
      try {
        plane.remove();
      } catch (e) {}
    });
    planes = [];
  }

  track.replaceChildren();
  state.hoverProgress = new Array(items.length).fill(0);

  items.forEach((item, index) => {
    const card = document.createElement("button");
    card.className = "photo-wall-card";
    card.type = "button";
    card.dataset.index = String(index);
    card.ariaLabel = item.title || `Photo ${index + 1}`;
    card.draggable = false;

    const image = document.createElement("img");
    image.src = item.thumbUrl || item.imageUrl;
    image.alt = item.title || "";
    image.dataset.sampler = "photoTexture";
    image.decoding = "async";
    image.loading = index < 12 ? "eager" : "lazy";
    image.draggable = false;
    card.append(image);

    card.addEventListener("mouseenter", () => {
      resetIdle();
      if (state.selectedIndex !== null) return;
      state.hoveredIndex = index;
      setActive(index);
      animate();
    });
    card.addEventListener("mouseleave", () => {
      resetIdle();
      if (state.selectedIndex !== null) return;
      if (state.hoveredIndex === index) {
        state.hoveredIndex = null;
      }
      animate();
    });
    card.addEventListener("focus", () => {
      resetIdle();
      if (state.selectedIndex !== null) return;
      state.hoveredIndex = index;
      setActive(index);
      animate();
    });
    card.addEventListener("blur", () => {
      resetIdle();
      if (state.selectedIndex !== null) return;
      if (state.hoveredIndex === index) {
        state.hoveredIndex = null;
      }
      animate();
    });
    track.append(card);
  });

  updateBounds();

  if (curtainsInstance && window.Curtains) {
    const cards = [...track.children];
    cards.forEach((card, index) => {
      const image = card.querySelector("img");
      const planeParams = {
        vertexShader: vsSource,
        fragmentShader: fsSource,
        widthSegments: 24,
        heightSegments: 24,
        uniforms: {
          uVelocity: { name: "uVelocity", type: "1f", value: 0 },
          uHoverProgress: { name: "uHoverProgress", type: "1f", value: 0 },
          uExpandProgress: { name: "uExpandProgress", type: "1f", value: 0 },
          uProximity: { name: "uProximity", type: "1f", value: 0 },
          uTime: { name: "uTime", type: "1f", value: 0 }
        }
      };

      const plane = new window.Plane(curtainsInstance, card, planeParams);
      plane.onReady(() => {
        image.style.opacity = "0";
      }).onRender(() => {
        plane.uniforms.uTime.value += 1.0;
        
        const hp = state.hoverProgress[index] || 0;
        const ep = (index === state.selectedIndex) ? state.expandProgress : 0;
        
        plane.uniforms.uHoverProgress.value = hp;
        plane.uniforms.uExpandProgress.value = ep;
        plane.uniforms.uVelocity.value = state.fluidVelocity;
        
        // Zero-Reflow Proximity Calculation (利用纯缓存静态坐标计算聚光灯)
        const left = card._offsetLeft !== undefined ? card._offsetLeft : card.offsetLeft;
        const width = state.cardWidth;
        const cardCenter = left + width * 0.5;
        const worldX = cardCenter + state.x;
        const C = state.stageCenter;
        const T = state.T || 1;
        const offset = ((worldX - C + T * 0.5) % T + T) % T - T * 0.5;
        const distance = Math.abs(offset);
        const maxDist = Math.max(1, state.stageWidth * 0.55);
        const proximity = Math.max(0, 1 - distance / maxDist);
        
        plane.uniforms.uProximity.value = proximity;
      });

      planes.push(plane);
    });
  }

  setActive(0);
  requestAnimationFrame(() => {
    state.x = 0;
    updateBounds();
    animate();
  });
}

function animate() {
  if (state.raf) return;
  const frame = () => {
    state.raf = 0;
    const now = performance.now();
    const previous = state.lastFrameTime || now;
    const dt = clamp((now - previous) / 16.67, 0.4, 2.0);
    state.lastFrameTime = now;

    const isIdle = (now - state.lastInteractionTime > 2200) && state.selectedIndex === null && !state.dragging;

    if (state.dragging) {
      // 拖拽时：直接 1:1 跟随手指，无额外滞后
    } else {
      if (isIdle && Math.abs(state.velocity) < 0.25) {
        // 静止慢速自动巡航 (Conveyor Loop)
        state.velocity = -0.45;
      }

      // 1. 半隐式欧拉单积分位移更新
      state.x += state.velocity * dt;

      // 2. 流体粘滞阻尼衰减 (Viscous Hydrodynamic Friction)
      const friction = Math.pow(0.962, dt);
      state.velocity *= friction;

      // 3. 临界阻尼磁吸回正系统 (Critically Damped Magnetic Spring, 无冲击震荡)
      if (Math.abs(state.velocity) < 1.6 && !isIdle && state.selectedIndex === null) {
        const nearestOffset = getClosestCardCenterOffset();
        if (Math.abs(nearestOffset) > 0.15) {
          const k = 0.0064; // 劲度系数
          const c = 0.16;   // 阻尼系数 c = 2 * sqrt(k) = 0.16 (临界阻尼)
          const springAcc = -nearestOffset * k - state.velocity * c;
          state.velocity += springAcc * dt;
        } else if (Math.abs(state.velocity) < 0.04) {
          state.x -= nearestOffset;
          state.velocity = 0;
        }
      }
    }

    // 4. 流体速度平滑滤波 (给 WebGL Shader 表面张力水波弯曲)
    state.fluidVelocity += (state.velocity - state.fluidVelocity) * (1 - Math.pow(0.82, dt));

    // 5. 周期性无限连续折叠 (Seamless Periodic Boundary)
    if (state.T > 0) {
      state.x = ((state.x % state.T) + state.T) % state.T;
    }

    // 6. 从物理中心更新高亮焦点卡片
    updateActiveFromCenter();

    // 7. 展开大图进度插值
    const targetExpand = (state.selectedIndex !== null) ? 1 : 0;
    state.expandProgress += (targetExpand - state.expandProgress) * (1 - Math.pow(0.86, dt));
    const globalEp = state.expandProgress;

    let hasActiveMotion = Math.abs(state.velocity) > 0.02 || Math.abs(globalEp - targetExpand) > 0.001;

    // 8. 纯 GPU Transform 渲染卡片 (零 getComputedStyle 调用)
    const cards = track.children;
    const count = cards.length;
    const C = state.stageCenter;
    const T = state.T;
    const cardWidth = state.cardWidth;

    for (let index = 0; index < count; index++) {
      const card = cards[index];
      const isSelected = (index === state.selectedIndex);
      const isHovered = (index === state.hoveredIndex);
      const targetHover = isHovered ? 1 : 0;

      state.hoverProgress[index] = state.hoverProgress[index] || 0;
      state.hoverProgress[index] += (targetHover - state.hoverProgress[index]) * (1 - Math.pow(0.84, dt));
      if (Math.abs(state.hoverProgress[index] - targetHover) > 0.001) hasActiveMotion = true;

      const hp = state.hoverProgress[index];
      const ep = isSelected ? globalEp : 0;

      const cardCenter = (card._offsetLeft !== undefined ? card._offsetLeft : card.offsetLeft) + cardWidth * 0.5;
      const worldX = cardCenter + state.x;

      const offset = ((worldX - C + T * 0.5) % T + T) % T - T * 0.5;
      const distance = Math.abs(offset);

      const maxDistance = state.stageWidth * 0.55;
      const proximity = Math.max(0, 1 - distance / Math.max(1, maxDistance));

      const sideOfCenter = offset < 0 ? -1 : 1;
      const absSpeed = Math.abs(state.fluidVelocity);
      const speedFactor = easeOutCubic(Math.min(absSpeed / 45, 1));

      // 仿生空间曲率柱面 (即便在完全静止时也维持深邃的优雅弧形微弯曲)
      const baseRotateY = -sideOfCenter * (1 - proximity) * 16;
      const baseDepth = (proximity * 75 - (1 - proximity) * 85);
      const baseScale = 0.94 + proximity * 0.06;

      // 流体动压形变 (随速度平滑浮动)
      const motionDepth = speedFactor * (proximity * 160 - (1 - proximity) * 100);
      const motionRotateY = -sideOfCenter * (1 - proximity) * 20 * speedFactor;
      const motionScale = speedFactor * (proximity * 0.08 - (1 - proximity) * 0.06);
      const motionFloat = speedFactor * (proximity * -16 + (1 - proximity) * 10);
      const motionLag = clamp(state.fluidVelocity * 0.045, -12, 12) * (1 - proximity * 0.4);

      const rotateY = (baseRotateY + motionRotateY) * (1 - hp * 0.15) * (1 - globalEp);
      const rotateX = -speedFactor * proximity * 3.5 * (1 - globalEp);
      const rotateZ = clamp(state.fluidVelocity * 0.02, -2.5, 2.5) * (1 - globalEp);

      let scaleX = baseScale + motionScale;
      let scaleY = scaleX;

      if (isSelected) {
        const aspect = card._aspect || (16 / 9);
        const maxTargetW = state.stageWidth * 0.94;
        const maxTargetH = window.innerHeight * 0.94;
        let targetW, targetH;
        if (aspect > maxTargetW / maxTargetH) {
          targetW = maxTargetW;
          targetH = maxTargetW / aspect;
        } else {
          targetH = maxTargetH;
          targetW = maxTargetH * aspect;
        }
        const cardH = card.offsetHeight || 450;
        const targetScaleX = targetW / cardWidth;
        const targetScaleY = targetH / cardH;
        scaleX = lerp(scaleX, targetScaleX, globalEp);
        scaleY = lerp(scaleY, targetScaleY, globalEp);
      }

      const depth = (baseDepth + motionDepth + hp * 18) * (1 - globalEp) + ep * 320;
      const float = motionFloat * (1 - globalEp) + ep * -12;
      const lag = motionLag * (1 - globalEp);

      let push = 0;
      if (state.selectedIndex !== null && !isSelected) {
        push = (offset < 0 ? -1 : 1) * state.stageWidth * 0.85 * globalEp;
      }

      const tx = C + (isSelected ? offset * (1 - globalEp) : (offset + push + lag)) - cardCenter;

      card.style.transformOrigin = "center center";
      card.style.transform = `translate3d(${tx.toFixed(2)}px, ${float.toFixed(2)}px, ${depth.toFixed(2)}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) rotate(${rotateZ.toFixed(2)}deg) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;

      // 柔和浮动阴影
      const shadowBlur = Math.round(16 + proximity * 24 + hp * 32 + ep * 40);
      const shadowOpacity = 0.2 + proximity * 0.22 + hp * 0.24 + ep * 0.26;
      const shadowX = Math.round(-sideOfCenter * (1 - proximity) * 10 * (1 - hp) * (1 - globalEp));
      const shadowY = Math.round(12 + proximity * 18 + hp * 22 + ep * 20);
      card.style.filter = `drop-shadow(${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity.toFixed(2)}))`;

      const baseZIndex = 100 - Math.round(Math.abs(index - state.active));
      card.style.zIndex = isSelected ? "1000" : String(baseZIndex);
      card.style.opacity = isSelected ? "1" : String(1 - globalEp);

      const cardLeftInView = C + offset - cardWidth * 0.5;
      const cardRightInView = C + offset + cardWidth * 0.5;
      card._isVisible = (cardRightInView >= -80) && (cardLeftInView <= state.stageWidth + 80);
    }

    if (curtainsInstance) {
      for (let i = 0; i < planes.length; i++) {
        if (i === state.selectedIndex || cards[i]?._isVisible) {
          planes[i].updatePosition();
        }
      }
    }

    const settled = !hasActiveMotion && !state.dragging && state.selectedIndex === null;
    if (!settled || isIdle) {
      state.raf = requestAnimationFrame(frame);
    }
  };
  state.raf = requestAnimationFrame(frame);
}

function updateBounds() {
  if (!stage || !track) return;
  state.stageWidth = stage.clientWidth || window.innerWidth;
  state.stageCenter = state.stageWidth * 0.5;

  const cards = [...track.children];
  if (!cards.length) return;

  const style = window.getComputedStyle(track);
  state.gap = parseFloat(style.gap) || 8;
  state.cardWidth = cards[0].offsetWidth || 110;
  state.T = items.length * (state.cardWidth + state.gap);

  cards.forEach(card => {
    card._offsetLeft = card.offsetLeft;
    card._offsetWidth = card.offsetWidth;
    const img = card.querySelector("img");
    if (img && img.naturalWidth && img.naturalHeight) {
      card._aspect = img.naturalWidth / img.naturalHeight;
    }
  });
}

function getClosestCardCenterOffset() {
  const cards = track.children;
  const count = cards.length;
  if (!count || !state.T) return 0;

  const C = state.stageCenter;
  const T = state.T;
  const cardWidth = state.cardWidth;

  let minDistance = Infinity;
  let closestOffset = 0;

  for (let i = 0; i < count; i++) {
    const cardCenter = (cards[i]._offsetLeft !== undefined ? cards[i]._offsetLeft : cards[i].offsetLeft) + cardWidth * 0.5;
    const worldX = cardCenter + state.x;
    const offset = ((worldX - C + T * 0.5) % T + T) % T - T * 0.5;
    const distance = Math.abs(offset);
    if (distance < minDistance) {
      minDistance = distance;
      closestOffset = offset;
    }
  }
  return closestOffset;
}

function updateActiveFromCenter() {
  const cards = track.children;
  const count = cards.length;
  if (!count || !state.T) return;

  const C = state.stageCenter;
  const T = state.T;
  const cardWidth = state.cardWidth;

  let minDistance = Infinity;
  let nextActive = 0;

  for (let i = 0; i < count; i++) {
    const cardCenter = (cards[i]._offsetLeft !== undefined ? cards[i]._offsetLeft : cards[i].offsetLeft) + cardWidth * 0.5;
    const worldX = cardCenter + state.x;
    const offset = ((worldX - C + T * 0.5) % T + T) % T - T * 0.5;
    const distance = Math.abs(offset);
    if (distance < minDistance) {
      minDistance = distance;
      nextActive = i;
    }
  }

  if (nextActive !== state.active) {
    setActive(nextActive);
  }
}

function setActive(index) {
  state.active = index;
  const item = items[index];
  [...track.children].forEach((card, cardIndex) => {
    card.classList.toggle("is-active", cardIndex === index);
  });

  const currentNum = (index % state.baseLength) + 1;
  if (activeIndex) activeIndex.textContent = String(currentNum).padStart(2, "0");
  if (totalCount) totalCount.textContent = String(state.baseLength).padStart(2, "0");
  if (activeTitle && item) activeTitle.textContent = item.title || "NSY Gallery";

  const bgImage = document.querySelector("[data-photo-wall-bg-image]");
  if (bgImage && item) {
    const url = item.imageUrl || item.thumbUrl;
    bgImage.style.backgroundImage = `url('${url}')`;
  }
}

function openItem(index) {
  const item = items[index];
  if (!item) return;
  state.selectedIndex = index;

  const bgTitle = document.querySelector("[data-photo-wall-bg-title]");
  if (bgTitle) {
    bgTitle.textContent = item.title || "";
  }
  stage.classList.add("has-selected");

  if (lightboxTitle) lightboxTitle.textContent = item.title || "PHOTO";
  if (lightboxDesc) {
    lightboxDesc.textContent = item.description || "";
    const wrap = lightboxDesc.closest(".photo-wall-reveal-wrap");
    if (wrap) wrap.style.display = item.description ? "block" : "none";
  }
  if (lightboxLink) {
    lightboxLink.href = item.linkUrl || "/gallery.html";
    lightboxLink.textContent = item.linkText || "OPEN";
    const wrap = lightboxLink.closest(".photo-wall-reveal-wrap");
    if (wrap) wrap.style.display = item.linkUrl ? "block" : "none";
  }
  if (lightbox) {
    lightbox.hidden = false;
    if (lightboxImage) {
      lightboxImage.src = item.imageUrl || item.thumbUrl;
      lightboxImage.style.display = "block";
    }
    requestAnimationFrame(() => {
      lightbox.classList.add("is-active");
    });
  }

  // 平滑滑移选中卡片到屏幕中心
  const cards = track.children;
  if (cards.length) {
    const cardCenter = (cards[index]._offsetLeft !== undefined ? cards[index]._offsetLeft : cards[index].offsetLeft) + state.cardWidth * 0.5;
    const worldX = cardCenter + state.x;
    const offset = ((worldX - state.stageCenter + state.T * 0.5) % state.T + state.T) % state.T - state.T * 0.5;
    state.x -= offset;
  }

  animate();
}

function closeLightbox() {
  state.selectedIndex = null;
  stage.classList.remove("has-selected");
  if (lightbox) {
    lightbox.classList.remove("is-active");
    if (lightboxImage) {
      lightboxImage.style.transform = "";
      lightboxImage.style.filter = "";
    }
    setTimeout(() => {
      if (state.selectedIndex === null) {
        lightbox.hidden = true;
        if (lightboxImage) {
          lightboxImage.style.display = "none";
        }
      }
    }, 820);
  }
  animate();
}

function fallbackItems() {
  return [
    { title: "Gallery 01", description: "Creative interactive design direction and high-end WebGL frontend development.", imageUrl: "/2.jpg", linkUrl: "/gallery.html", linkText: "EXPLORE" },
    { title: "Gallery 02", description: "Immersive visual experiences, real-time graphics, and custom shaders.", imageUrl: "/3.jpg", linkUrl: "/gallery.html", linkText: "EXPLORE" },
    { title: "Gallery 03", description: "Sleek user interface designs, buttery smooth layout transitions, and micro-animations.", imageUrl: "/4.jpg", linkUrl: "/gallery.html", linkText: "EXPLORE" },
    { title: "Gallery 04", description: "Dynamic color mapping, premium dark mode styling, and modern glassmorphism.", imageUrl: "/5.jpg", linkUrl: "/gallery.html", linkText: "EXPLORE" },
    { title: "Gallery 05", description: "Audio visualization, custom media players, and high-performance streaming integrations.", imageUrl: "/6.jpg", linkUrl: "/gallery.html", linkText: "EXPLORE" },
    { title: "Assistant", description: "Tiancaimao Live Streaming Operational Assistant and dashboard.", imageUrl: "/assistant-preview.jpg", linkUrl: "/download.html", linkText: "GET APP" },
    { title: "Datacenter", description: "Real-time live streaming statistics analyzer with high-precision OCR.", imageUrl: "/datacenter-preview.jpg", linkUrl: "/download.html", linkText: "GET APP" },
    { title: "App", description: "Cross-platform workspace management client built for creators.", imageUrl: "/app-preview.png", linkUrl: "/download.html", linkText: "GET APP" }
  ];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

function easeOutCubic(value) {
  const t = clamp(value, 0, 1);
  return 1 - Math.pow(1 - t, 3);
}

function debounce(fn, delay = 120) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}
