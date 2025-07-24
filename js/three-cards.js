import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
// -- Setup Three.js scene --
const canvas = document.getElementById('webgl');
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0x0a0a1a);
scene.fog = new THREE.Fog(0x0a0a1a, 5, 15);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 100);
const radius = 5.2;
const pitch = 6;
camera.position.set(0, 2, 10);
camera.lookAt(0, -2, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
[[-3,3,5,0xda1b60],[3,-2,-5,0x00aaff]].forEach(([x,y,z,c]) => {
  const l = new THREE.PointLight(c, 2, 20);
  l.position.set(x, y, z);
  scene.add(l);
});

// Group for all moving objects
const mainGroup = new THREE.Group();
scene.add(mainGroup);

// Load GLTF model at center
let gltfModel;
new GLTFLoader().load('assets/3d/ekko_from_arcane/scene.gltf', gltf => {
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

// Card shaders
const cardGeo = new THREE.PlaneGeometry(1.5, 1, 20, 20);
const vert = `uniform float time; uniform float amp; varying vec2 vUv; float wave(float x,float y,float t){return sin(x*3.+t)*.3 + cos(y*4.+t*1.5)*.15 + sin((x+y)*5.+t*.5)*.1;} void main(){vUv=uv; vec3 p=position; p.z += wave(p.x,p.y,time)*amp; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`;
const frag = `
  uniform sampler2D map;
  uniform float time;
  uniform float amp;
  uniform float hoverStrength; // 0 → onde invisible, 1 → onde couvre tout
  uniform vec2 hoverUv;        // position centrale de l'onde

  varying vec2 vUv;

  void main() {
    // Wobble
    float wx = sin((vUv.y + time * 0.7) * 10.0) * 0.005 * amp;
    float wy = cos((vUv.x + time * 0.9) * 12.0) * 0.005 * amp;
    vec2 uv = vUv + vec2(wx, wy);

    // Texture de base
    vec4 texColor = texture2D(map, uv);

    // Convertir en niveau de gris
    float gray = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    vec3 grayColor = vec3(mix(gray, 1.0, 0.1));

    // Distance au centre de l'onde
    float dist = distance(vUv, hoverUv);

    // Rayon d'expansion (0.0 → 0.5+)
    float radius = hoverStrength * 1.2;

    // Adoucissement de l'effet
    float t = smoothstep(radius - 0.05, radius + 0.05, dist);

    // Mélange entre couleur et noir et blanc
    vec3 finalColor = mix(texColor.rgb, grayColor, t);

    gl_FragColor = vec4(finalColor, texColor.a);
  }


`;


// Card data
const data = [
  {title:'The Red Shalk 2023',desc:'Félicitations à EVOLUTECH pour leur victoire et collaboration avec Carnet de Mode.mg ! 👏 Ce hackathon des 10-12 novembre 2023 visait à booster l’entrepreneuriat féminin et créer des emplois jeunes grâce au digital.', image: 'assets/cards3d/exp/p4h-23.jpg'},
  {title:'Ideathon 2023',desc:'Evolutech remporte le 1er prix de l’Ideathon 2023 ! Grâce à l’engagement et à la créativité de toute l’équipe, nous avons brillamment décroché la première place. Merci à tous pour votre soutien ! Prochain arrêt : IndabaX Madagascar. 🚀✨', image: 'assets/cards3d/exp/ideatho-23.jpg'},
  {title:'JNR 2023',desc:'Journées de la Recherche Fianarantsoa, mai 2023,nous avons été partenaires lors de cet événement en contribuant au design et au développement d’une application de recensement utilisateur.', image: 'assets/cards3d/exp/jnr-23.jpg'},
  {title:'Emihack 2023',desc:'Une nouvelle performance marquante lors de l’édition 2023 du hackathon inter-classes Emihack, organisé à l’EMIT Fianarantsoa, où nous avons à nouveau décroché la deuxième place.', image: 'assets/cards3d/exp/emihack-23.jpg'},
  {title:'Frontend Award 2022',desc:'Nous avons décroché la deuxième place au Frontend Award 2022, un concours national organisé par TechZara. Ce défi nous a permis de mettre en avant notre créativité et nos compétences en développement web.', image: 'assets/cards3d/exp/FA-22.jpg'},
  {title:'Emihack 2022',desc:'Nous avons fièrement terminé à la deuxième place lors du hackathon inter-classes Emihack 2022, organisé au sein de l’EMIT Fianarantsoa. Une belle expérience de collaboration, d’innovation et de dépassement collectif.', image: 'assets/cards3d/exp/emihack-22.jpg'},
];

// Create cards
const cards = [];
data.forEach((d, i) => {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 512;
  const ctx = cv.getContext('2d');

  // Charger l'image pour chaque carte
  const img = new Image();
  img.src = d.image;

  img.onload = () => {
    // Dessiner l'image
    const imgRatio = img.width / img.height;
    const canvasRatio = 512 / 512;

    let drawWidth = 512;
    let drawHeight = 512;

    if (imgRatio > canvasRatio) {
      // Image trop large → on réduit largeur
      drawWidth = 512;
      drawHeight = 512 / imgRatio;
    } else {
      // Image trop haute → on réduit hauteur
      drawHeight = 512;
      drawWidth = 512 * imgRatio;
    }

    const offsetX = (512 - drawWidth) / 2;
    const offsetY = (512 - drawHeight) / 2;

    // Dessine image centrée sans déformation
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    //fin draw image


    // Dessiner un overlay sombre semi-transparent pour que le texte ressorte mieux
    ctx.fillStyle = 'rgba(26, 26, 46, 0.4)';
    ctx.fillRect(0, 0, 512, 512);

    // Créer la texture depuis le canvas
    const tex = new THREE.CanvasTexture(cv);

    // Créer les uniforms
    const uniforms = {
      map: { value: tex },
      time: { value: 0 },
      amp: { value: 0.3 },
      hoverStrength: { value: 0.0 },
      hoverUv: { value: new THREE.Vector2(0.5, 0.5) }
    };
    
    

    // Créer le material shader
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms,
      side: THREE.DoubleSide,
      transparent: true
    });

    // Créer le mesh carte
    const m = new THREE.Mesh(cardGeo, mat);
    //inverse
    m.scale.x = -1;
    m.userData = { ...d, uniforms };
    // const edges = new THREE.LineSegments(
    //   new THREE.EdgesGeometry(cardGeo),
    //   new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })
    // );
    // m.add(edges);

    const label = createTextLabel(d.title);
    label.position.set(0, -0.8, 0); // sous la carte
    m.add(label); // attaché à la carte
    mainGroup.add(m);
    cards.push(m);
    
    
  };

  img.onerror = () => {
    console.error(`Erreur de chargement de l'image ${d.image}`);
  };
});

function createTextLabel(text, color = '#ff8a00') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Fond transparent + texte avec ombre
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillText(text, 258, 66); // Ombre décalée

  ctx.fillStyle = color;
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2, 0.5, 1); // ajustable

  return sprite;
}

