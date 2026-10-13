import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/DRACOLoader.js';
import { FontLoader, TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/Addons.js';

/* ================================================================
   hero-rk.js — portage vanilla de RECKLESS-CUP Hero2.jsx
   scène 3D (hand + stone en reveal encre), galaxie, texte 3D,
   parallaxe souris, étoiles 2D, intro GSAP
   ================================================================ */

const accentHex = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--rk-accent').trim();
    return v || '#3fc5ff';
};
const accentRgba = (a = 1) => {
    const c = new THREE.Color(accentHex());
    return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${a})`;
};

window.addEventListener('DOMContentLoaded', () => {
    const hero = document.getElementById('accueil');
    const canvas = document.getElementById('heroWebgl');
    const starCanvas = document.getElementById('heroStars');
    if (!hero || !canvas) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let modelReady = false;
    let inView = true;
    let introPlayed = false;
    let intro3d = null;
    /* l'intro attend la fin du loader : jouer pendant que les bandes
       montent encore rendait le hero déjà posé à la révélation —
       tout paraissait trop rapide */
    let loaderDone = !document.querySelector('.loaderXd');
    window.addEventListener('et-loader-done', () => {
        loaderDone = true;
        maybePlayCopyIntro();
        maybePlayIntro();
    });

    /* ---------- copy reveal (porté de Hero2 useLayoutEffect/useEffect) ---------- */
    gsap.set('.hero-animate', { autoAlpha: 0, y: 42 });
    gsap.set('.hero-copy h1', { clipPath: 'inset(0 0 100% 0)', y: 56 });
    gsap.set('.hero-signal', { autoAlpha: 0, x: 28 });

    const playCopyIntro = () => {
        if (reduced) {
            gsap.set('.hero-animate, .hero-copy h1, .hero-signal', { autoAlpha: 1, x: 0, y: 0, clipPath: 'none' });
            return;
        }
        gsap.timeline({ defaults: { ease: 'power3.out' } })
            .to('.hero-eyebrow', { autoAlpha: 1, y: 0, duration: 0.65 }, 0.12)
            .to('.hero-copy h1', { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 1 }, 0.2)
            .to('.hero-description', { autoAlpha: 1, y: 0, duration: 0.75 }, 0.58)
            .to('.hero-copy .hero--btn', { autoAlpha: 1, y: 0, duration: 0.7 }, 0.72)
            .to('.hero-signal', { autoAlpha: 1, x: 0, duration: 0.8 }, 0.7);
    };

    /* le copy ne dépend QUE du loader + visibilité — avant il attendait
       aussi modelReady, donc le LCP (.hero-description) restait masqué
       jusqu'à l'arrivée des GLB (ou le filet de 4s) */
    let copyPlayed = false;
    const maybePlayCopyIntro = () => {
        if (copyPlayed || !inView || !loaderDone) return;
        copyPlayed = true;
        playCopyIntro();
    };

    const maybePlayIntro = () => {
        if (!modelReady || !inView || introPlayed || !loaderDone) return;
        introPlayed = true;
        // filet : le copy doit déjà avoir joué via et-loader-done
        maybePlayCopyIntro();
        try { intro3d?.(); } catch (err) { console.warn('hero intro3d skipped', err); }
    };

    const heroIO = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        maybePlayCopyIntro();
        maybePlayIntro();
    }, { threshold: 0.25 });
    heroIO.observe(hero);

    /* filet : si les modèles tardent (>4s), on débloque quand même l'intro —
       pire cas = reveal encre déjà fini quand les GLB arrivent */
    setTimeout(() => { modelReady = true; maybePlayIntro(); }, 4000);

    /* ---------- renderer ---------- */
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas });
    } catch {
        canvas.style.display = 'none';
        hero.classList.add('hero--fallback');
        modelReady = true;
        maybePlayIntro();
        return;
    }
    canvas.style.display = 'block';
    hero.classList.remove('hero--fallback');
    canvas.setAttribute('aria-hidden', 'true');

    let disposed = false;
    let frame;

    const disposeObject = (object) => object.traverse((child) => {
        child.geometry?.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.filter(Boolean).forEach((material) => {
            Object.values(material).forEach((value) => { if (value?.isTexture) value.dispose(); });
            material.dispose();
        });
    });

    /* ---------- textures ---------- */
    const textureLoader = new THREE.TextureLoader();
    const matcapTexture = textureLoader.load('assets/textures/matcaps/4.png');
    const matcapTexture2 = textureLoader.load('assets/textures/matcaps/8.png');
    const particleTexture = textureLoader.load('assets/textures/particles/9.png');
    const inkMaskTexture = textureLoader.load('assets/inkmask/inkmask_bottom_webgl.png');
    inkMaskTexture.minFilter = THREE.LinearFilter;
    inkMaskTexture.magFilter = THREE.LinearFilter;
    inkMaskTexture.generateMipmaps = false;

    /* ---------- reveal encre screen-space (49 frames) ---------- */
    const INK_FRAMES = 49;
    const INK_FRAME_WIDTH = 160;
    const inkHand = { value: 0 };
    const inkCube = { value: 0 };
    const inkEdge = { value: new THREE.Color(accentHex()) };
    const inkTargets = [];
    const sceneFade = { value: 0 };

    const applyInkReveal = (material, progress, bounds) => {
        material.onBeforeCompile = (shader) => {
            shader.uniforms.uInkProgress = progress;
            shader.uniforms.uInkMask = { value: inkMaskTexture };
            shader.uniforms.uInkBounds = bounds;
            shader.uniforms.uInkEdge = inkEdge;
            shader.fragmentShader = shader.fragmentShader
                .replace('void main() {', `
        uniform float uInkProgress;
        uniform sampler2D uInkMask;
        uniform vec4 uInkBounds;
        uniform vec3 uInkEdge;
        float readInkFrame(vec2 uv, float frame) {
            float x = mix(${0.5 / INK_FRAME_WIDTH}, ${1 - 0.5 / INK_FRAME_WIDTH}, clamp(uv.x, 0.0, 1.0));
            return texture2D(uInkMask, vec2((x + frame) / ${INK_FRAMES}.0, clamp(uv.y, 0.0, 1.0))).a;
        }
        void main() {`)
                .replace('#include <dithering_fragment>', `
        if (uInkProgress < 1.0) {
            vec2 inkUV = vec2(
                (gl_FragCoord.x - uInkBounds.x) / uInkBounds.z,
                (gl_FragCoord.y - uInkBounds.y) / uInkBounds.w
            );
            float framePosition = uInkProgress * ${INK_FRAMES - 1}.0;
            float frameLow = floor(framePosition);
            float frameHigh = min(ceil(framePosition), ${INK_FRAMES - 1}.0);
            float inkA = mix(
                readInkFrame(inkUV, frameLow),
                readInkFrame(inkUV, frameHigh),
                fract(framePosition)
            );
            if (inkA >= 0.5) discard;
            float inkEdgeMix = smoothstep(0.32, 0.5, inkA);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, uInkEdge, inkEdgeMix * 0.65);
        }
        #include <dithering_fragment>`);
        };
        material.needsUpdate = true;
    };

    const prepareInkModel = (root, progress) => {
        const bounds = { value: new THREE.Vector4(0, 0, 1, 1) };
        root.traverse((child) => {
            if (!child.isMesh) return;
            child.material = new THREE.MeshMatcapMaterial({ matcap: matcapTexture2 });
            applyInkReveal(child.material, progress, bounds);
        });
        inkTargets.push({ root, progress, bounds });
    };

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(new DRACOLoader().setDecoderPath('assets/draco/gltf/'));

    const scene = new THREE.Scene();

    /* ---------- particules ---------- */
    const material = new THREE.PointsMaterial();
    material.transparent = true;
    material.opacity = 0;
    material.alphaMap = particleTexture;
    material.depthWrite = false;
    material.vertexColors = true;
    material.size = 0.02;
    material.sizeAttenuation = true;

    const particlesGeometry = new THREE.BufferGeometry();
    const count = 500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 10;
        colors[i] = Math.random();
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particle = new THREE.Points(particlesGeometry, material);
    particle.position.x = 0;

    /* ---------- galaxie ---------- */
    const params = {};
    params.count = 7500;
    params.size = 0.002;
    params.radius = 2;
    params.branches = 3;
    params.randomness = 1;
    params.randomnessPower = 10;
    params.insideColor = accentHex();
    params.outsideColor = '#31458d';

    let geometryGalaxy = null;
    let materialGalaxy = null;
    let pointsGalaxy = null;

    const generateGalaxy = () => {
        if (pointsGalaxy != null) {
            geometryGalaxy.dispose();
            materialGalaxy.dispose();
            scene.remove(pointsGalaxy);
        }
        geometryGalaxy = new THREE.BufferGeometry();
        const gPositions = new Float32Array(params.count * 3);
        const gColors = new Float32Array(params.count * 3);
        const scales = new Float32Array(params.count);
        const randomness = new Float32Array(params.count * 3);
        const insideColor = new THREE.Color(params.insideColor);
        const outsideColor = new THREE.Color(params.outsideColor);

        for (let i = 0; i < params.count; i++) {
            const i3 = i * 3;
            const radius = Math.random() * params.radius;
            const branchAngle = (i % params.branches) / params.branches * Math.PI * 2;
            gPositions[i3] = Math.cos(branchAngle) * radius;
            gPositions[i3 + 1] = 0.0 * radius;
            gPositions[i3 + 2] = Math.sin(branchAngle) * radius;
            const randomX = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * radius;
            const randomY = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * radius;
            const randomZ = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * radius;
            randomness[i3] = randomX;
            randomness[i3 + 1] = randomY;
            randomness[i3 + 2] = randomZ;
            const mixedColor = insideColor.clone();
            mixedColor.lerp(outsideColor, radius / params.radius);
            gColors[i3] = mixedColor.r;
            gColors[i3 + 1] = mixedColor.g;
            gColors[i3 + 2] = mixedColor.b;
            scales[i] = Math.random();
        }

        geometryGalaxy.setAttribute('position', new THREE.BufferAttribute(gPositions, 3));
        geometryGalaxy.setAttribute('color', new THREE.BufferAttribute(gColors, 3));
        geometryGalaxy.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
        geometryGalaxy.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));

        materialGalaxy = new THREE.ShaderMaterial({
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            vertexShader: `
                uniform float uSize;
                uniform float uTime;
                attribute float aScale;
                attribute vec3 aRandomness;
                varying vec3 vColor;
                void main(){
                    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                    float angle = atan(modelPosition.x, modelPosition.z);
                    float distanceToCenter = length(modelPosition.xz);
                    float angleOffset = ( 1.0 / distanceToCenter ) * uTime * 0.2;
                    angle += angleOffset;
                    modelPosition.x = cos(angle);
                    modelPosition.z = sin(angle);
                    modelPosition.xyz += aRandomness;
                    vec4 viewPosition = viewMatrix * modelPosition;
                    vec4 projectedPosition = projectionMatrix * viewPosition;
                    gl_Position = projectedPosition;
                    gl_PointSize = uSize * aScale;
                    gl_PointSize *= (1.0 / -viewPosition.z);
                    vColor = color;
                }`,
            fragmentShader: `
                uniform float uFade;
                varying vec3 vColor;
                void main(){
                    float s = distance (gl_PointCoord, vec2 (0.5));
                    s  = 1.0 - s;
                    s  = pow(s, 10.0);
                    vec3 color = mix(vec3(0.0), vColor, s);
                    gl_FragColor = vec4(color * uFade, 1.0);
                }`,
            uniforms: {
                uSize: { value: 30 * renderer.getPixelRatio() },
                uTime: { value: 0 },
                uFade: sceneFade
            }
        });
        pointsGalaxy = new THREE.Points(geometryGalaxy, materialGalaxy);
        scene.add(pointsGalaxy);
    };

    /* ---------- modèles ---------- */
    const loadModel = (url) => new Promise((resolve, reject) => {
        gltfLoader.load(url,
            (gltf) => {
                if (disposed) { disposeObject(gltf.scene); resolve(null); return; }
                gltf.scene.scale.set(0.5, 0.5, 0.5);
                gltf.scene.position.y = -4;
                gltf.scene.rotation.x = Math.PI * 0.25;
                gltf.scene.rotation.y = Math.PI;
                prepareInkModel(gltf.scene, inkHand);
                scene.add(gltf.scene);
                resolve(gltf.scene);
            }, undefined, reject);
    });

    let mixer;
    const loadModel2 = (url) => new Promise((resolve, reject) => {
        gltfLoader.load(url,
            (gltf) => {
                if (disposed) { disposeObject(gltf.scene); resolve(null); return; }
                if (gltf.animations && gltf.animations.length > 0) {
                    mixer = new THREE.AnimationMixer(gltf.scene);
                    mixer.clipAction(gltf.animations[1] || gltf.animations[0]).play();
                }
                gltf.scene.traverse((child) => {
                    if (child.name === 'Cylinder001_4' || child.name === 'Cylinder_3') child.visible = false;
                });
                gltf.scene.scale.set(0.7, 0.7, 0.7);
                prepareInkModel(gltf.scene, inkCube);
                scene.add(gltf.scene);
                resolve(gltf.scene);
            }, undefined, reject);
    });

    /* ---------- texte 3D ---------- */
    let textMat;
    const fontLoader = new FontLoader();
    fontLoader.load('assets/fonts/jetbrains_mono_bold.typeface.json', (font) => {
        if (disposed) return;
        const textGeometry = new TextGeometry('<Eleo/>', {
            font, size: 0.5, height: 0.2, curveSegments: 5,
            bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelOffset: 0.02, bevelSegments: 5
        });
        textGeometry.center();
        textMat = new THREE.MeshMatcapMaterial();
        textMat.matcap = matcapTexture;
        textMat.transparent = true;
        textMat.opacity = sceneFade.value;
        const text = new THREE.Mesh(textGeometry, textMat);
        text.position.y = 1.5;
        scene.add(text);
    });

    /* ---------- lumières ---------- */
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const pointLight = new THREE.PointLight(0xffffff, 0.7);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    /* ---------- sizes (container, pas window : barre d'adresse mobile) ---------- */
    const host = canvas.parentElement || canvas;
    const sizes = { width: host.clientWidth, height: host.clientHeight };
    const onResize = () => {
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (w === 0 || h === 0 || (w === sizes.width && h === sizes.height)) return;
        sizes.width = w;
        sizes.height = h;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    };
    const heroResizeObs = new ResizeObserver(onResize);
    heroResizeObs.observe(host);

    /* ---------- caméra + controls ---------- */
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
    const portrait = sizes.width / sizes.height < 0.85;
    const cameraTarget = {
        x: portrait ? 0 : 0.5,
        y: portrait ? -2.8 : -1.8,
        z: portrait ? 7.4 : 5,
    };
    camera.position.set(cameraTarget.x - 0.35, cameraTarget.y + 0.45, cameraTarget.z + 1.4);
    scene.position.set(0, 0.35, 0);
    scene.rotation.set(-0.12, -0.16, 0);
    scene.add(camera);

    const controls = new OrbitControls(camera, canvas);
    // tactile : le drag vertical doit scroller la page, pas tourner la scène
    canvas.style.touchAction = 'pan-y pinch-zoom';
    controls.touches.ONE = null;
    controls.touches.TWO = null;
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.enablePan = false;

    // parallaxe souris (quickTo + expo)
    const par = { x: 0, y: 0 };
    const parXTo = gsap.quickTo(par, 'x', { duration: 1, ease: 'expo' });
    const parYTo = gsap.quickTo(par, 'y', { duration: 1, ease: 'expo' });
    const onParMove = (e) => {
        if (e.pointerType !== 'mouse') return;
        parXTo((e.clientX / window.innerWidth - 0.5) * 2);
        parYTo((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener('pointermove', onParMove);

    controls.enabled = !reduced;
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    /* ---------- fond de scène = --rk-hero-bg ---------- */
    const readElev = () =>
        getComputedStyle(document.documentElement).getPropertyValue('--rk-hero-bg').trim()
        || getComputedStyle(document.documentElement).getPropertyValue('--rk-elev').trim()
        || '#e9eef4';
    scene.background = new THREE.Color(readElev());
    const themeObserver = new MutationObserver(() => scene.background.set(readElev()));
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    /* ---------- bounds écran de l'encre ---------- */
    const modelBox = new THREE.Box3();
    const meshBox = new THREE.Box3();
    const projectedCorner = new THREE.Vector3();
    const updateInkBounds = () => {
        inkTargets.forEach(({ root, progress, bounds }) => {
            if (progress.value >= 1) return;
            modelBox.makeEmpty();
            root.traverseVisible((child) => {
                if (!child.isMesh || !child.geometry) return;
                if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
                meshBox.copy(child.geometry.boundingBox).applyMatrix4(child.matrixWorld);
                modelBox.union(meshBox);
            });
            if (modelBox.isEmpty()) return;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (let i = 0; i < 8; i += 1) {
                projectedCorner.set(
                    i & 1 ? modelBox.max.x : modelBox.min.x,
                    i & 2 ? modelBox.max.y : modelBox.min.y,
                    i & 4 ? modelBox.max.z : modelBox.min.z,
                ).project(camera);
                const x = (projectedCorner.x * 0.5 + 0.5) * canvas.width;
                const y = (projectedCorner.y * 0.5 + 0.5) * canvas.height;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
            const padding = Math.max(10 * renderer.getPixelRatio(), Math.max(maxX - minX, maxY - minY) * 0.06);
            minX = Math.max(0, minX - padding);
            minY = Math.max(0, minY - padding);
            maxX = Math.min(canvas.width, maxX + padding);
            maxY = Math.min(canvas.height, maxY + padding);
            bounds.value.set(minX, minY, Math.max(1, maxX - minX), Math.max(1, maxY - minY));
        });
    };

    /* ---------- tick ---------- */
    const clock = new THREE.Clock();
    let inViewport = true;
    const viewportIO = new IntersectionObserver(([entry]) => {
        inViewport = entry.isIntersecting;
        // la chaine RAF s'arrête hors viewport : on la relance au retour
        if (inViewport && frame == null && !disposed) frame = window.requestAnimationFrame(tick);
    }, { threshold: 0.02 });
    if (canvas.parentElement) viewportIO.observe(canvas.parentElement);

    const tick = () => {
        if (disposed) return;
        if (!inViewport) {
            clock.getDelta();
            frame = null; // on ne schedule plus : zéro frame gâchée cachée
            return;
        }
        const delta = Math.min(clock.getDelta(), 0.05);
        const elapsedTime = clock.elapsedTime;
        if (materialGalaxy) materialGalaxy.uniforms.uTime.value = elapsedTime;
        material.opacity = sceneFade.value;
        if (textMat) textMat.opacity = sceneFade.value;
        mixer?.update(delta);
        particle.rotation.y = 0.1 * elapsedTime;
        particle.rotation.x = 0.16 * elapsedTime;
        controls.target.x = par.x * 0.4;
        controls.target.y = -par.y * 0.3;
        controls.update();
        scene.updateMatrixWorld(true);
        updateInkBounds();
        renderer.render(scene, camera);
        frame = window.requestAnimationFrame(tick);
    };

    /* ---------- intro 3D ---------- */
    intro3d = () => {
        if (disposed) return;
        if (reduced) {
            scene.position.y = 1.2;
            scene.rotation.set(0, 0, 0);
            camera.position.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);
            sceneFade.value = 1;
            inkHand.value = 1;
            inkCube.value = 1;
            renderer.render(scene, camera);
            return;
        }
        gsap.timeline({ defaults: { ease: 'power3.out' } })
            .to(scene.position, { y: 1.2, duration: 1.8 }, 0)
            .to(scene.rotation, { x: 0, y: 0, duration: 2.2, ease: 'power2.out' }, 0)
            .to(camera.position, { ...cameraTarget, duration: 2, ease: 'power3.inOut' }, 0)
            .to(sceneFade, { value: 1, duration: 1.4, ease: 'power1.inOut' }, 0)
            .to(inkHand, { value: 1, duration: 1.05, ease: 'none' }, 0.15)
            .to(inkCube, { value: 1, duration: 1.05, ease: 'none' }, 0.8);
    };

    /* ---------- init ---------- */
    const init = async () => {
        const results = await Promise.allSettled([
            loadModel('assets/models/Hand/scene.gltf'),
            loadModel2('assets/models/mysterious_stone/scene.gltf'),
        ]);
        results.filter(({ status }) => status === 'rejected').forEach(({ reason }) => {
            console.warn('Hero model unavailable', reason);
        });
        if (disposed) return;
        generateGalaxy();
        scene.add(particle);
        scene.updateMatrixWorld(true);
        updateInkBounds();
        renderer.render(scene, camera);
        // ne démarrer la boucle que si aucune chaine ne tourne déjà —
        // l'IO peut avoir kické tick() avant la fin du chargement
        if (frame == null) tick();
        modelReady = true;
        maybePlayIntro();
    };
    init();

    /* ---------- étoiles 2D (canvas .hero-stars) ---------- */
    if (starCanvas) {
        const host2 = starCanvas.parentElement;
        const ctx2 = starCanvas.getContext('2d');
        let w = starCanvas.width = host2.clientWidth;
        let h = starCanvas.height = host2.clientHeight;
        const stars = Array.from({ length: 80 }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.1 + 0.4,
            baseSpeed: Math.random() * 0.3 + 0.1,
            flicker: Math.random() * 100
        }));
        const resizeObserver = new ResizeObserver(() => {
            w = starCanvas.width = host2.clientWidth;
            h = starCanvas.height = host2.clientHeight;
        });
        resizeObserver.observe(host2);

        let starColor = accentRgba(0.9);
        let scrollBoost = 0;
        const handleScroll = () => { scrollBoost = 1.2; };
        window.addEventListener('scroll', handleScroll);

        let starsVisible = true;
        const starIO = new IntersectionObserver(([entry]) => {
            starsVisible = entry.isIntersecting;
        }, { threshold: 0.02 });
        starIO.observe(host2);

        let rafId;
        const animateStars = () => {
            if (!starsVisible) { rafId = requestAnimationFrame(animateStars); return; }
            ctx2.clearRect(0, 0, w, h);
            scrollBoost *= 0.94;
            for (const star of stars) {
                star.flicker += 0.05;
                star.x -= star.baseSpeed + scrollBoost;
                if (star.x < -2) star.x = w + 2;
                ctx2.globalAlpha = Math.max(0, 0.35 + Math.sin(star.flicker) * 0.25);
                ctx2.fillStyle = starColor;
                ctx2.beginPath();
                ctx2.arc(star.x, star.y, star.r, 0, Math.PI * 2);
                ctx2.fill();
            }
            ctx2.globalAlpha = 1;
            rafId = requestAnimationFrame(animateStars);
        };
        rafId = requestAnimationFrame(animateStars);
    }
});
