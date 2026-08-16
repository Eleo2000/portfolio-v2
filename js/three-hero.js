import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

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
     INIT SCENES
  ================================= */
  createScene('threejs-container', 'assets/3d/laptop.glb', 1.2, 0.85, 0.2, 2.5);
  createScene('threejs-container-2', 'assets/3d/footer/scene.gltf');

});