// Position update
let theta = 0;
function updateCards() {
  cards.forEach((m,i) => {
    const t = theta + i * (2*Math.PI/cards.length);
    m.position.set(
      radius * Math.cos(t),
      pitch * (t / (2 * Math.PI)) - 2.5,
      radius * Math.sin(t)
    );
    m.rotation.y = Math.atan2(-m.position.x, -m.position.z);
  });
  if (gltfModel) {
    const progress = Math.min(scr.v / (4 * Math.PI), 1);
    gltfModel.scale.setScalar(0.03 + progress * 1);
    gltfModel.position.y = -3.5 + progress * 3;
  }
  // Move all objects slightly higher
  mainGroup.position.y = -1.5;
}

// Scroll-triggered scrub & pin
const scr = { v:0 };
gsap.to(scr, {
  v: 4 * Math.PI,
  ease: 'none',
  scrollTrigger: {
    trigger: '.scroll-section',
    start: 'top top',
    end: '+=2000',
    scrub: 2,
    pin: true
  }
});

// Raycast hover
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
let lastHoveredCard = null;

canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) / r.width * 2 - 1;
  mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  ray.setFromCamera(mouse, camera);

  // Debug (facultatif)
  console.log('Cards:', cards.map(c => ({
    uniforms: c.userData.uniforms,
    hasAmp: !!c.userData.uniforms?.amp
  })));

  // Raycast (inclure enfants)
  const hits = ray.intersectObjects(cards, true);
  const hit = hits.find(h => h.object.userData?.uniforms?.amp)?.object || null;

  // Si la carte survolée a changé
  if (hit !== lastHoveredCard) {
    // DEHOVER l’ancienne carte (remettre onde à 0)
    if (lastHoveredCard?.userData?.uniforms) {
      gsap.to(lastHoveredCard.userData.uniforms.amp, {
        value: 0.3,
        duration: 0.5,
        ease: "sine.out"
      });
      gsap.to(lastHoveredCard.userData.uniforms.hoverStrength, {
        value: 0.0,
        duration: 1.2,
        ease: "power2.out"
      });
      gsap.to(lastHoveredCard.scale, {
        x: -1, y: 1, z: 1,
        duration: 0.3, ease: 'power2.out'
      });
    }
  
    // HOVER la nouvelle carte
    if (hit?.userData?.uniforms) {
      // → On remet le wobble à 0 pour focus l’effet visuel
      gsap.to(hit.userData.uniforms.amp, {
        value: 0,
        duration: 0.5,
        ease: "sine.out"
      });
  
      // → Lancer l’onde colorée (progresse vers 1)
      gsap.to(hit.userData.uniforms.hoverStrength, {
        value: 1.0,
        duration: 1.2,
        ease: "power2.out"
      });

      gsap.to(hit.scale, {
        x: -1.1, y: 1.1, z: 1.1,
        duration: 0.3, ease: 'power2.out'
      });
  
      // → Position de départ de l’onde (centre du curseur sur la carte)
      if (hit.uv) {
        hit.userData.uniforms.hoverUv.value.copy(hit.uv);
      }
  
      hit.userData.uniforms.time.value = 0; // reset animation time
    }
  
    lastHoveredCard = hit;
  }
  
  // Changer curseur
  canvas.style.cursor = hit ? 'pointer' : 'default';
});

