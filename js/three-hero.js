import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

window.addEventListener('DOMContentLoaded', () => {

  function fitCameraToObject(camera, object, offset = 1.2) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    object.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));

    cameraZ *= offset;
    camera.position.z = cameraZ;

    camera.near = maxDim / 100;
    camera.far = maxDim * 100;
    camera.updateProjectionMatrix();
  }

  function createScene(containerId, modelPath, initialY = 0.4) {
    const container = document.getElementById(containerId);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.set(0, 2, 10);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    const loader = new GLTFLoader();
    let model = null;
    let mixer = null;

    loader.load(modelPath, (gltf) => {
      model = gltf.scene;
      scene.add(model);

      fitCameraToObject(
        camera,
        model,
        window.innerWidth < 768 ? 1 : .94
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

    const clock = new THREE.Clock();

    function resize() {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    resize();
    window.addEventListener('resize', resize);

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);

    function animate() {
      requestAnimationFrame(animate);

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

  createScene('threejs-container', 'assets/3d/laptop.glb');
  createScene('threejs-container-2', 'assets/3d/footer/scene.gltf', 1);
});
