/* ================================================================
   three-cards.js — carrousel 3D « My adventures »
   Portage quasi-verbatim de RECKLESS-CUP CardSimple.jsx :
   même rig caméra, mêmes uniforms (amp/hover/focus/dim/fade), même
   mécanique focus (vol vers la caméra + slerp + swap texture miroir
   + lock scroll + caption DOM + bouton close).
   ================================================================ */
import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.getElementById('webgl');
const scrollSection = document.querySelector('.scroll-section');
if (!canvas || !scrollSection) throw new Error('three-cards: missing #webgl/.scroll-section');

const accentHex = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--rk-accent').trim() || '#b82121';

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf4f9fb, 7, 22);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
const radius = 6;
const pitch = 6;
camera.position.set(0, 2, 10);
camera.lookAt(0, -2, 0);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (err) {
  scrollSection.style.display = 'none';
  throw err;
}
// DPR 1.5 : à 2 la canvas fait 4x les pixels pour un gain invisible
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

scene.add(new THREE.AmbientLight(0xffffff, 0.95));
const accentLight = new THREE.PointLight(new THREE.Color(accentHex()), 1.2, 20);
accentLight.position.set(3, -2, -5);
scene.add(accentLight);
const pinkLight = new THREE.PointLight(0xda1b60, 1.2, 20);
pinkLight.position.set(-3, 3, 5);
scene.add(pinkLight);

const mainGroup = new THREE.Group();
scene.add(mainGroup);

// Load GLTF model at center
let gltfModel;
const modelBounds = new THREE.Sphere();
const modelWorldBounds = new THREE.Sphere();
const viewFrustum = new THREE.Frustum();
const viewProjection = new THREE.Matrix4();
new GLTFLoader().load('assets/3d/space_exploration_wlp_series_8/scene-optimized.glb', gltf => {
  new THREE.Box3().setFromObject(gltf.scene).getBoundingSphere(modelBounds);
  gltf.scene.scale.set(1, 1, 1);
  gltf.scene.position.set(0, -3.5, 0);
  mainGroup.add(gltf.scene);
  gltfModel = gltf.scene;

  // ✅ Lumière directionnelle ciblée
  const dirLight = new THREE.DirectionalLight(0xffffff, 2);
  dirLight.position.set(5, 10, 5);
  dirLight.target = gltf.scene;
  scene.add(dirLight);
  scene.add(dirLight.target);
});

// Card shaders — verbatim CardSimple (dim = flou 3x3 + désaturation
// des cartes arrière-plan pendant le focus, fade = disparition)
const cardGeometry = new THREE.PlaneGeometry(2.2, 1.45, 20, 20);
const vertexShader = `
  uniform float time;
  uniform float amp;
  varying vec2 vUv;
  varying vec2 vWave;
  float wave(float x, float y, float t) {
    return sin(x * 3.0 + t) * 0.3 + cos(y * 4.0 + t * 1.5) * 0.15 + sin((x + y) * 5.0 + t * 0.5) * 0.1;
  }
  void main() {
    vUv = uv;
    vWave = vec2(
      sin((uv.y + time * 0.7) * 10.0),
      cos((uv.x + time * 0.9) * 12.0)
    ) * (0.005 * amp);
    vec3 p = position;
    p.z += wave(p.x, p.y, time) * amp;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const fragmentShader = `
  uniform sampler2D map;
  uniform float time;
  uniform float amp;
  uniform float hoverStrength;
  uniform vec2 hoverUv;
  uniform float focus;
  uniform float dim;
  uniform float fade;
  varying vec2 vUv;
  varying vec2 vWave;
  void main() {
    vec2 faceUv = vec2(gl_FrontFacing ? 1.0 - vUv.x : vUv.x, vUv.y);
    vec2 uv = faceUv + vWave;
    vec4 texColor = texture2D(map, uv);
    if (dim > 0.001) {
      // flou 3x3 sur les cartes en arriere-plan pendant le focus
      vec4 acc = vec4(0.0);
      float r = dim * 0.022;
      for (int i = -1; i <= 1; i++) {
        for (int j = -1; j <= 1; j++) {
          acc += texture2D(map, uv + vec2(float(i), float(j)) * r);
        }
      }
      texColor = acc / 9.0;
    }
    float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    vec3 grayColor = vec3(mix(gray, 1.0, 0.1));
    float dist = distance(vUv, hoverUv);
    float radius = hoverStrength * 1.2;
    float t = smoothstep(radius - 0.05, radius + 0.05, dist);
    // focus = preview : couleur pleine, le ripple gris s'éteint avec le vol
    vec3 finalColor = mix(texColor.rgb, grayColor, t * 0.55 * (1.0 - focus));
    finalColor = mix(finalColor, vec3(dot(finalColor, vec3(0.3, 0.59, 0.11))), dim * 0.7);
    gl_FragColor = vec4(finalColor, texColor.a * (1.0 - dim * 0.45) * (1.0 - fade));
  }
