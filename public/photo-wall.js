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
    float velocityEffect = uVelocity * 0.007;
    
    // Liquid bend
    float zDistortion = curve * velocityEffect * 110.0 * (1.0 - uExpandProgress);
    position.z += zDistortion;
    
    float xDistortion = curve * velocityEffect * 0.12 * (1.0 - uExpandProgress);
    position.x -= xDistortion;
    
    // Hover high-frequency ripple
    float ripple = sin(length(position.xy) * 8.0 - uTime * 0.05) * 0.016 * uHoverProgress * (1.0 - uExpandProgress);
    position.z += ripple * 35.0;
    
    // WebGL Liquid Radial Ripple Transition (Aristide Benoist Inspired)
    // Dynamic glass-water ripple splash when opening or closing
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
  uniform float uProximity; // dynamic center spotlight proximity uniform

  float getGrayscale(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
  }

  void main() {
    vec2 uv = vTextureCoord;
    
    // Liquid texture UV refraction based on wave distortion
    uv.x += sin(uv.y * 14.0 + vDistortion * 8.0) * vDistortion * 0.05;
    uv.y += cos(uv.x * 14.0 + vDistortion * 8.0) * vDistortion * 0.05;
    
    // Chromatic Aberration (RGB shift based on movement distortion)
    float shift = vDistortion * 0.12;
    
    vec4 colorRed = texture2D(photoTexture, uv + vec2(shift, 0.0));
    vec4 colorGreen = texture2D(photoTexture, uv);
    vec4 colorBlue = texture2D(photoTexture, uv - vec2(shift, 0.0));
    
    vec3 rgbColor = vec3(colorRed.r, colorGreen.g, colorBlue.b);
    float gray = getGrayscale(rgbColor);
    
    float hp = uHoverProgress;
    float ep = uExpandProgress;
    float up = uProximity;
    
    // Spotlight ambient lighting: active/centered cards are beautifully lit up, side cards fade to elegant dim darkness
    float spotlight = 0.28 + 0.72 * up;
    
    // Grayscale blend: center is fully colorful, flat sides are elegant monochrome grayscale
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
  lastFrameTime: 0,
  moved: false,
  pointerId: null,
  clickIndex: null,
  wavePower: 0,
  waveTarget: 0,
  raf: 0,
  hoveredIndex: null,
  hoverProgress: [],
  selectedIndex: null,
  expandProgress: 0,
  stageWidth: 0,
  baseLength: 8,
  lastInteractionTime: performance.now()
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
        pixelRatio: Math.min(1.25, window.devicePixelRatio),
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
    state.lastFrameTime = state.lastTime;
    state.moved = false;
    stage.classList.add("is-dragging");
    stage.setPointerCapture?.(event.pointerId);
    animate();
  });

  document.addEventListener("pointermove", event => {
    resetIdle();
    if (!state.dragging) return;
    event.preventDefault();
    const delta = event.clientX - state.startX;
    const now = performance.now();
    const elapsed = Math.max(8, now - state.lastTime);
    const frameVelocity = ((delta - state.lastDelta) / elapsed) * 16.67;
    state.velocity = lerp(state.velocity, clamp(frameVelocity, -110, 110), 0.28);
    state.waveTarget = clamp(frameVelocity, -180, 180);
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
    resetIdle();
    if (state.selectedIndex !== null) {
      // Pull down/scroll wheel down to return/close the lightbox
      if (event.deltaY > 15) {
        closeLightbox();
      }
      return;
    }
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const push = -delta * 0.85;
    state.velocity = clamp(state.velocity + push * 0.12, -90, 90);
    state.waveTarget = clamp(state.waveTarget + push * 0.42, -190, 190);
    state.target += push;
    updateActiveFromCenter();
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
    
    // Up to 12 degrees X and Y tilt
    const tiltX = -dy * 12;
    const tiltY = dx * 12;
    
    lightboxImage.style.transform = `translate(-50%, -50%) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
    // Dynamic soft light shadow following mouse
    lightboxImage.style.filter = `brightness(1.04) drop-shadow(${dx * -16}px ${dy * -16}px 38px rgba(0,0,0,0.58))`;
  });

  lightbox?.addEventListener("pointerleave", () => {
    if (lightboxImage) {
      lightboxImage.style.transform = `translate(-50%, -50%) rotateX(0deg) rotateY(0deg) scale(1)`;
      lightboxImage.style.filter = `drop-shadow(0 35px 90px rgba(0, 0, 0, 0.65))`;
    }
  });
  
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
    state.waveTarget = 0;
    return;
  }
  state.clickIndex = null;
  state.velocity = clamp(state.velocity * 1.18, -120, 120);
  state.waveTarget = state.velocity;
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

  // Compile WebGL planes once DOM cards are appended
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
        // Smoothly hide the original HTML img when WebGL renderer compiles successfully
        image.style.opacity = "0";
      }).onRender(() => {
        plane.uniforms.uTime.value += 1.0;
        
        const hp = state.hoverProgress[index] || 0;
        const ep = (index === state.selectedIndex) ? state.expandProgress : 0;
        
        plane.uniforms.uHoverProgress.value = hp;
        plane.uniforms.uExpandProgress.value = ep;
        plane.uniforms.uVelocity.value = state.wavePower;
        
        // Compute precise mesh center proximity for spotlight lighting
        const left = card._offsetLeft !== undefined ? card._offsetLeft : card.offsetLeft;
        const width = card._offsetWidth || card.offsetWidth || 110;
        const cardCenter = left + width / 2;
        const x = cardCenter + state.current;
        const C = (state.stageWidth || stage.clientWidth || window.innerWidth) / 2;
        const gap = parseFloat(window.getComputedStyle(track).gap) || 8;
        const T = items.length * (width + gap);
        const offset = ((x - C + T/2) % T + T) % T - T/2;
        const distance = Math.abs(offset);
        const maxDist = Math.max(1, (state.stageWidth || stage.clientWidth || window.innerWidth) * 0.6);
        const proximity = Math.max(0, 1 - distance / maxDist);
        
        plane.uniforms.uProximity.value = proximity;
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
    const now = performance.now();
    const previous = state.lastFrameTime || now;
    const dt = clamp((now - previous) / 16.67, 0.55, 2.2);
    state.lastFrameTime = now;
    const follow = state.dragging ? 0.34 : 0.105;
    state.current += (state.target - state.current) * (1 - Math.pow(1 - follow, dt));

    const idleDuration = performance.now() - state.lastInteractionTime;
    const isIdle = idleDuration > 2000 && state.selectedIndex === null && !state.dragging;

    if (isIdle) {
      // 1. Slow Auto-Scroll from right to left (conveyor loop)
      state.target -= 0.34 * dt;
      
      // 2. Drive active highlights from physical center card to perfectly match speed and keep centered card lit up
      updateActiveFromCenter();
      state.hoveredIndex = state.active;
    }

    if (!state.dragging) {
      state.target += state.velocity * dt;
      state.velocity *= Math.pow(0.946, dt);
    }
    state.wavePower += (state.waveTarget - state.wavePower) * (1 - Math.pow(0.84, dt));
    state.waveTarget *= Math.pow(state.dragging ? 0.92 : 0.82, dt);

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

    // --- Magnetic spring to center ---
    // Low speed motion gets a soft spring, high speed motion keeps its inertia.
    if (!state.dragging && Math.abs(state.velocity) < 1.8 && state.selectedIndex === null) {
      const activeCard = cards[state.active];
      if (activeCard) {
        const cardCenter = activeCard._offsetLeft + cardWidth / 2;
        const x = cardCenter + state.current;
        const offset = ((x - C + T/2) % T + T) % T - T/2; // Distance from center
        const spring = -offset * 0.014;
        const damping = -state.velocity * 0.035;
        state.velocity += (spring + damping) * dt;
        state.target -= offset * 0.006 * dt;
      }
    }

    // Handle expand progress
    const targetExpand = (state.selectedIndex !== null) ? 1 : 0;
    state.expandProgress = lerp(state.expandProgress, targetExpand, 0.125);
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

      const speed = Math.min(Math.abs(state.wavePower), 220);
      const motion = easeOutCubic(Math.min(speed / 170, 1));
      const hp = state.hoverProgress[index] || 0;
      const ep = isSelected ? globalEp : 0;

      const sideOfCenter = offset < 0 ? -1 : 1;
      const direction = state.wavePower < 0 ? -1 : 1;
      const phase = index * 0.48 + state.current * 0.01;

      // --- 3D Curve Base Layout (Static Cylinder - Flattened for straight alignment) ---
      const baseRotateY = 0;
      const baseDepth = 0;
      const baseScale = 0.94;
      const baseFloat = 0;

      // --- Spherical 3D speed-distortion bulge (Aristide Benoist Inspired - Amplified) ---
      const speedFactor = motion; 
      
      // Center card bulges forward (positive depth), side cards fold back (negative depth)
      const motionDepth = speedFactor * (proximity * 260 - (1 - proximity) * 160);
      
      // Center card scales up (positive scale), side cards shrink down (negative scale)
      const motionScale = speedFactor * (proximity * 0.14 - (1 - proximity) * 0.105);
      
      // Side cards rotate on Y axis to look like they wrap around a sphere
      const motionRotateY = -sideOfCenter * (1 - proximity) * 38 * speedFactor;
      
      // Center card floats slightly up, side cards curve down slightly
      const motionFloat = speedFactor * (proximity * -22 + (1 - proximity) * 12);
      
      // Subtle Z tilt ripple wave and rotation
      const motionRotateZ = clamp(Math.sin(phase) * speedFactor * 2.4, -3.6, 3.6);
      const motionRotateX = -speedFactor * proximity * 4.5;
      const motionLag = clamp(state.wavePower * 0.075, -20, 20) * (1 - proximity * 0.35);

      // --- Blend Base, Motion, Hover, and Expand ---
      const rotateY = (baseRotateY + motionRotateY) * (1 - hp * 0.15) * (1 - globalEp);
      const rotateX = motionRotateX * (1 - hp * 0.15) * (1 - globalEp);
      const rotateZ = motionRotateZ * (1 - hp * 0.15) * (1 - globalEp);

      // Disable physical hover scaling to focus purely on color/brightness 'light up' feel
      const hoverScale = 0; 
      const neighborScale = 0;

      let scaleX, scaleY;
      if (isSelected) {
        const startScaleX = baseScale + motionScale;
        const startScaleY = baseScale + motionScale;
        
        // Dynamically compute target scales matching the image's original aspect ratio (e.g. 9:16 or 16:9)
        const image = card.querySelector("img");
        let aspect = 16 / 9;
        if (image && image.naturalWidth && image.naturalHeight) {
          aspect = image.naturalWidth / image.naturalHeight;
        }
        
        const maxTargetWidth = state.stageWidth * 0.95;
        const maxTargetHeight = window.innerHeight * 0.95;
        
        let targetWidth, targetHeight;
        if (aspect > maxTargetWidth / maxTargetHeight) {
          // Horizontal/Widescreen images (e.g. 16:9) fit to width
          targetWidth = maxTargetWidth;
          targetHeight = maxTargetWidth / aspect;
        } else {
          // Vertical/Portrait images (e.g. 9:16) fit to height
          targetHeight = maxTargetHeight;
          targetWidth = maxTargetHeight * aspect;
        }
        
        const cardHeight = card.offsetHeight || 450;
        const targetScaleX = targetWidth / cardWidth;
        const targetScaleY = targetHeight / cardHeight;
        
        scaleX = lerp(startScaleX, targetScaleX, globalEp);
        scaleY = lerp(startScaleY, targetScaleY, globalEp);
      } else {
        scaleX = baseScale + motionScale;
        scaleY = baseScale + motionScale;
      }
      scaleX = Math.max(0.001, scaleX);
      scaleY = Math.max(0.001, scaleY);

      // Soft physical 3D lift on hover (extremely subtle to maintain slick feel)
      const hoverDepth = hp * 16;
      const expandDepth = ep * 320;
      const depth = (baseDepth + motionDepth + hoverDepth) * (1 - globalEp) + expandDepth;

      const hoverFloat = 0;
      const expandFloat = ep * -12;
      const float = (baseFloat + motionFloat + hoverFloat) * (1 - globalEp) + expandFloat;

      const lag = motionLag * (1 - globalEp);

      // --- Pushing Neighbors ---
      let push = 0;
      if (state.selectedIndex !== null && !isSelected) {
        const pushDirection = offset < 0 ? -1 : 1;
        push = pushDirection * state.stageWidth * 0.8 * globalEp;
      }

      // --- Center alignment ---
      const targetCenterOffset = isSelected ? offset * (1 - globalEp) : (offset + push + lag);
      const tx = C + targetCenterOffset - cardCenter;

      card.style.transformOrigin = "center center";
      card.style.transform = `translate3d(${tx}px, ${float}px, ${depth}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotate(${rotateZ}deg) scale(${scaleX}, ${scaleY})`;

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
      const opacity = isSelected ? 1 : 1 - globalEp;
      card.style.opacity = String(opacity);

      // Store visibility status to avoid layout thrashing in updatePosition
      const isVisible = (C + offset + cardWidth / 2 >= -100) && (C + offset - cardWidth / 2 <= state.stageWidth + 100);
      card._isVisible = isVisible;
    });

    // Force curtains.js planes to update positions aligned with DOM cards (optimized to avoid layout thrashing)
    if (curtainsInstance) {
      planes.forEach((plane, idx) => {
        if (idx === state.selectedIndex || track.children[idx]?._isVisible) {
          plane.updatePosition();
        }
      });
    }

    const settled = Math.abs(state.target - state.current) < 0.35 && 
                    Math.abs(state.velocity) < 0.06 && 
                    Math.abs(state.wavePower) < 0.06 &&
                    Math.abs(state.waveTarget) < 0.06 &&
                    !hasActiveHover;
                    
    if (!settled || state.dragging || state.selectedIndex === null) {
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

  // Update the full-screen blurred background image
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
    lightbox.classList.remove("is-active");
    if (lightboxImage) {
      // Clear inline 3D tilt styles immediately so the CSS scale-down transition takes over beautifully!
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

// Cubic bezier or spring interpolation
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
