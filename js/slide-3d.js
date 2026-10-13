import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

/* ================================================================
   slide-3d.js — portage vanilla de RECKLESS-CUP Slide.jsx +
   ModelViewer2.jsx : 3 canvas GLB empilés en cercle, transitions
   wipe encre (shader onBeforeCompile), tabs + anneau SVG rotatif.
   ================================================================ */

const INK_FRAMES = 49;
const INK_FRAME_WIDTH = 160;

const accentHex = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--rk-accent').trim();
    return v || '#3fc5ff';
};
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* split mot à mot : chaque mot devient un masque inline
   (.reveal-mask--w > .reveal-in) — les espaces sont préservés et les
   sous-éléments (span accent du h1, etc.) gardés via récursion.
   Retourne les .reveal-in créés pour être animés en stagger. */
const splitWords = (el) => {
    [...el.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            node.textContent.split(/(\s+)/).forEach((part) => {
                if (!part) return;
                if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                const mask = document.createElement('span');
                mask.className = 'reveal-mask reveal-mask--w';
                const inner = document.createElement('span');
                inner.className = 'reveal-in';
                inner.textContent = part;
                mask.appendChild(inner);
                frag.appendChild(mask);
            });
            el.replaceChild(frag, node);
        } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('reveal-mask--w')) {
            /* sous-élément stylé (span accent…) : masqué en bloc, sans
               split interne — les spans imbriqués casseraient un
               éventuel background-clip:text et la couleur du mot */
            const mask = document.createElement('span');
            mask.className = 'reveal-mask reveal-mask--w';
            node.classList.add('reveal-in');
            el.replaceChild(mask, node);
            mask.appendChild(node);
        }
    });
    return el.querySelectorAll('.reveal-mask--w > .reveal-in');
};

/* ---------- texture encre partagée (une seule pour les 3 canvas) ---------- */
let sharedInkTexture = null;
const getInkTexture = () => {
    if (!sharedInkTexture) {
        sharedInkTexture = new THREE.TextureLoader().load('assets/inkmask/inkmask_bottom_webgl.png');
        sharedInkTexture.minFilter = THREE.LinearFilter;
        sharedInkTexture.magFilter = THREE.LinearFilter;
        sharedInkTexture.generateMipmaps = false;
    }
    return sharedInkTexture;
};

const createInkApi = (initialProgress) => ({
    progress: { value: initialProgress },
    rootInverse: { value: new THREE.Matrix4() },
    localBounds: { value: new THREE.Vector4(0, 0, 1, 1) },
    edge: { value: new THREE.Color(accentHex()) },
    materials: new Set(),
    root: null,
    tween: null,
});

// wipe encre sur le matériau du modèle, lu en espace LOCAL du gltf (bbox XY)
const applyInkMask = (material, api) => {
    if (api.materials.has(material)) return;
    api.materials.add(material);
    const previousCompile = material.onBeforeCompile;
    material.onBeforeCompile = (shader, rendererContext) => {
        previousCompile?.call(material, shader, rendererContext);
        shader.uniforms.uInkProgress = api.progress;
        shader.uniforms.uInkMask = { value: getInkTexture() };
        shader.uniforms.uInkRootInverse = api.rootInverse;
        shader.uniforms.uInkLocalBounds = api.localBounds;
        shader.uniforms.uInkEdge = api.edge;
        shader.vertexShader = shader.vertexShader
            .replace('void main() {', `
            uniform mat4 uInkRootInverse;
            varying vec3 vInkLocalPosition;
            void main() {`)
            .replace('#include <begin_vertex>', `
            #include <begin_vertex>
            vInkLocalPosition = (uInkRootInverse * modelMatrix * vec4(transformed, 1.0)).xyz;`);
        shader.fragmentShader = shader.fragmentShader
            .replace('void main() {', `
            uniform float uInkProgress;
            uniform sampler2D uInkMask;
            uniform vec4 uInkLocalBounds;
            uniform vec3 uInkEdge;
            varying vec3 vInkLocalPosition;
            float readInkFrame(vec2 uv, float frame) {
                float x = mix(${0.5 / INK_FRAME_WIDTH}, ${1 - 0.5 / INK_FRAME_WIDTH}, clamp(uv.x, 0.0, 1.0));
                return texture2D(uInkMask, vec2((x + frame) / ${INK_FRAMES}.0, 1.0 - clamp(uv.y, 0.0, 1.0))).a;
            }
            void main() {`)
            .replace('#include <dithering_fragment>', `
            if (uInkProgress < 1.0) {
                // direction inversée : le wipe parcourt le modèle en sens opposé
                vec2 inkUV = vec2(
                    (vInkLocalPosition.x - uInkLocalBounds.x) / uInkLocalBounds.z,
                    1.0 - (vInkLocalPosition.y - uInkLocalBounds.y) / uInkLocalBounds.w
                );
                // interpolation entre les 2 frames les plus proches
                float framePos = clamp(uInkProgress * ${INK_FRAMES - 1}.0, 0.0, ${INK_FRAMES - 1}.0);
                float frameA = floor(framePos);
                float frameB = min(frameA + 1.0, ${INK_FRAMES - 1}.0);
                float inkAlpha = mix(
                    readInkFrame(inkUV, frameA),
                    readInkFrame(inkUV, frameB),
                    fract(framePos)
                );
                if (inkAlpha >= 0.5) discard;
                float inkEdgeMix = smoothstep(0.32, 0.5, inkAlpha);
                gl_FragColor.rgb = mix(gl_FragColor.rgb, uInkEdge, inkEdgeMix * 0.65);
            }
            #include <dithering_fragment>`);
    };
    material.customProgramCacheKey = () => 'services-ink-mask-v1';
    material.needsUpdate = true;
};

