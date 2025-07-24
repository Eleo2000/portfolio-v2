import * as THREE from 'three';

import { RGBELoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/RGBELoader.js';
const canvas = document.getElementById('geminiCanvas');
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 200);
    camera.position.set(0, 30, 80);
    camera.lookAt(0, 0, 0);             // centre la vue sur l'origine

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;

    // Environnement HDR
    new RGBELoader().load(
      'https://rawcdn.githack.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr',
      hdr => {
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromEquirectangular(hdr).texture;
        hdr.dispose();
        pmrem.dispose();
      }
    );

    // Lumières
    scene.add(new THREE.AmbientLight(0x222244, 0.5));
    const spot1 = new THREE.SpotLight(0xff66cc, 1.2);
    spot1.position.set(50, 80, 50);
    scene.add(spot1);
    const spot2 = new THREE.SpotLight(0x66ffff, 1.0);
    spot2.position.set(-50, 40, -50);
    scene.add(spot2);
    const pointLight = new THREE.PointLight(0xffffff, 0.4);
    pointLight.position.set(0, -30, 0);
    scene.add(pointLight);

    // Textures PBR fiables
    const loader = new THREE.TextureLoader();
    const diffuseMap = loader.load('https://threejsfundamentals.org/threejs/resources/images/wall.jpg');
    const normalMap  = loader.load('https://threejsfundamentals.org/threejs/resources/images/wall-normal.jpg');
    const roughMap   = loader.load('https://threejsfundamentals.org/threejs/resources/images/wall-roughness.jpg');

    // Trefoil Knot
    const RES = 100, R = 10;
    let knotMesh = null;

    function computeTrefoil(phase) {
      const pts = [];
      for (let i = 0; i <= RES; i++) {
        const t = (i / RES) * Math.PI * 2;
        const x = (R + Math.cos(3*t + phase)) * Math.cos(2*t);
        const y = (R + Math.cos(3*t + phase)) * Math.sin(2*t);
        const z = Math.sin(3*t + phase) * R * 0.5;
        pts.push(new THREE.Vector3(x, y, z));
      }
      return pts;
    }

    function updateKnot(phase) {
      const path = new THREE.CatmullRomCurve3(computeTrefoil(phase), true);
      const geo  = new THREE.TubeGeometry(path, RES, 1.5, 24, true);
      const mat  = new THREE.MeshStandardMaterial({
        map: diffuseMap,
        normalMap,
        roughnessMap: roughMap,
        metalness: 0.8,
        roughness: 0.6,
        envMapIntensity: 1.2
      });

      if (knotMesh) {
        knotMesh.geometry.dispose();
        knotMesh.material.dispose();
        knotMesh.geometry = geo;
        knotMesh.material = mat;
      } else {
        knotMesh = new THREE.Mesh(geo, mat);
        knotMesh.castShadow = true;
        scene.add(knotMesh);
      }
    }

    // Scroll interaction
    window.addEventListener('scroll', () => {
      scene.rotation.y = window.scrollY * 0.0009;
      scene.rotation.x = window.scrollY * 0.0003;
    });

    // Animation
    function animate(time = 0) {
      requestAnimationFrame(animate);
      updateKnot(time * 0.0009);
      renderer.render(scene, camera);
    }
    animate();

    // Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });