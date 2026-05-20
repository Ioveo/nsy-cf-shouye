const shell = document.querySelector("[data-photo-wall]");
const stage = document.querySelector(".photo-wall-stage");
const track = document.querySelector("[data-photo-wall-track]");
const activeIndex = document.querySelector("[data-photo-wall-index]");
const totalCount = document.querySelector("[data-photo-wall-total]");
const activeTitle = document.querySelector("[data-photo-wall-title]");
const lightbox = document.querySelector("[data-photo-wall-lightbox]");
const lightboxTitle = document.querySelector("[data-photo-wall-lightbox-title]");
const lightboxLink = document.querySelector("[data-photo-wall-lightbox-link]");
const closeButton = document.querySelector("[data-photo-wall-close]");

const vsSource = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  attribute vec3 aVertexPosition;
  attribute vec2 aTextureCoord;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

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
    float velocityEffect = uVelocity * 0.007;
    
    // Liquid bend
    float zDistortion = curve * velocityEffect * 110.0 * (1.0 - uExpandProgress);
    position.z += zDistortion;
    
    float xDistortion = curve * velocityEffect * 0.12 * (1.0 - uExpandProgress);
    position.x -= xDistortion;
    
    // Hover high-frequency ripple
    float ripple = sin(length(position.xy) * 8.0 - uTime * 0.05) * 0.016 * uHoverProgress * (1.0 - uExpandProgress);
    position.z += ripple * 35.0;
    
    // Expand bounce wave
    float expandWave = sin(length(position.xy) * 4.0 - uExpandProgress * 6.0) * 0.038 * uExpandProgress * (1.0 - uExpandProgress);
    position.z += expandWave * 90.0;

    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(position, 1.0);
    
    vTextureCoord = aTextureCoord;
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

  float getGrayscale(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
  }

  void main() {
    vec2 uv = vTextureCoord;
    
    // Chromatic Aberration (RGB shift based on movement distortion)
    float shift = vDistortion * 0.08;
    
    vec4 colorRed = texture2D(photoTexture, uv + vec2(shift, 0.0));
    vec4 colorGreen = texture2D(photoTexture, uv);
    vec4 colorBlue = texture2D(photoTexture, uv - vec2(shift, 0.0));
    
    vec3 rgbColor = vec3(colorRed.r, colorGreen.g, colorBlue.b);
    float gray = getGrayscale(rgbColor);
    
    float hp = uHoverProgress;
    float ep = uExpandProgress;
    
    // Blending filters
    float targetGrayscale = 1.0 - 0.88 * hp - 0.12 * ep;
    float targetBrightness = 0.48 + 0.48 * hp + 0.52 * ep;
    float targetContrast = 1.15 - 0.11 * hp - 0.15 * ep;
    
    vec3 finalColor = mix(rgbColor, vec3(gray), targetGrayscale);
    finalColor *= targetBrightness;
    finalColor = (finalColor - 0.5) * targetContrast + 0.5;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

let items = [];
const state = {
  active: 0,
  current: 0,
  target: 0,
  velocity: 0,
  dragging: false,
  startX: 0,
  startTarget: 0,
  lastDelta: 0,
  lastTime: 0,
  moved: false,
  pointerId: null,
  clickIndex: null,
  wavePower: 0,
  raf: 0,
  hoveredIndex: null,
  hoverProgress: [],
  selectedIndex: null,
  expandProgress: 0,
  stageWidth: 0,
  baseLength: 8
};

let curtainsInstance = null;
let planes = [];

init();

async function init() {
  if (!shell || !stage || !track) return;

  // Initialize Curtains WebGL
  try {
    if (typeof window.curtains !== "undefined") {
      curtainsInstance = new window.curtains.Curtains({
        container: "photo-wall-canvas",
        pixelRatio: Math.min(1.5, window.devicePixelRatio),
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

function bindEvents() {
  stage.addEventListener("pointerdown", event => {
    if (state.selectedIndex !== null) {
      // Close if clicking outside the selected card
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
    state.startTarget = state.target;
    state.lastDelta = 0;
    state.lastTime = performance.now();
    state.moved = false;
    stage.classList.add("is-dragging");
    stage.setPointerCapture?.(event.pointerId);
    animate();
  });

  document.addEventListener("pointermove", event => {
    if (!state.dragging) return;
    event.preventDefault();
    const delta = event.clientX - state.startX;
    const now = performance.now();
    const elapsed = Math.max(8, now - state.lastTime);
    const frameVelocity = ((delta - state.lastDelta) / elapsed) * 16.67;
    state.velocity = lerp(state.velocity, frameVelocity, 0.38);
    state.wavePower = lerp(state.wavePower, frameVelocity, 0.42);
    state.lastTime = now;
    state.lastDelta = delta;
    state.target = state.startTarget + delta;
    state.moved = state.moved || Math.abs(delta) > 8;
    updateActiveFromCenter();
  });

  document.addEventListener("pointerup", finishDrag);
  document.addEventListener("pointercancel", finishDrag);

  track.addEventListener("click", event => {
    event.preventDefault();
  });

  track.addEventListener("dragstart", event => event.preventDefault());

  shell.addEventListener("wheel", event => {
    if (state.selectedIndex !== null) return;
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const push = -delta * 0.85;
    state.velocity += push * 0.15;
    state.wavePower += push * 0.35;
    state.target += push;
    updateActiveFromCenter();
    animate();
  }, { passive: false });

  closeButton?.addEventListener("click", closeLightbox);
  
  // Back key also closes the lightbox
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
    state.wavePower = 0;
    return;
  }
  state.clickIndex = null;
  state.target = state.target + state.velocity * 12;
  state.velocity *= 0.82;
  state.wavePower = state.velocity;
  animate();
}

function renderWall(source) {
  const base = source.length ? source : fallbackItems();
  state.baseLength = base.length;
  const repeated = [];
  while (repeated.length < 30) repeated.push(...base);
  items = repeated.slice(0, Math.max(30, base.length));

  // Clean old WebGL planes
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
    image.dataset.sampler = "photoTexture"; // match WebGL shader sampler uniform name
    image.decoding = "async";
    image.loading = index < 12 ? "eager" : "lazy";
    image.draggable = false;
    card.append(image);

    card.addEventListener("mouseenter", () => {
      if (state.selectedIndex !== null) return;
      state.hoveredIndex = index;
      setActive(index);
      animate();
    });
    card.addEventListener("mouseleave", () => {
      if (state.selectedIndex !== null) return;
      if (state.hoveredIndex === index) {
        state.hoveredIndex = null;
      }
      animate();
    });
    card.addEventListener("focus", () => {
      if (state.selectedIndex !== null) return;
      state.hoveredIndex = index;
      setActive(index);
      animate();
    });
    card.addEventListener("blur", () => {
      if (state.selectedIndex !== null) return;
      if (state.hoveredIndex === index) {
        state.hoveredIndex = null;
      }
      animate();
    });
    track.append(card);
  });

  // Compile WebGL planes once DOM cards are appended
  if (curtainsInstance && window.curtains) {
    const cards = [...track.children];
    cards.forEach((card, index) => {
      const image = card.querySelector("img");
      const planeParams = {
        vertexShader: vsSource,
        fragmentShader: fsSource,
        widthSegments: 20,
        heightSegments: 20,
        uniforms: {
          uVelocity: { name: "uVelocity", type: "1f", value: 0 },
          uHoverProgress: { name: "uHoverProgress", type: "1f", value: 0 },
          uExpandProgress: { name: "uExpandProgress", type: "1f", value: 0 },
          uTime: { name: "uTime", type: "1f", value: 0 }
        }
      };

      const plane = new window.curtains.Plane(curtainsInstance, card, planeParams);
      plane.onReady(() => {
        // Smoothly hide the original HTML img when WebGL renderer compiles successfully
        image.style.opacity = "0";
      }).onRender(() => {
        plane.uniforms.uTime.value += 1.0;
        
        const hp = state.hoverProgress[index] || 0;
        const ep = (index === state.selectedIndex) ? state.expandProgress : 0;
        
        plane.uniforms.uHoverProgress.value = hp;
        plane.uniforms.uExpandProgress.value = ep;
        
        // Pass drag velocity wave intensity
        plane.uniforms.uVelocity.value = state.wavePower;
      });

      planes.push(plane);
    });
  }

  setActive(0);
  requestAnimationFrame(() => {
    state.current = 0;
    state.target = 0;
    updateBounds();
    animate();
  });
}

function animate() {
  if (state.raf) return;
  const frame = () => {
    state.raf = 0;
    const ease = state.dragging ? 0.22 : 0.075;
    state.current += (state.target - state.current) * ease;

    if (!state.dragging) {
      state.target += state.velocity;
      state.velocity *= 0.95;
    }
    state.wavePower *= 0.92;

    const cards = [...track.children];
    if (!cards.length) return;

    const cardWidth = cards[0]._offsetWidth || 110;
    const gap = parseFloat(window.getComputedStyle(track).gap) || 20;
    const T = items.length * (cardWidth + gap);

    // Seamless wrapping
    if (T > 0 && Math.abs(state.current) > T) {
      const shift = Math.trunc(state.current / T) * T;
      state.current -= shift;
      state.target -= shift;
    }

    const C = state.stageWidth / 2;

    // Handle expand progress
    const targetExpand = (state.selectedIndex !== null) ? 1 : 0;
    state.expandProgress = lerp(state.expandProgress, targetExpand, 0.09);
    const globalEp = state.expandProgress;

    let hasActiveHover = false;
    if (Math.abs(globalEp - targetExpand) > 0.001) {
      hasActiveHover = true;
    }

    // 1. Update Hover Progresses
    cards.forEach((card, index) => {
      const isHovered = (index === state.hoveredIndex);
      const targetHover = isHovered ? 1 : 0;
      if (state.hoverProgress[index] === undefined) {
        state.hoverProgress[index] = 0;
      }
      state.hoverProgress[index] = lerp(state.hoverProgress[index], targetHover, 0.12);
      if (Math.abs(state.hoverProgress[index] - targetHover) > 0.001) {
        hasActiveHover = true;
      }
    });

    // 2. Render Cards in 3D Cylinder & Handle Centering/Expand
    cards.forEach((card, index) => {
      const isSelected = (index === state.selectedIndex);
      const cardCenter = card._offsetLeft + cardWidth / 2;
      const x = cardCenter + state.current;

      // Wrapped offset from stage center
      const offset = ((x - C + T/2) % T + T) % T - T/2;
      const distance = Math.abs(offset);

      // Proximity to viewport center (ranges 0 to 1)
      const proximity = Math.max(0, 1 - distance / Math.max(1, state.stageWidth * 0.6));

      const speed = Math.min(Math.abs(state.wavePower), 180);
      const motion = Math.min(speed / 110, 1);
      const hp = state.hoverProgress[index] || 0;
      const ep = isSelected ? globalEp : 0;

      const sideOfCenter = offset < 0 ? -1 : 1;
      const direction = state.wavePower < 0 ? -1 : 1;
      const phase = index * 0.48 + state.current * 0.01;

      // --- 3D Curve Base Layout (Static Cylinder) ---
      const baseRotateY = -sideOfCenter * (1 - proximity) * 42;
      const baseDepth = (proximity * 160) - 100;
      const baseScale = 0.88 + proximity * 0.14;
      const baseFloat = proximity * -18;

      // --- Dynamic Motion Layout (Scroll/Drag) ---
      const motionFold = motion * (22 + proximity * 34 + Math.min(speed * 0.06, 12));
      const motionRotateY = -sideOfCenter * direction * motionFold;
      const motionRotateX = -motion * proximity * (4 + speed * 0.012);
      const motionRotateZ = clamp(Math.sin(phase) * motion * 2.2, -3.5, 3.5);

      const motionLag = clamp(state.wavePower * 0.09, -24, 24) * (1 - proximity * 0.35);
      const motionFloat = -motion * proximity * (12 + speed * 0.04);
      const motionDepth = motion * proximity * (80 + speed * 0.25);
      const motionScale = motion * proximity * 0.04;

      // --- Blend Base, Motion, Hover, and Expand ---
      const rotateY = (baseRotateY + motionRotateY) * (1 - hp) * (1 - globalEp);
      const rotateX = motionRotateX * (1 - hp) * (1 - globalEp);
      const rotateZ = motionRotateZ * (1 - hp) * (1 - globalEp);

      const hoverScale = hp * 0.26;
      const expandScale = ep * 2.45;
      const neighborScale = (1 - isSelected) * globalEp * -0.22;
      const scale = (baseScale + motionScale) * (1 - hp) * (1 - globalEp) + hoverScale * (1 - globalEp) + expandScale + neighborScale;

      const hoverDepth = hp * 220;
      const expandDepth = ep * 320;
      const neighborDepth = (1 - isSelected) * globalEp * -150;
      const depth = (baseDepth + motionDepth) * (1 - hp) * (1 - globalEp) + hoverDepth * (1 - globalEp) + expandDepth + neighborDepth;

      const hoverFloat = -hp * 36;
      const expandFloat = ep * -12;
      const float = (baseFloat + motionFloat) * (1 - hp) * (1 - globalEp) + hoverFloat * (1 - globalEp) + expandFloat;

      const lag = motionLag * (1 - globalEp);

      // --- Pushing Neighbors ---
      let push = 0;
      if (state.selectedIndex !== null && !isSelected) {
        const pushDirection = offset < 0 ? -1 : 1;
        push = pushDirection * state.stageWidth * 0.42 * globalEp;
      }

      // --- Center alignment ---
      const targetCenterOffset = isSelected ? offset * (1 - globalEp) : (offset + push + lag);
      const tx = C + targetCenterOffset - cardCenter;

      card.style.transformOrigin = "center center";
      card.style.transform = `translate3d(${tx}px, ${float}px, ${depth}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotate(${rotateZ}deg) scale(${scale})`;

      // --- Soft Floating Shadows ---
      card.style.boxShadow = "none";
      const shadowBlur = Math.round(18 + proximity * 24 + hp * 36 + ep * 40);
      const shadowOpacity = 0.22 + proximity * 0.22 + hp * 0.26 + ep * 0.28;
      const shadowX = Math.round(-sideOfCenter * (1 - proximity) * 12 * (1 - hp) * (1 - globalEp));
      const shadowY = Math.round(14 + proximity * 20 + hp * 28 + ep * 20);

      // WebGL handles filters internally in Fragment Shader, but we keep CSS box shadow and filters as fallback if WebGL is missing
      if (!curtainsInstance) {
        const grayscale = 1.0 - 0.88 * hp - 0.12 * ep;
        const brightness = 0.48 + 0.48 * hp + 0.52 * ep;
        const contrast = 1.15 - 0.11 * hp - 0.15 * ep;
        card.style.filter = `grayscale(${grayscale}) brightness(${brightness}) contrast(${contrast}) drop-shadow(${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`;
      } else {
        card.style.filter = `drop-shadow(${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`;
      }

      // --- Smooth Z-Indexing ---
      const baseZIndex = 100 - Math.round(Math.abs(index - state.active));
      card.style.zIndex = isSelected ? "1000" : String(baseZIndex);

      // --- Opacity ---
      const opacity = isSelected ? 1 : 1 - 0.82 * globalEp;
      card.style.opacity = String(opacity);
    });

    // Force curtains.js planes to update positions aligned with DOM cards
    if (curtainsInstance) {
      planes.forEach(plane => {
        plane.updatePosition();
      });
    }

    const settled = Math.abs(state.target - state.current) < 0.35 && 
                    Math.abs(state.velocity) < 0.06 && 
                    Math.abs(state.wavePower) < 0.06 && 
                    !hasActiveHover;
                    
    if (!settled || state.dragging) {
      state.raf = requestAnimationFrame(frame);
    }
  };
  state.raf = requestAnimationFrame(frame);
}

function updateBounds() {
  if (!stage || !track) return;
  state.stageWidth = stage.clientWidth;

  const cards = [...track.children];
  if (!cards.length) return;

  cards.forEach(card => {
    card._offsetLeft = card.offsetLeft;
    card._offsetWidth = card.offsetWidth;
  });
}

function updateActiveFromCenter() {
  if (!state.stageWidth) return;
  const C = state.stageWidth / 2;
  const cards = [...track.children];
  if (!cards.length) return;
  const cardWidth = cards[0]._offsetWidth || 110;
  const gap = parseFloat(window.getComputedStyle(track).gap) || 20;
  const T = items.length * (cardWidth + gap);

  let nextActive = 0;
  let minDistance = Infinity;

  cards.forEach((card, index) => {
    const cardCenter = card._offsetLeft + cardWidth / 2;
    const x = cardCenter + state.current;
    const offset = ((x - C + T/2) % T + T) % T - T/2;
    const distance = Math.abs(offset);
    if (distance < minDistance) {
      minDistance = distance;
      nextActive = index;
    }
  });

  setActive(nextActive);
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
  if (lightboxLink) {
    lightboxLink.href = item.linkUrl || "/gallery.html";
    lightboxLink.textContent = item.linkText || "OPEN";
    lightboxLink.hidden = !item.linkUrl;
  }
  if (lightbox) {
    lightbox.hidden = false;
  }

  // Scroll the selected card to center
  const cards = [...track.children];
  if (cards.length) {
    const cardWidth = cards[0]._offsetWidth || 110;
    const gap = parseFloat(window.getComputedStyle(track).gap) || 20;
    const T = items.length * (cardWidth + gap);
    const C = state.stageWidth / 2;
    const cardCenter = cards[index]._offsetLeft + cardWidth / 2;
    const x = cardCenter + state.target;
    const offset = ((x - C + T/2) % T + T) % T - T/2;
    state.target -= offset;
  }

  animate();
}

function closeLightbox() {
  state.selectedIndex = null;
  stage.classList.remove("has-selected");
  if (lightbox) {
    lightbox.hidden = true;
  }
  animate();
}

function fallbackItems() {
  return [
    { title: "Gallery 01", imageUrl: "/2.jpg" },
    { title: "Gallery 02", imageUrl: "/3.jpg" },
    { title: "Gallery 03", imageUrl: "/4.jpg" },
    { title: "Gallery 04", imageUrl: "/5.jpg" },
    { title: "Gallery 05", imageUrl: "/6.jpg" },
    { title: "Assistant", imageUrl: "/assistant-preview.jpg" },
    { title: "Datacenter", imageUrl: "/datacenter-preview.jpg" },
    { title: "App", imageUrl: "/app-preview.png" }
  ];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Cubic bezier or spring interpolation
function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

function debounce(fn, delay = 120) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}
