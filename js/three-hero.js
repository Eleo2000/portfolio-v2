import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';

window.addEventListener('DOMContentLoaded', () => {

  /* ================================
     CAMERA FIT
  ================================= */
  function fitCameraToObject(camera, object, offset = 1.2, lookAtY = 0, cameraY = 0) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    object.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / Math.tan(fov / 2));

    cameraZ *= offset;
    camera.position.set(0, cameraY, cameraZ);
    camera.lookAt(0, lookAtY, 0);

    camera.near = Math.max(0.01, maxDim / 500);
    camera.far = maxDim * 100;
    camera.updateProjectionMatrix();
  }

  /* ================================
     CREATE SCENE
  ================================= */
  function createScene(containerId, modelPath, offsetDesktop = 0.95, offsetMobile = 1.15, lookAtY = 0, cameraY = 0) {
    const container = document.getElementById(containerId);

    /* ---------- RENDERER ---------- */
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });

    renderer.setPixelRatio(
      window.innerWidth < 768 ? 1 : Math.min(window.devicePixelRatio, 2)
    );

    container.appendChild(renderer.domElement);

    /* ---------- SCENE ---------- */
    const scene = new THREE.Scene();

    /* ---------- CAMERA ---------- */
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.set(0, 0, 10);

    /* ---------- LIGHTS ---------- */
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    /* ---------- MODEL ---------- */
    const loader = new GLTFLoader();
    let model = null;
    let mixer = null;

    loader.load(modelPath, (gltf) => {
      model = gltf.scene;
      scene.add(model);

      fitCameraToObject(
        camera,
        model,
        container.clientWidth < 768 ? offsetMobile : offsetDesktop,
        lookAtY,
        cameraY
      );

      if (gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
          const action = mixer.clipAction(clip);
          action.setLoop(THREE.LoopOnce);
          action.clampWhenFinished = true;
          action.timeScale = 1.5;
          action.play();
        });
      }
    });

    /* ---------- RESIZE ---------- */
    function resize() {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (!width || !height) return;

      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setPixelRatio(
        width < 768 ? 1 : Math.min(window.devicePixelRatio, 2)
      );

      if (model) {
        fitCameraToObject(
          camera,
          model,
          width < 768 ? offsetMobile : offsetDesktop,
          lookAtY,
          cameraY
        );
      }
    }

    /* ---------- RESIZE OBSERVER ---------- */
    let resizeRAF = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeRAF) return;
      resizeRAF = requestAnimationFrame(() => {
        resize();
        resizeRAF = null;
      });
    });

    resizeObserver.observe(container);
    resize();

    /* ---------- ANIMATION ---------- */
    const clock = new THREE.Clock();
    let rafId;

    // Pause quand l'onglet est caché
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      } else if (!rafId) {
        animate();
      }
    });

    function animate() {
      rafId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (mixer) mixer.update(delta);

      if (model) {
        model.rotation.y += 0.001;
        model.position.y = Math.sin(elapsed * 1.5) * 0.15;
        model.rotation.x = Math.sin(elapsed * 1.5) * 0.08;
        model.rotation.z = Math.sin(elapsed * 1.2) * 0.04;
      }

      renderer.render(scene, camera);
    }

    animate();
  }

  /* ================================
     GEO AURA SCENE
  ================================= */
  function createGeometricAura(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(3, 2, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.2, 0.3, 0.85);
    bloomPass.threshold = 0.1;
    bloomPass.strength = 0.8;
    bloomPass.radius = 0.5;

    const effectComposer = new EffectComposer(renderer);
    effectComposer.addPass(renderScene);
    effectComposer.addPass(bloomPass);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.zoomSpeed = 1;
    controls.rotateSpeed = 1;
    controls.target.set(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(2236962);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(16777215, 1.2);
    mainLight.position.set(2, 3, 4);
    scene.add(mainLight);

    const backLight = new THREE.PointLight(4482764, 0.6);
    backLight.position.set(-2, 1, -3);
    scene.add(backLight);

    const fillLight = new THREE.PointLight(16755302, 0.5);
    fillLight.position.set(1.5, 1, 2);
    scene.add(fillLight);

    const colorLight = new THREE.PointLight(16729258, 0.8);
    colorLight.position.set(1, 1, 2);
    scene.add(colorLight);

    const geometryIco = new THREE.IcosahedronGeometry(1.1, 0);
    const materialMain = new THREE.MeshStandardMaterial({
      color: 4881052,
      emissive: 1122867,
      roughness: 0.28,
      metalness: 0.75,
      flatShading: false,
      transparent: true,
      opacity: 0.92
    });
    const coreMesh = new THREE.Mesh(geometryIco, materialMain);
    scene.add(coreMesh);

    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 6737151,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const wireframeIco = new THREE.Mesh(geometryIco, wireframeMat);
    wireframeIco.scale.setScalar(1.08);
    scene.add(wireframeIco);

    const torusMat = new THREE.MeshStandardMaterial({
      color: 8956671,
      emissive: 2254506,
      roughness: 0.3,
      metalness: 0.9
    });
    const torusRing = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.045, 64, 500), torusMat);
    scene.add(torusRing);

    const torusRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.68, 0.03, 64, 500),
      new THREE.MeshStandardMaterial({
        color: 16755336,
        emissive: 4465152,
        roughness: 0.5,
        metalness: 0.7
      })
    );
    scene.add(torusRing2);

    const cloudParticleCount = 800;
    const cloudGeo = new THREE.BufferGeometry();
    const cloudPositions = new Float32Array(cloudParticleCount * 3);
    for (let e = 0; e < cloudParticleCount; e++) {
      cloudPositions[3 * e] = 5 * (Math.random() - 0.5);
      cloudPositions[3 * e + 1] = 3 * (Math.random() - 0.5);
      cloudPositions[3 * e + 2] = 4 * (Math.random() - 0.5) - 1;
    }
    cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
    const cloudMat = new THREE.PointsMaterial({
      color: 7842559,
      size: 0.025,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    const cloudPoints = new THREE.Points(cloudGeo, cloudMat);
    scene.add(cloudPoints);

    let time = 0;
    let rafId;

    function resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;

      renderer.setSize(w, h, false);
      effectComposer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    window.addEventListener('resize', resize);

    let resizeRAF = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeRAF) return;
      resizeRAF = requestAnimationFrame(() => {
        resize();
        resizeRAF = null;
      });
    });
    resizeObserver.observe(container);
    resize();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      } else if (!rafId) {
        animate();
      }
    });

    function animate() {
      rafId = requestAnimationFrame(animate);
      time += 0.012;

      coreMesh.rotation.y = 0.25 * time;
      coreMesh.rotation.x = 0.2 * Math.sin(0.37 * time);
      coreMesh.rotation.z = 0.15 * Math.cos(0.23 * time);

      wireframeIco.rotation.copy(coreMesh.rotation);

      torusRing.rotation.x = Math.PI / 2;
      torusRing.rotation.z = 0.5 * time;

      torusRing2.rotation.x = Math.PI / 2 + 0.3;
      torusRing2.rotation.z = 0.65 * time;

      const e = (0.2 * time) % (2 * Math.PI);
      colorLight.color.setHSL(0.55 + 0.1 * Math.sin(e), 1, 0.6);

      cloudPoints.rotation.y = 0.05 * time;
      cloudPoints.rotation.x = 0.1 * Math.sin(0.1 * time);

      controls.update();
      effectComposer.render();
    }

    animate();
  }

  /* ================================
     INIT SCENES
  ================================= */
  createGeometricAura('threejs-container');
  createScene('threejs-container-2', 'assets/3d/footer/scene.gltf', 0.5, 0.65, 0.85, 3);

});