const prepareInkModel = (scene, api) => {
    scene.updateMatrixWorld(true);
    const rootWorldInverse = new THREE.Matrix4().copy(scene.matrixWorld).invert();
    const meshToRoot = new THREE.Matrix4();
    const localBox = new THREE.Box3();
    const childBox = new THREE.Box3();
    localBox.makeEmpty();
    scene.traverse((child) => {
        if (!child.isMesh || !child.geometry) return;
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
        meshToRoot.multiplyMatrices(rootWorldInverse, child.matrixWorld);
        childBox.copy(child.geometry.boundingBox).applyMatrix4(meshToRoot);
        localBox.union(childBox);
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.filter(Boolean).forEach((m) => applyInkMask(m, api));
    });
    if (localBox.isEmpty()) return;
    const size = localBox.getSize(new THREE.Vector3());
    api.localBounds.value.set(localBox.min.x, localBox.min.y, Math.max(size.x, 0.001), Math.max(size.y, 0.001));
    api.root = scene;
    api.rootInverse.value.copy(rootWorldInverse);
};

const tweenInk = (api, target, duration) => new Promise((resolve) => {
    if (!api) { resolve(); return; }
    api.tween?.kill();
    if (reducedMotion() || api.progress.value === target) {
        api.progress.value = target;
        resolve();
        return;
    }
    api.tween = gsap.to(api.progress, {
        value: target,
        duration,
        ease: 'none',
        onComplete: resolve,
        onInterrupt: resolve,
    });
});

/* ---------- viewer WebGL par slide (port de ModelViewer2 vanilla) ---------- */
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(new DRACOLoader().setDecoderPath('assets/draco/gltf/'));

// direction de caméra identique au composant R3F d'origine
const CAM_DIR = new THREE.Vector3(-340.09054075642035, 1498.358031892999, -711.1781253974611).normalize();