`;


// Card data
const data = [
  {
    title: 'The Red Shalk 2023',
    desc: 'Congratulations to EVOLUTECH for their victory and collaboration with Carnet de Mode.mg! 👏 This hackathon from November 10-12, 2023 aimed to boost female entrepreneurship and create youth jobs through digital innovation.',
    image: 'assets/cards3d/exp/p4h-23.jpg'
  },
  {
    title: 'Ideathon 2023',
    desc: 'Evolutech wins 1st prize at Ideathon 2023! Thanks to the commitment and creativity of the whole team, we brilliantly secured first place. Thank you all for your support! Next stop: IndabaX Madagascar. 🚀✨',
    image: 'assets/cards3d/exp/ideatho-23.jpg'
  },
  {
    title: 'JNR 2023',
    desc: 'Fianarantsoa Research Days, May 2023, we partnered in this event by contributing to the design and development of a user survey application.',
    image: 'assets/cards3d/exp/jnr-23.jpg'
  },
  {
    title: 'Emihack 2023',
    desc: 'Another remarkable performance at the 2023 edition of the Emihack inter-class hackathon, held at EMIT Fianarantsoa, where we again secured second place.',
    image: 'assets/cards3d/exp/emihack-23.jpg'
  },
  {
    title: 'Frontend Award 2022',
    desc: 'We took second place at the Frontend Award 2022, a national contest organized by TechZara. This challenge allowed us to showcase our creativity and web development skills.',
    image: 'assets/cards3d/exp/FA-22.jpg'
  },
  {
    title: 'Emihack 2022',
    desc: 'We proudly finished in second place at the Emihack 2022 inter-class hackathon, organized at EMIT Fianarantsoa. A great experience of collaboration, innovation, and collective surpassing.',
    image: 'assets/cards3d/exp/emihack-22.jpg'
  },
];


// Create cards — tuile blanche vitrée avec photo encadrée en haut,
// titre + filet cyan intégrés en bas à gauche (et photo plein cadre en mode preview).
const accentRawRGB = (() => {
    let c;
    return () => {
        if (c) return c;
        const v = getComputedStyle(document.documentElement).getPropertyValue('--rk-accent').trim();
        const n = /^#[0-9a-fA-F]{6}$/.test(v) ? parseInt(v.slice(1), 16) : 0x3fc5ff;
        c = [n >> 16 & 255, n >> 8 & 255, n & 255];
        return c;
    };
})();
const tileBg = () => `rgb(${accentRawRGB().map((x) => Math.round(255 - (255 - x) * 0.035))})`;
const tileAccent = () => `rgb(${accentRawRGB()})`;

const cards = [];
data.forEach((d) => {
  const imageCanvas = document.createElement('canvas');
  imageCanvas.width = 1536;
  imageCanvas.height = 1024;
  const context = imageCanvas.getContext('2d');
  const image = new Image();
  image.src = d.image;
  image.onload = () => {
    let isFull = false;

    const paint = (full = false) => {
      // ratio FIXE 3:2 : toutes les tuiles partagent le gabarit du plan
      imageCanvas.width = 1536;
      imageCanvas.height = 1024;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
      const w = imageCanvas.width, h = imageCanvas.height;

      if (full) {
        // mode preview : la carte prend le ratio exact de la photo (via
        // focusX/focusY dans updateCards) -> l'image remplit 100% du cadre
        // arrondi sans aucune bande ni aucun crop
        const r = Math.round(w * 0.03);
        context.save();
        context.beginPath();
        context.roundRect(0, 0, w, h, r);
        context.clip();
        context.drawImage(image, 0, 0, w, h);
        context.restore();
        return;
      }

      // mode carte carrousel : carte blanche épurée (sans bordure bleue)
      // + photo entière encadrée en haut + titre & filet en bas à gauche
      const m = Math.round(w * 0.014);
      const r = Math.round(w * 0.046);
      const cardW = w - 2 * m;
      const cardH = h - 2 * m;

      context.save();
      context.beginPath();
      context.roundRect(m, m, cardW, cardH, r);
      const grad = context.createLinearGradient(m, m, m, m + cardH);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, tileBg());
      context.fillStyle = grad;
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = 'rgba(10, 26, 38, 0.08)';
      context.stroke();
      context.clip();

      // zone photo encadrée en haut de la carte (image entière sans crop
      // sur fond clair doux assorti à la carte)
      const pad = Math.round(w * 0.038);
      const imgX = m + pad;
      const imgY = m + pad;
      const imgW = cardW - 2 * pad;
      const imgH = Math.round(cardH * 0.69);
      const imgR = Math.round(r * 0.56);

      context.save();
      context.beginPath();
      context.roundRect(imgX, imgY, imgW, imgH, imgR);
      context.fillStyle = '#f2f6fa';
      context.fill();
      context.clip();
      const ir = image.width / image.height;
      const tr = imgW / imgH;
      let dw, dh;
      if (ir > tr) {
        dw = imgW;
        dh = imgW / ir;
      } else {
        dh = imgH;
        dw = imgH * ir;
      }
      context.drawImage(image, imgX + (imgW - dw) / 2, imgY + (imgH - dh) / 2, dw, dh);
      context.restore();

      // titre aligné à gauche sous la photo
      let fontSize = 68;
      context.font = `700 ${fontSize}px "League Spartan", sans-serif`;
      const maxTextW = imgW;
      const measured = context.measureText(d.title).width;
      if (measured > maxTextW) {
        fontSize = Math.max(44, Math.floor(fontSize * (maxTextW / measured)));
        context.font = `700 ${fontSize}px "League Spartan", sans-serif`;
      }
      context.textAlign = 'left';
      context.textBaseline = 'alphabetic';
      context.fillStyle = '#0d2538';
      const footerTop = imgY + imgH;
      const footerH = m + cardH - footerTop;
      const titleY = footerTop + Math.round(footerH * 0.54);
      context.fillText(d.title, imgX, titleY);

      // petit tiret sous le titre
      const barW = Math.round(w * 0.085);
      const barH = 7;
      const barY = titleY + Math.round(footerH * 0.16);
      context.beginPath();
      context.roundRect(imgX, barY, barW, barH, barH / 2);
      context.fillStyle = tileAccent();
      context.fill();

      context.restore();
    };
    paint();

    const texture = new THREE.CanvasTexture(imageCanvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const uniforms = {
      map: { value: texture },
      time: { value: 0 },
      amp: { value: 0.3 },
      hoverStrength: { value: 0 },
      hoverUv: { value: new THREE.Vector2(0.5, 0.5) },
      focus: { value: 0 },
      dim: { value: 0 },
      fade: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const card = new THREE.Mesh(cardGeometry, material);
    card.scale.x = -1;
    card.userData = {
      ...d,
      uniforms,
      focusAmt: { value: 0 },
      focusTween: null,
      hoverAmt: { value: 0 },
      qFocus: null,
      canvas: imageCanvas,
      // swap texture plein cadre pour le preview (appelé à mi-vol des tweens)
      setFull: (full) => {
        if (isFull === full) return;
        isFull = full;
        paint(full);
        texture.needsUpdate = true;
      },
      // en mode preview, la carte épouse le ratio exact de sa photo
      // (plus aucune bande ni déformation, quelle que soit l'image)
      focusY: (2.2 / 1.45) / (image.width / image.height),
    };
    mainGroup.add(card);
    cards.push(card);
    // re-bake une fois League Spartan chargée pour avoir les vraies métriques du titre intégré
    Promise.resolve(document.fonts?.load('700 72px "League Spartan"'))
      .catch(() => {})
      .then(() => {
        paint(isFull);
        texture.needsUpdate = true;
        requestRender();
      });
  };

  image.onerror = () => {
    console.error(`Erreur de chargement de l'image ${d.image}`);
  };
});

