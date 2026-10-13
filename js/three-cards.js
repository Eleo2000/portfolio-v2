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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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
new GLTFLoader().load('assets/3d/space_exploration_wlp_series_8/scene.gltf', gltf => {
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
  float wave(float x, float y, float t) {
    return sin(x * 3.0 + t) * 0.3 + cos(y * 4.0 + t * 1.5) * 0.15 + sin((x + y) * 5.0 + t * 0.5) * 0.1;
  }
  void main() {
    vUv = uv;
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
  void main() {
    float wx = sin((vUv.y + time * 0.7) * 10.0) * 0.005 * amp;
    float wy = cos((vUv.x + time * 0.9) * 12.0) * 0.005 * amp;
    vec2 faceUv = vec2(gl_FrontFacing ? 1.0 - vUv.x : vUv.x, vUv.y);
    vec2 uv = faceUv + vec2(wx, wy);
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


// Create cards — pipeline CardSimple : canvas 1536×(1536/ratio) plein
// cadre (pas de letterboxing), redraw(full) = texture miroir pour le
// flip face caméra en mode focus.
// bleu clair dérivé de --rk-accent (mix 40% blanc) : l'accent brut
// rendait un liseré trop foncé — la tuile RECKLESS a un bord pâle
const accentRGB = (() => {
    let c;
    return () => {
        if (c) return c;
        const v = getComputedStyle(document.documentElement).getPropertyValue('--rk-accent').trim();
        const n = /^#[0-9a-fA-F]{6}$/.test(v) ? parseInt(v.slice(1), 16) : 0x3fc5ff;
        const l = (x) => Math.round(x + (255 - x) * 0.4);
        c = [l(n >> 16 & 255), l(n >> 8 & 255), l(n & 255)];
        return c;
    };
})();
const accentSoft = () => `rgba(${accentRGB()}, 0.55)`;
// accent saturé (--rk-accent brut) + fond de tuile légèrement teinté :
// la version éclaircie à 40% rendait la bordure quasi transparente
// en mode preview, et le blanc #fbfdff paraissait "incolore"
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
const accentStrong = () => `rgb(${accentRawRGB()})`;
const tileBg = () => `rgb(${accentRawRGB().map((x) => Math.round(255 - (255 - x) * 0.08))})`;

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
      // ratio FIXE 3:2 : toutes les tuiles partagent le gabarit du plan —
      // avant h = w/ratio, chaque image imposait sa propre taille visible
      imageCanvas.width = 1536;
      imageCanvas.height = 1024;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
      const w = imageCanvas.width, h = imageCanvas.height;
      const m = full ? 0 : Math.round(w * 0.014); // marge tuile fine
      const r = Math.round(w * 0.05);             // arrondi ~ tuile verre RECKLESS
      context.save();
      context.beginPath();
      context.roundRect(m, m, w - 2 * m, h - 2 * m, r);
      if (full) {
        // mode preview : plein cadre SANS bordure ni tuile — fond blanc
        // pur, puis la photo entière en contain par-dessus
        context.fillStyle = '#ffffff';
        context.fill();
        context.clip();
      } else {
        // surface claire arrondie + photo clippée dedans
        context.fillStyle = tileBg();
        context.fill();
        context.clip();
      }
      // contain centré : l'image ENTIÈRE est visible quelle que soit sa
      // proportion source — letterbox sur la surface de la tuile
      const inset = m + Math.ceil(r * (1 - Math.SQRT1_2));
      const iw = w - 2 * inset, ih = h - 2 * inset;
      const ir = image.width / image.height, tr = iw / ih;
      let dw, dh;
      if (ir > tr) { dw = iw; dh = iw / ir; } else { dh = ih; dw = ih * ir; }
      context.drawImage(image, inset + (iw - dw) / 2, inset + (ih - dh) / 2, dw, dh);
      context.restore();
      if (!full) {
        // liseré bleu accent + halo doux (le "bord glow" RECKLESS)
        context.save();
        context.beginPath();
        context.roundRect(m, m, w - 2 * m, h - 2 * m, r);
        context.strokeStyle = accentStrong();
        context.lineWidth = Math.max(8, Math.round(w * 0.008));
        context.shadowColor = accentSoft();
        context.shadowBlur = Math.round(w * 0.03);
        context.stroke();
        context.restore();
      }
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
      // toutes les textures sont 3:2 — la carte focus garde le ratio
      // du plan (sy ≈ 1.01), fini le scale par ratio d'image variable
      focusY: 2.2 / (1.45 * 1.5),
    };
    mainGroup.add(card);
    cards.push(card);
    // le titre est bake en canvas : on attend Orbitron pour que
    // measureText/fillText utilisent ses vraies metriques
    Promise.resolve(document.fonts?.load('700 88px Orbitron'))
      .catch(() => {})
      .then(() => {
        const label = createTextLabel(d.title);
        label.position.set(0, -1.15, 0);
        card.add(label);
      });
  };

  image.onerror = () => {
    console.error(`Erreur de chargement de l'image ${d.image}`);
  };
});