const createViewer = (host, gltfPath, initialProgress) => {
    const canvas = document.createElement('canvas');
    host.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 5000);

    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(0, 10, 10);
    scene.add(dirLight);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.5));
    const ptLight = new THREE.PointLight(0xffffff, 2);
    ptLight.position.set(-10, -10, -10);
    scene.add(ptLight);
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(10, 20, 10);
    spotLight.angle = 0.2;
    spotLight.penumbra = 1;
    scene.add(spotLight);

    // orbit : rotation uniquement — pas de pan/zoom, le cadrage reste
    // celui du fit Bounds. touch-action pan-y sinon OrbitControls pose
    // 'none' et piège le scroll vertical sur mobile (cf. Hero2 RECKLESS)
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.rotateSpeed = 0.6;
    controls.target.set(0, 0, 0);
    canvas.style.touchAction = 'pan-y';

    const api = createInkApi(initialProgress);
    const viewer = {
        api, ready: false, running: initialProgress === 1, visible: true,
        model: null, disposed: false, rafId: null,
        clock: new THREE.Clock(),
    };

    const resize = () => {
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    };
    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(host);
    resize();

    // IntersectionObserver : on ne rend que quand visible
    new IntersectionObserver(([entry]) => { viewer.visible = entry.isIntersecting; }, { threshold: 0.05 }).observe(host);

    gltfLoader.load(gltfPath, (gltf) => {
        if (viewer.disposed) return;
        const model = gltf.scene;
        const group = new THREE.Group();

        // équivalent drei <Center> : le modèle est recentré à l'origine
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(center);
        group.add(model);
        scene.add(group);
        scene.updateMatrixWorld(true);

        // équivalent drei <Bounds fit clip margin={1.8}> : distance caméra
        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        maxDimRef.value = maxDim;
        const fov = camera.fov * (Math.PI / 180);
        const dist = (maxDim / 2) / Math.tan(fov / 2) * 1.8;
        camera.position.copy(CAM_DIR.clone().multiplyScalar(dist));
        camera.lookAt(0, 0, 0);
        camera.near = Math.max(0.01, dist / 100);
        camera.far = dist * 10;
        camera.updateProjectionMatrix();
        controls.update();

        prepareInkModel(group, api);

        // spring scale 0.7 -> 1 (ex useSpring, duration ~1s)
        group.scale.setScalar(0.7);
        if (reducedMotion()) group.scale.setScalar(1);
        else gsap.to(group.scale, { x: 1, y: 1, z: 1, duration: 1, ease: 'power2.out' });

        viewer.model = group;
        viewer.ready = true;
    }, undefined, (err) => console.warn('slide model unavailable', err));

    // boucle : wobble rotation + bob y (port des springs de ModelViewer2)
    const loop = () => {
        if (viewer.disposed) return;
        viewer.rafId = requestAnimationFrame(loop);
        const t = viewer.clock.getElapsedTime();
        if (viewer.model) {
            const g = viewer.model;
            // springs RECKLESS : les valeurs [-15,45,-3] sont des RADIANS
            // bruts (a.primitive les applique tels quels à l'Euler) — pas
            // de degToRad sinon l'orientation de base diffère du site source
            g.rotation.set(
                -15 + Math.cos(t / 4) / 8,
                45 + Math.sin(t / 3) / 4,
                -3 + Math.sin(t / 2) / 8
            );
            // bob /7 brut comme le positionSpring — le facteur maxDim/4
            // déportait le modèle de plusieurs tailles d'écran
            g.position.y = (0.5 + Math.cos(t / 2)) / 7;
        }
        // uInkRootInverse suit le matrixWorld tant que l'encre n'est pas finie
        if (api.root && api.progress.value < 1) {
            api.root.updateMatrixWorld(true);
            api.rootInverse.value.copy(api.root.matrixWorld).invert();
        }
        if (viewer.visible && viewer.running) {
            controls.update();
            renderer.render(scene, camera);
        }
    };
    const maxDimRef = { value: 1 };
    loop();

    return {
        set: (v) => { api.tween?.kill(); api.progress.value = v; },
        erase: (d = 0.85) => tweenInk(api, 0, d),
        reveal: (d = 1.05) => tweenInk(api, 1, d),
        setRunning: (v) => { viewer.running = v; },
    };
};