// DOM focus (porté de CardSimple focus-caption / focus-close / glow / outro)
const focusCaption = document.getElementById('focusCaption');
const focusCaptionTitle = document.getElementById('focusCaptionTitle');
const focusCaptionDesc = document.getElementById('focusCaptionDesc');
const focusClose = document.getElementById('focusClose');
const glowEl = scrollSection.querySelector('.scroll-glow');
const outroEl = scrollSection.querySelector('.scroll-outro');
const flexa = document.querySelector('.flexa');

const setFocused = (d) => {
  if (d) {
    if (focusCaptionTitle) focusCaptionTitle.textContent = d.title || '';
    if (focusCaptionDesc) focusCaptionDesc.textContent = d.desc || '';
    focusCaption?.classList.add('visible');
    focusCaption?.setAttribute('aria-hidden', 'false');
    focusClose?.classList.add('visible');
    focusClose?.setAttribute('aria-hidden', 'false');
    if (focusClose) focusClose.tabIndex = 0;
  } else {
    focusCaption?.classList.remove('visible');
    focusCaption?.setAttribute('aria-hidden', 'true');
    focusClose?.classList.remove('visible');
    focusClose?.setAttribute('aria-hidden', 'true');
    if (focusClose) focusClose.tabIndex = -1;
  }
};