// Orbitron est tres large : on mesure puis on reduit la fonte pour
// rentrer dans la zone sure (porté de CardSimple createTextLabel)
function createTextLabel(text, color = '#4a6478') {
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 1024;
  labelCanvas.height = 256;
  const ctx = labelCanvas.getContext('2d');
  let size = 88;
  ctx.font = `bold ${size}px Orbitron, Arial`;
  const max = labelCanvas.width - 96;
  const w = ctx.measureText(text).width;
  if (w > max) {
    size = Math.max(44, Math.floor(size * (max / w)));
    ctx.font = `bold ${size}px Orbitron, Arial`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(text, 516, 132);
  ctx.fillText(text, 508, 124);
  ctx.fillStyle = color;
  ctx.fillText(text, 512, 128);

  const texture = new THREE.CanvasTexture(labelCanvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.9, 0.72, 1);

  return sprite;
}

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

function updateCards() {
  cards.forEach((card, index) => {
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
  if (glowEl) {
    glowEl.style.opacity = String(Math.min(progress * 1.5, 1));
    glowEl.style.transform = `translate3d(0, ${(1 - progress) * 32}%, 0) scale(${0.55 + progress * 0.65})`;
  }
  if (outroEl) {
    const op = THREE.MathUtils.smoothstep(progress, 0.86, 0.98);
    outroEl.style.opacity = String(op);
    outroEl.style.transform = `translate3d(0, ${(1 - op) * 34}px, 0)`;
  }
  if (gltfModel) {
    gltfModel.scale.setScalar(0.001 + progress * rocketMax);
    gltfModel.position.y = -3.5 + progress * 10;
    gltfModel.rotation.y = -theta * 0.25;
  }
  mainGroup.position.y = groupY;
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
  trigger?.getTween(true)?.kill();
  focus.scrubTween = trigger?.getTween();
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
  // carte (et son label) au premier plan
  card.renderOrder = 10;
  card.children.forEach((c) => { c.renderOrder = 10; });
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.body.classList.add('is-focus');
  lockScroll();
  gsap.to(card.children[0]?.material ?? {}, { opacity: 0, duration: 0.2 });
  cards.forEach((c) => {
    if (c === card) return;
    gsap.to(c.userData.uniforms.dim, { value: 1, duration: 0.5 });
    gsap.to(c.userData.uniforms.fade, { value: 1, duration: 0.7, ease: 'power2.out' });
    gsap.to(c.children[0]?.material ?? {}, { opacity: 0, duration: 0.4 });
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
  card.children.forEach((c) => { c.renderOrder = 0; });
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
      // en dernier : si resume() jette, le DOM est déjà restauré
      focus.scrubTween?.resume();
      gsap.to(u.amp, { value: 0.3, duration: 0.4, overwrite: true });
    }
  })
    .to(card.userData.focusAmt, { value: 0, duration: 0.9, ease: 'power3.inOut' }, 0)
    .to(u.focus, { value: 0, duration: 0.9, ease: 'power2.inOut' }, 0)
    // retour à la texture tuile à mi-vol retour
    .call(card.userData.setFull, [false], 0.45);
  gsap.to(card.children[0]?.material ?? {}, { opacity: 1, duration: 0.3, delay: 0.5 });
  cards.forEach((c) => {
    gsap.to(c.userData.uniforms.dim, { value: 0, duration: 0.5 });
    if (c === card) return;
    gsap.to(c.userData.uniforms.fade, { value: 0, duration: 0.6 });
    gsap.to(c.children[0]?.material ?? {}, { opacity: 1, duration: 0.5, delay: 0.4 });
  });
  setFocused(null);
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
  const margin = Math.min(22, width * 0.04);
  // la caption verre se superpose en bas (z-index 10 + ::after) : la card
  // descend jusqu'au bord — preview quasi plein écran comme l'ancien overlay
  const previewBottom = height - margin;
  const previewHeight = Math.max(1, previewBottom - margin);
  const centerY = (margin + previewBottom) / 2;
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  focusWorld.addScaledVector(up, (0.5 - centerY / height) * viewH);
  coverScale = Math.min(
    (viewH * camera.aspect * (width - 2 * margin) / width) / 2.2,
    (viewH * previewHeight / height) / (1.45 * (2.2 / (1.45 * 1.5)))
  );
};
resize();
window.addEventListener('resize', resize);

// Animate
let isVisible = true;
let isInViewport = true;
let rafId;

// Pause quand l'onglet est caché
document.addEventListener('visibilitychange', () => {
  isVisible = !document.hidden;
  if (isVisible && isInViewport && !rafId) animate();
});

// Pause quand la section n'est pas dans le viewport
if (scrollSection) {
  const visObserver = new IntersectionObserver(([entry]) => {
    isInViewport = entry.isIntersecting;
    if (isInViewport && isVisible && !rafId) animate();
  }, { threshold: 0.05 });
  visObserver.observe(scrollSection);
}

function animate(t=0) {
  rafId = requestAnimationFrame(animate);

  if (!isVisible || !isInViewport) {
    rafId = null;
    return;
  }

  if (focus.phase === 'idle') theta = scr.v;
  updateCards();
  cards.forEach(c => {
    if (c.userData.uniforms.amp.value > 0) {
      c.userData.uniforms.time.value = t*0.001;
    }
  });
  renderer.render(scene, camera);
}
animate();