/* ---------- init ---------- */
window.addEventListener('DOMContentLoaded', () => {
    const slideWrap = document.getElementById('slideVisual');
    if (!slideWrap || typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const SLIDES = [
        { model: 'assets/3d/slides/pc.glb', name: 'Web development', desc: 'Modern responsive websites and web applications built around your business needs.' },
        { model: 'assets/3d/pencil.glb', name: 'UI/UX Design', desc: 'Interfaces, prototypes and visual design — clean layouts that users understand instantly.' },
        { model: 'assets/3d/slides/floating_low_poly_island.glb', name: 'Bug fixing & maintenance', desc: 'Fix existing frontend/backend issues, improve UI, refactor code and add new features.' },
    ];

    const views = SLIDES.map((_, i) => document.getElementById(`slide-${i}`));
    const tabs = [...document.querySelectorAll('#slideTabs .slide__service')];
    const caption = document.getElementById('slideCaption');

    // un viewer par host .imgyy ; le 1er est révélé, les autres encrés
    const viewers = SLIDES.map((s, i) => {
        const host = views[i].querySelector('.imgyy');
        return createViewer(host, s.model, i === 0 ? 1 : 0);
    });

    let activeIndex = 0;
    let isAnimating = false;
    let pendingIndex = null;
    const running = new Set([0]);

    const updateDom = () => {
        views.forEach((v, i) => { v.style.zIndex = i === activeIndex ? 3 : 1; });
        tabs.forEach((t, i) => {
            t.classList.toggle('is-active', i === activeIndex);
            t.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
        });
        // caption : on recrée l'inner pour rejouer l'animation d'entrée
        const inner = document.createElement('div');
        inner.className = 'slide-caption__inner';
        inner.innerHTML = `<strong>${SLIDES[activeIndex].name}</strong><span>${SLIDES[activeIndex].desc}</span>`;
        caption.replaceChildren(inner);
    };

    const applyRunning = () => viewers.forEach((v, i) => v.setRunning(running.has(i)));

    const handleSlideChange = (newIndex) => {
        const current = activeIndex;
        if (newIndex === current) return;
        // transition en cours : on mémorise la demande au lieu d'ignorer le clic
        if (isAnimating) { pendingIndex = newIndex; return; }
        isAnimating = true;

        // feedback instantané : icône/caption changent tout de suite
        activeIndex = newIndex;
        updateDom();

        const outApi = viewers[current];
        const inApi = viewers[newIndex];
        inApi?.set(0);
        running.clear(); running.add(current); running.add(newIndex);
        applyRunning();

        const finish = () => {
            running.clear(); running.add(activeIndex); applyRunning();
            isAnimating = false;
            const next = pendingIndex;
            pendingIndex = null;
            if (next !== null && next !== activeIndex) handleSlideChange(next);
        };

        if (!outApi || !inApi || reducedMotion()) {
            outApi?.set(0);
            inApi?.set(1);
            finish();
            return;
        }

        outApi.erase(0.85)
            .then(() => inApi.reveal(1.05))
            .then(finish);
    };

    tabs.forEach((tab, i) => tab.addEventListener('click', () => handleSlideChange(i)));

    // nav clavier tablist (flèches)
    document.getElementById('slideTabs')?.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        handleSlideChange((activeIndex + dir + SLIDES.length) % SLIDES.length);
    });

    /* ---------- animations (port de l'useEffect de Slide.jsx) ---------- */
    const spin = gsap.fromTo('#slideRingSvg', { rotateZ: 0 }, { duration: 10, rotateZ: 360, repeat: -1, ease: 'linear' });
    if (reducedMotion()) spin.pause();

    // entrée du visuel : fade + montée légère, pas de scale (canvas webgl)
    gsap.fromTo(slideWrap,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', delay: 0.05,
          scrollTrigger: { trigger: slideWrap, start: 'top 100%', once: true } });

    // intro colonne gauche : titre par masques blocs + body mot à mot
    const side = document.getElementById('slideSide');
    const body = document.getElementById('slideBody');
    if (body && !body.querySelector('.reveal-mask--w')) {
        // split mot à mot (port de MaskText words)
        const words = body.textContent.split(/\s+/).filter(Boolean);
        body.innerHTML = words.map((w) =>
            `<span class="reveal-mask reveal-mask--w"><span class="reveal-in">${w}</span></span>`
        ).join(' ');
    }
    if (side) {
        const blocks = side.querySelectorAll('.reveal-mask:not(.reveal-mask--w) > .reveal-in');
        const wordsEls = side.querySelectorAll('.reveal-mask--w > .reveal-in');
        const st = { trigger: side, start: 'top 84%', toggleActions: 'play none none none' };
        gsap.fromTo(blocks, { yPercent: 125, opacity: 0 },
            { yPercent: 0, opacity: 1, stagger: 0.12, duration: 0.7, ease: 'power3.out', scrollTrigger: st });
        gsap.fromTo(wordsEls, { yPercent: 130, opacity: 0 },
            { yPercent: 0, opacity: 1, stagger: 0.025, duration: 0.55, ease: 'power3.out', scrollTrigger: st, delay: 0.15 });
    }

    // titres de section : reveal MOT À MOT (stagger propre) — avant,
    // un seul bloc .reveal-in par titre, et les titres sans wrapper
    // .reveal-mask ("Recent Projects", "My adventures", footer)
    // n'avaient aucune animation
    document.querySelectorAll('.tn-title').forEach((title) => {
        const words = splitWords(title);
        if (!words.length) return;
        gsap.fromTo(words,
            { yPercent: 125, opacity: 0 },
            { yPercent: 0, opacity: 1, stagger: 0.07, duration: 0.75, ease: 'power3.out',
              scrollTrigger: { trigger: title, start: 'top 86%', toggleActions: 'play none none none' } });
    });

    ScrollTrigger.refresh();
});