// Position update — verbatim CardSimple : helice + interpolation focus
// (position lerp vers focusWorld, quaternion slerp helice->faceCam,
// scale cover, swap texture miroir au croisement de profil)
let theta = 0;
// pas de timeline partagée : chaque card porte son tween de vol
// (focusTween) — un focusOn ne doit jamais tuer le retour d'une
// autre card, sinon elle reste figée à mi-chemin
const focus = { card: null, phase: 'idle', overflow: null, scrubTween: null };
const focusWorld = new THREE.Vector3();
const focusPos = new THREE.Vector3();
const camWorldPos = new THREE.Vector3();
const camWorldDir = new THREE.Vector3();
const qHelix = new THREE.Quaternion();
const qParentW = new THREE.Quaternion();
let coverScale = 4.2;
let lastProgress = -1;

function updateCards() {
  cards.forEach((card, index) => {
    card.visible = card.userData.uniforms.fade.value < 0.999;
    if (!card.visible) return;
    const angle = theta + index * ((2 * Math.PI) / cards.length);
    const hx = radius * Math.cos(angle);
    const hy = pitch * (angle / (2 * Math.PI)) - 2.5;
    const hz = radius * Math.sin(angle);
    const hrot = Math.atan2(-hx, -hz);
    const f = card.userData.focusAmt.value;
    card.position.set(hx, hy, hz);
    card.rotation.set(0, hrot, 0);
    const baseScale = 1 + card.userData.hoverAmt.value * 0.1;
    card.scale.set(-baseScale, baseScale, baseScale);
    if (f > 0) {
      mainGroup.worldToLocal(focusPos.copy(focusWorld));
      card.position.lerp(focusPos, f);
      // UNE rotation continue : slerp helice -> face camera pilote par
      // le meme f que position/scale (pas de double rotation)
      qHelix.copy(card.quaternion);
      card.quaternion.slerpQuaternions(qHelix, card.userData.qFocus, f);
      const s = baseScale + (coverScale - baseScale) * f;
      const sy = s * (1 + (card.userData.focusY - 1) * f);
      card.scale.set(-s, sy, s);
      card.position.z += f * 0.001;
      // la texture plein cadre est miroir : swap au moment ou la carte
      // est de profil — normale perpendiculaire a l'axe de vue =
      // sliver invisible (remplace le dip d'opacite)
      card.material.depthTest = focus.phase === 'closing';
    }
  });
  // progress normalisé par la plage de scroll active
  const progress = Math.min(Math.max((scr.v - scrollStart) / scrollRange, 0), 1);
  if (glowEl && progress !== lastProgress) {
    glowEl.style.opacity = String(Math.min(progress * 1.5, 1));
    glowEl.style.transform = `translate3d(0, ${(1 - progress) * 32}%, 0) scale(${0.55 + progress * 0.65})`;
  }
  if (outroEl && progress !== lastProgress) {
    const op = THREE.MathUtils.smoothstep(progress, 0.86, 0.98);
    outroEl.style.opacity = String(op);
    outroEl.style.transform = `translate3d(0, ${(1 - op) * 34}px, 0)`;
  }
  lastProgress = progress;
  if (gltfModel) {
    gltfModel.scale.setScalar(0.001 + progress * rocketMax);
    gltfModel.position.y = -3.5 + progress * 10;
    gltfModel.rotation.y = -theta * 0.25;
  }
  mainGroup.position.y = groupY;
  if (gltfModel) {
    gltfModel.updateWorldMatrix(true, false);
    modelWorldBounds.copy(modelBounds).applyMatrix4(gltfModel.matrixWorld);
    viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    viewFrustum.setFromProjectionMatrix(viewProjection);
    const distance = camera.position.distanceTo(modelWorldBounds.center);
    const diameter = modelWorldBounds.radius * canvas.clientHeight /
      (Math.max(distance, camera.near) * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    gltfModel.visible = progress > 0 && focus.phase !== 'open' && diameter >= 2 && viewFrustum.intersectsSphere(modelWorldBounds);
  }
}

// Scroll-triggered scrub & pin
const scr = { v:0 };
let scrollStart = 0, scrollRange = 4 * Math.PI, groupY = -1.5, rocketMax = 0.4;
ScrollTrigger.config({ ignoreMobileResize: true });

const mmCards = gsap.matchMedia();

// desktop : logique CardSimple — 2 tours, scrub doux, pin 'center center'
mmCards.add('(min-width: 861px)', () => {
  scrollStart = 0;
  scrollRange = 4 * Math.PI;
  groupY = -1.5;
  rocketMax = 0.4;
  const tw = gsap.to(scr, {
    v: scrollStart + scrollRange,
    ease: 'none',
    scrollTrigger: {
      trigger: scrollSection,
      start: 'center center',
      end: '+=2000',
      scrub: 2,
      pin: true,
      anticipatePin: 1,
    }
  });
  return () => { tw.scrollTrigger?.kill(); tw.kill(); };
});

// mobile : branche CardSimple — une carte face camera par cran de
// scroll, snap au cran le plus proche.
// slot face camera : scene.rotateY(180) tourne de 180 RADIANS (~233deg,
// pas 180deg !) — la carte face camera au centre (z monde max) est
// donc a l'angle local PI/2 + 180%(2PI) ~= 323deg.
mmCards.add('(max-width: 860px)', () => {
  if (data.length < 2) return; // pas de crans possibles sans cartes
  const step = (Math.PI * 2) / data.length;
  const lastIndex = data.length - 1;
  const FRONT = Math.PI / 2 + (180 % (Math.PI * 2));
  const startAngle = FRONT - lastIndex * step;
  scrollStart = startAngle;
  scrollRange = lastIndex * step;
  groupY = -1.0;
  rocketMax = 0.25;
  gsap.set(scr, { v: startAngle });

  const stops = Array.from({ length: lastIndex + 1 }, (_, i) => i / lastIndex);
  const nearestStop = (value) => stops.reduce(
    (best, stop) => (Math.abs(stop - value) < Math.abs(best - value) ? stop : best),
    stops[0]);

  const st = ScrollTrigger.create({
    trigger: scrollSection,
    start: 'center center',
    end: `+=${Math.max(150, lastIndex * 50)}%`,
    pin: true,
    anticipatePin: 1,
    scrub: 0.18,
    onUpdate: (self) => { scr.v = startAngle + self.progress * lastIndex * step; },
    snap: {
      snapTo: nearestStop,
      duration: { min: 0.16, max: 0.42 },
      delay: 0.12,
      inertia: false,
      ease: 'power2.out',
    },
  });
  return () => st.kill();
});

// bloque le scroll en mode focus (overflow seul est contourne par le pin)
const blockScroll = (e) => e.preventDefault();
const blockKeys = (e) => {
  if ([' ', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
    e.preventDefault();
  }
};
const lockScroll = () => {
  window.addEventListener('wheel', blockScroll, { passive: false });
  window.addEventListener('touchmove', blockScroll, { passive: false });
  window.addEventListener('keydown', blockKeys);
};
const unlockScroll = () => {
  window.removeEventListener('wheel', blockScroll);
  window.removeEventListener('touchmove', blockScroll);
  window.removeEventListener('keydown', blockKeys);
};

const focusOn = (card) => {
  if (focus.phase !== 'idle') return;
  focus.card = card;
  focus.phase = 'opening';
  // snapshot AVANT les appels ScrollTrigger : si l'un d'eux jette,
  // focus.card resterait set avec overflow=null -> crash au unfocus
  focus.overflow = { root: document.documentElement.style.overflow, body: document.body.style.overflow };
  const trigger = ScrollTrigger.getAll().find((st) => st.trigger === scrollSection);
  // getTween(true) peut être absent : vérifier kill avant l'appel.
  // Seul le tween de lissage doit être suspendu, pas `animation` :
  // reprendre l'animation principale la lirait jusqu'au bout sans scroll.
  // ScrollTrigger relance son lissage au prochain changement de scroll.
  const snapTw = trigger?.getTween?.(true);
  if (typeof snapTw?.kill === 'function') snapTw.kill();
  const scrubTween = trigger?.getTween?.();
  focus.scrubTween = typeof scrubTween?.pause === 'function' ? scrubTween : null;
  focus.scrubTween?.pause();
  scrollSection.classList.add('is-card-focus');
  setFocused({ title: card.userData.title, desc: card.userData.desc });
  resize();
  if (lastHoveredCard) {
    gsap.to(lastHoveredCard.userData.uniforms.hoverStrength, { value: 0, duration: 0.6 });
    lastHoveredCard = null;
  }
  const u = card.userData.uniforms;
  // orientation cible : +Z face camera depuis le point focus — le slerp
  // par frame dans updateCards produit UNE rotation continue
  if (!card.userData.qFocus) card.userData.qFocus = new THREE.Quaternion();
  camera.getWorldQuaternion(card.userData.qFocus);
  mainGroup.getWorldQuaternion(qParentW);
  card.userData.qFocus.premultiply(qParentW.invert());
  card.material.depthTest = false; // dessinee par-dessus tout
  card.userData.focusTween?.kill();
  gsap.killTweensOf([u.amp, u.hoverStrength, card.userData.hoverAmt]);
  card.userData.hoverAmt.value = 0;
  u.hoverStrength.value = 0;
  card.userData.focusTween = gsap.timeline({ onComplete: () => { focus.phase = 'open'; } })
    .to(card.userData.focusAmt, { value: 1, duration: 1.05, ease: 'power3.inOut' }, 0)
    .to(u.focus, { value: 1, duration: 1.05, ease: 'power2.inOut' }, 0)
    // swap texture plein cadre à mi-vol (la carte est ~de profil, la
    // bascule est invisible dans le mouvement)
    .call(card.userData.setFull, [true], 0.5);
  // micro-burst shader pendant le flip, surface plate ensuite
  gsap.to(u.amp, { value: 0, duration: 0.3, overwrite: true });
  // carte au premier plan
  card.renderOrder = 10;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.body.classList.add('is-focus');
  lockScroll();
  cards.forEach((c) => {
    if (c === card) return;
    gsap.to(c.userData.uniforms.dim, { value: 1, duration: 0.5 });
    gsap.to(c.userData.uniforms.fade, { value: 1, duration: 0.7, ease: 'power2.out' });
  });
};

const focusOff = () => {
  const card = focus.card;
  if (!card || focus.phase === 'closing') return;
  focus.phase = 'closing';
  const u = card.userData.uniforms;
  // snapshot immédiat : focus.overflow peut être null si focusOn a
  // échoué avant sa ligne d'affectation — l'onComplete lit ensuite
  // .root sur null (crash) et le scroll reste verrouillé
  const savedOverflow = focus.overflow;
  // retour : meme mechanique en sens inverse. La card redevient un
  // objet 3D normal DES LE DEPART du vol (depthTest/renderOrder) —
  // sinon elle traversait le modele central et les autres cards sans
  // occlusion pendant ~0.9s puis "poppait" en se posant
  card.renderOrder = 0;
  card.material.depthTest = true;
  card.userData.focusTween?.kill();
  gsap.killTweensOf([u.amp, u.hoverStrength, card.userData.hoverAmt]);
  u.amp.value = 0;
  card.userData.hoverAmt.value = 0;
  card.userData.focusTween = gsap.timeline({
    onComplete: () => {
      focus.card = null;
      focus.phase = 'idle';
      scrollSection.classList.remove('is-card-focus');
      if (savedOverflow) {
        document.documentElement.style.overflow = savedOverflow.root;
        document.body.style.overflow = savedOverflow.body;
        focus.overflow = null;
      }
      document.body.classList.remove('is-focus');
      unlockScroll();
      // Le prochain scroll relancera le lissage via ScrollTrigger.
      focus.scrubTween = null;
      gsap.to(u.amp, { value: 0.3, duration: 0.4, overwrite: true });
    }
  })
    .to(card.userData.focusAmt, { value: 0, duration: 0.9, ease: 'power3.inOut' }, 0)
    .to(u.focus, { value: 0, duration: 0.9, ease: 'power2.inOut' }, 0)
    // retour à la texture tuile à mi-vol retour
    .call(card.userData.setFull, [false], 0.45);
  cards.forEach((c) => {
    gsap.to(c.userData.uniforms.dim, { value: 0, duration: 0.5 });
    if (c === card) return;
    gsap.to(c.userData.uniforms.fade, { value: 0, duration: 0.6 });
  });
  setFocused(null);
  requestRender();
};

// Raycast hover — verbatim CardSimple
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
let lastHoveredCard = null;

const getHit = () => {
  ray.setFromCamera(mouse, camera);
  return ray.intersectObjects(cards, false).find(({ object }) => object.userData.uniforms.fade.value <= 0.5) || null;
};

canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) / r.width * 2 - 1;
  mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;

  const intersection = getHit();
  const hit = intersection?.object || null;

  if (focus.card) {
    if (lastHoveredCard) {
      gsap.to(lastHoveredCard.userData.uniforms.hoverStrength, { value: 0, duration: 0.6 });
      lastHoveredCard = null;
    }
    canvas.style.cursor = hit && hit !== focus.card ? 'pointer' : 'default';
    return;
  }

  if (hit !== lastHoveredCard) {
    if (lastHoveredCard) {
      gsap.to(lastHoveredCard.userData.uniforms.amp, { value: 0.3, duration: 0.5, ease: 'sine.out' });
      gsap.to(lastHoveredCard.userData.uniforms.hoverStrength, { value: 0, duration: 1.2, ease: 'power2.out' });
      gsap.to(lastHoveredCard.userData.hoverAmt, { value: 0, duration: 0.3, ease: 'power2.out', overwrite: true });
    }
    // card en vol (focus ou retour, focusAmt > 0) : pas de hover —
    // un tween scale/hover ici se battrait avec updateCards chaque frame
    if (hit && hit.userData.focusAmt.value < 0.02) {
      gsap.to(hit.userData.uniforms.amp, { value: 0, duration: 0.5, ease: 'sine.out' });
      gsap.to(hit.userData.uniforms.hoverStrength, { value: 1, duration: 1.2, ease: 'power2.out' });
      gsap.to(hit.userData.hoverAmt, { value: 1, duration: 0.3, ease: 'power2.out', overwrite: true });
      if (intersection.uv) hit.userData.uniforms.hoverUv.value.copy(intersection.uv);
      hit.userData.uniforms.time.value = 0;
    }
    lastHoveredCard = hit;
  }

  canvas.style.cursor = hit ? 'pointer' : 'default';
});