// Click overlay
canvas.addEventListener('click', () => {
  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObjects(cards);
  if (hits.length) {
    const { title, desc, image } = hits[0].object.userData;
    const o = document.querySelector('.card-fullscreen');
    o.querySelector('h2').textContent = title;
    o.querySelector('p').textContent = desc;
    o.classList.add('visible');

    // 💡 Ici on ajoute l'image dans le tag <img>
    o.querySelector('img').src = image;

  }
});

// Close overlay
const closeBtn = document.getElementById('closeCard');
closeBtn.addEventListener('click', () => document.querySelector('.card-fullscreen').classList.remove('visible'));

//conf 
camera.rotateX(-100.5)
scene.rotateY(180)

// Animate
function animate(t=0) {
  requestAnimationFrame(animate);
  theta = scr.v;
  updateCards();
  cards.forEach(c => {
    if (c.userData.uniforms.amp.value > 0) {
      c.userData.uniforms.time.value = t*0.001;
    }
  });
  if (gltfModel) gltfModel.rotation.y = -theta * 0.25;
  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function adjustCameraFov() {
  if (window.innerWidth < 768) {
    camera.fov = 90;
  } else if (window.innerWidth < 1024) {
    camera.fov = 55;
  } else {
    camera.fov = 50;
  }
  camera.updateProjectionMatrix();
}
adjustCameraFov();
window.addEventListener('resize', adjustCameraFov);