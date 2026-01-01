import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

window.addEventListener('DOMContentLoaded', () => {
    // Fonction pour créer une scène complète dans un container avec un modèle à charger
    function createScene(containerId, modelPath, initialY = 0.4, scale = 1.4) {
        const container = document.getElementById(containerId);
        const rect = container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);

        // Scene & Camera
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 2, 8);

        // Lights
        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(5, 10, 7.5);
        scene.add(dirLight);

        // Loader & model
        const loader = new GLTFLoader();
        let model = null;

        loader.load(
            modelPath,
            gltf => {
                model = gltf.scene;
                model.scale.set(scale, scale, scale);
                model.position.set(0, initialY, 0);
                scene.add(model);
        
                // 🔹 Si le glb a des animations
                if (gltf.animations && gltf.animations.length > 0) {
                    const mixer = new THREE.AnimationMixer(model);
                    gltf.animations.forEach(clip => {
                        const action = mixer.clipAction(clip);

                        action.setLoop(THREE.LoopOnce); // joue une seule fois
                        action.clampWhenFinished = true; // garde la dernière frame à la fin
                        action.timeScale = 12; // x plus rapide
                        action.play();
                    });
        
                    // On met à jour le mixer dans l'animation loop
                    function animate() {
                        requestAnimationFrame(animate);
                        const delta = clock.getDelta();
                        mixer.update(delta); // ← fait tourner l'animation du modèle
        
                        // Rotation/flottement perso
                        model.rotation.y += 0.001;
                        const elapsed = clock.getElapsedTime();
                        model.position.y = initialY + Math.sin(elapsed * 1.5) * 0.2;
                        model.rotation.x = Math.sin(elapsed * 1.5) * 0.1;
                        model.rotation.z = Math.sin(elapsed * 1.2) * 0.05;
        
                        renderer.render(scene, camera);
                    }
                    animate();
                }
            }
        );

        // Clock for animation timing
        const clock = new THREE.Clock();

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);

            if (model) {
                const elapsed = clock.getElapsedTime();

                // Rotation lente sur Y
                model.rotation.y += 0.001;

                // Flottement vertical
                model.position.y = initialY + Math.sin(elapsed * 1.5) * 0.2;

                // Inclinaison oscillante X
                model.rotation.x = Math.sin(elapsed * 1.5) * 0.1;

                // Inclinaison oscillante Z
                model.rotation.z = Math.sin(elapsed * 1.2) * 0.05;
            }

            renderer.render(scene, camera);
        }
        animate();

        // Resize handling
        window.addEventListener('resize', () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        });
    }

    // Crée les deux scènes avec leurs modèles
    createScene('threejs-container', 'assets/3d/laptop.glb');
    createScene('threejs-container-2', 'assets/3d/footer/scene.gltf', 1, 1);
});