// tap-vs-swipe : sur mobile, un click est encore emis apres certains
// petits drags — sans ce garde, un swipe lance sur une carte ouvriait
// le focus et VERROUILLAIT tout le scroll
let downPos = null;
const onPointerDown = (e) => { downPos = { x: e.clientX, y: e.clientY }; };
const onClick = (e) => {
  if (downPos && Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 12) return;
  if (focus.phase === 'closing') return;
  const r = canvas.getBoundingClientRect();
  mouse.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  if (focus.card) {
    focusOff();
    return;
  }
  const hit = getHit()?.object;
  // card en fade (alpha 0 pendant le focus d'une autre) reste
  // raycastable : sans ce garde, cliquer "dans le vide" pouvait
  // ouvrir une card invisible au lieu de fermer
  if (!hit || hit.userData.uniforms.fade.value > 0.5) {
    focusOff();
    return;
  }
  if (hit === focus.card) {
    focusOff();
    return;
  }
  focusOn(hit);
};

canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('click', onClick);
focusClose?.addEventListener('click', focusOff);

// Fermer avec Echap
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && focus.card) focusOff();
});

//conf
camera.rotateX(-100.5)
scene.rotateY(180)
scene.updateMatrixWorld(true);

// coords MONDE de la camera (scene est rotateY(PI) : camera.position
// local != monde) — point focus sur l'axe de vue a z=5.35, coverScale
// = largeur 100% du viewport a la distance focus (2.2 = largeur carte)
const resize = () => {
  const width = scrollSection.clientWidth;
  const height = scrollSection.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = width < 768 ? 90 : width < 1024 ? 55 : 50;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  camera.getWorldPosition(camWorldPos);
  camera.getWorldDirection(camWorldDir);
  const t = (5.35 - camWorldPos.z) / camWorldDir.z;
  focusWorld.copy(camWorldPos).addScaledVector(camWorldDir, t);
  const dist = camWorldPos.distanceTo(focusWorld);
  const viewH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const isMobile = width < 768;
  const topMargin = isMobile ? Math.max(24, height * 0.04) : Math.max(16, Math.min(28, height * 0.028));
  const sideMargin = isMobile ? Math.max(12, width * 0.032) : Math.max(20, Math.min(44, width * 0.032));
  const captionH = focusCaption ? focusCaption.offsetHeight : 0;
  // En desktop : grand format immersif (la carte descend bas et la
  // légende verre flotte légèrement sur le bord inférieur). En mobile :
  // l'image reste au-dessus de la légende pour ne jamais la masquer.
  const bottomReserve = isMobile
    ? (captionH > 0 ? captionH + 28 : Math.round(height * 0.28))
    : Math.max(36, Math.min(68, height * 0.07));
  const previewBottom = Math.max(topMargin + 180, height - bottomReserve);
  const previewHeight = Math.max(1, previewBottom - topMargin);
  const centerY = (topMargin + previewBottom) / 2;
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  focusWorld.addScaledVector(up, (0.5 - centerY / height) * viewH);
  const cardFocusY = focus.card?.userData?.focusY ?? (2.2 / (1.45 * 1.5));
  coverScale = Math.min(
    (viewH * camera.aspect * (width - 2 * sideMargin) / width) / 2.2,
    (viewH * previewHeight / height) / (1.45 * cardFocusY)
  );
  requestRender();
};
// Animate
let isVisible = !document.hidden;
let isInViewport = false;
let rafId = null;

function requestRender() {
  if (isVisible && isInViewport && rafId === null) rafId = requestAnimationFrame(animate);
}

resize();
window.addEventListener('resize', resize);

// Pause quand l'onglet est caché
document.addEventListener('visibilitychange', () => {
  isVisible = !document.hidden;
  if (!isVisible && rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  requestRender();
});

// Pause quand la section n'est pas dans le viewport
if (scrollSection) {
  const visObserver = new IntersectionObserver(([entry]) => {
    isInViewport = entry.isIntersecting;
    if (!isInViewport && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    requestRender();
  }, { threshold: 0.05 });
  visObserver.observe(scrollSection);
}

function animate(t=0) {
  // garde AVANT le schedule : sinon la chaine RAF continue en no-op et
  // chaque retour dans le viewport (rafId===null) spawn une chaine de
  // plus -> renders empiles a chaque passage de la section
  rafId = null;
  if (!isVisible || !isInViewport) return;
  // Le carrousel suit chaque frame pour conserver un scroll fluide ;
  // le preview immobile ne relance pas la boucle après son rendu.

  if (focus.phase === 'idle') theta = scr.v;
  updateCards();
  cards.forEach(c => {
    if (c.userData.uniforms.amp.value > 0) {
      c.userData.uniforms.time.value = t*0.001;
    }
  });
  renderer.render(scene, camera);
  if (focus.phase !== 'open') requestRender();
}
// garde : l'IntersectionObserver peut déjà avoir démarré la boucle
requestRender();