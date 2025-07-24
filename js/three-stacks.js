import * as THREE from 'three';

// // === Setup Three.js ===
// const canvas = document.getElementById('geminiCanvas');
// const scene = new THREE.Scene();
// scene.background = new THREE.Color(0x000010);
// scene.fog = new THREE.Fog(0x000010, 60, 10);

// // Caméra
// const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
// camera.position.set(0, 20, 100);
// camera.lookAt(0, 0, 0);

// const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
// renderer.setSize(innerWidth, innerHeight);
// renderer.setPixelRatio(devicePixelRatio);

// // === Paramètres ===
// const RES = 300;
// const HALF_LEN = 24;
// const Z_WIDTH = 24;
// const N_STRANDS = 5;

// // === Thèmes dynamiques ===
// const THEMES = [
//   {
//     name: 'Spirale',
//     ampX: 7,
//     ampY: 3,
//     ySpread: 6,
//     colors: [0x4faaff, 0x1c6cff, 0xffdd88, 0xff88cc, 0xaaffee],
//     computePoints(idx, phase) {
//       const pts = [];
//       const baseY = (idx - (N_STRANDS - 1) / 2) * this.ySpread;
//       for (let i = 0; i <= RES; i++) {
//         const t = i / RES;
//         const z = THREE.MathUtils.lerp(-HALF_LEN, HALF_LEN, t);
//         const u = t * Math.PI * 4 + phase + idx * Math.PI / 2;
//         const dist = Math.max(0, Math.abs(z) - Z_WIDTH / 2);
//         const env = THREE.MathUtils.clamp(1 - dist / (HALF_LEN - Z_WIDTH / 2), 0, 1);
//         const x = Math.sin(u) * this.ampX * env;
//         const y = baseY + Math.cos(u) * this.ampY * env;
//         pts.push(new THREE.Vector3(x, y, z));
//       }
//       return pts;
//     }
//   },
//   {
//     name: 'Ondes',
//     ampX: 10,
//     ampY: 4,
//     ySpread: 10,
//     colors: [0xff6699, 0xffcc00, 0x66ffcc, 0x66ccff, 0xcc66ff],
//     computePoints(idx, phase) {
//       const pts = [];
//       const baseY = (idx - (N_STRANDS - 1) / 2) * this.ySpread;
//       for (let i = 0; i <= RES; i++) {
//         const t = i / RES;
//         const z = THREE.MathUtils.lerp(-HALF_LEN, HALF_LEN, t);
//         const x = Math.sin(t * Math.PI * 8 + phase + idx) * this.ampX;
//         const y = baseY + Math.sin(t * Math.PI * 2 + idx) * this.ampY;
//         pts.push(new THREE.Vector3(x, y, z));
//       }
//       return pts;
//     }
//   },
//   {
//     name: 'Explosion',
//     ampX: 16,
//     ampY: 10,
//     ySpread: 4,
//     colors: [0xffffff, 0xff6600, 0xff0000, 0xff3399, 0x00ffff],
//     computePoints(idx, phase) {
//       const pts = [];
//       for (let i = 0; i <= RES; i++) {
//         const t = i / RES;
//         const angle = t * Math.PI * 2 + phase;
//         const radius = t * this.ampX;
//         const x = Math.cos(angle + idx) * radius;
//         const y = Math.sin(angle + idx) * radius * 0.5;
//         const z = (t - 0.5) * HALF_LEN * 2;
//         pts.push(new THREE.Vector3(x, y, z));
//       }
//       return pts;
//     }
//   }
// ];

// // === Lignes cœur + halo ===
// const strands = [];
// const glowLines = [];
// let currentThemeIndex = 0;
// let currentTheme = THEMES[currentThemeIndex];

// for (let i = 0; i < N_STRANDS; i++) {
//   const coreMat = new THREE.LineBasicMaterial({
//     color: currentTheme.colors[i % currentTheme.colors.length],
//     transparent: true,
//     opacity: 1,
//     blending: THREE.AdditiveBlending,
//     depthWrite: false,
//   });

//   const glowMat = new THREE.LineBasicMaterial({
//     color: currentTheme.colors[i % currentTheme.colors.length],
//     transparent: true,
//     opacity: 0.35,
//     blending: THREE.AdditiveBlending,
//     depthWrite: false,
//   });

//   const geo = new THREE.BufferGeometry();

//   const coreLine = new THREE.Line(geo, coreMat);
//   const glowLine = new THREE.Line(geo.clone(), glowMat);
//   glowLine.scale.set(1.05, 1.05, 1.05);

//   scene.add(coreLine);
//   scene.add(glowLine);

//   strands.push(coreLine);
//   glowLines.push(glowLine);
// }

// // === Scroll pour changer de thème ===
// let lastScrollY = 0;
// window.addEventListener('scroll', () => {
//   scene.rotation.y = window.scrollY * 0.0015;
//   scene.rotation.x = window.scrollY * 0.001;

//   const delta = Math.abs(window.scrollY - lastScrollY);
//   if (delta > 150) {
//     lastScrollY = window.scrollY;
//     currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
//     currentTheme = THEMES[currentThemeIndex];

//     strands.forEach((line, i) => {
//       line.material.color.set(currentTheme.colors[i % currentTheme.colors.length]);
//       glowLines[i].material.color.set(currentTheme.colors[i % currentTheme.colors.length]);
//     });
//   }
// });

// // === Animation principale ===
// function animate(time = 0) {
//   requestAnimationFrame(animate);
//   const phase = time * 0.002;

//   strands.forEach((coreLine, idx) => {
//     const raw = currentTheme.computePoints.call(currentTheme, idx, phase);
//     const curve = new THREE.CatmullRomCurve3(raw, false, 'catmullrom', 0.4);
//     const smooth = curve.getPoints(RES);
//     coreLine.geometry.setFromPoints(smooth);
//     glowLines[idx].geometry.setFromPoints(smooth);

//     coreLine.material.opacity = 0.8 + 0.4 * Math.sin(time * 0.008 + idx);
//   });

//   renderer.render(scene, camera);
// }
// requestAnimationFrame(animate);

// // === Resize ===
// window.addEventListener('resize', () => {
//   camera.aspect = innerWidth / innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(innerWidth, innerHeight);
// });



// import { RGBELoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/RGBELoader.js';
// const canvas = document.getElementById('geminiCanvas');
//     const scene = new THREE.Scene();

//     const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 200);
//     camera.position.set(0, 30, 80);
//     camera.lookAt(0, 0, 0);             // centre la vue sur l'origine

//     const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
//     renderer.setSize(window.innerWidth, window.innerHeight);
//     renderer.setPixelRatio(window.devicePixelRatio);
//     renderer.toneMapping = THREE.ACESFilmicToneMapping;
//     renderer.outputEncoding = THREE.sRGBEncoding;
//     renderer.shadowMap.enabled = true;

//     // Environnement HDR
//     new RGBELoader().load(
//       'https://rawcdn.githack.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr',
//       hdr => {
//         const pmrem = new THREE.PMREMGenerator(renderer);
//         scene.environment = pmrem.fromEquirectangular(hdr).texture;
//         hdr.dispose();
//         pmrem.dispose();
//       }
//     );

//     // Lumières
//     scene.add(new THREE.AmbientLight(0x222244, 0.5));
//     const spot1 = new THREE.SpotLight(0xff66cc, 1.2);
//     spot1.position.set(50, 80, 50);
//     scene.add(spot1);
//     const spot2 = new THREE.SpotLight(0x66ffff, 1.0);
//     spot2.position.set(-50, 40, -50);
//     scene.add(spot2);
//     const pointLight = new THREE.PointLight(0xffffff, 0.4);
//     pointLight.position.set(0, -30, 0);
//     scene.add(pointLight);

//     // Textures PBR fiables
//     const loader = new THREE.TextureLoader();
//     const diffuseMap = loader.load('https://threejsfundamentals.org/threejs/resources/images/wall.jpg');
//     const normalMap  = loader.load('https://threejsfundamentals.org/threejs/resources/images/wall-normal.jpg');
//     const roughMap   = loader.load('https://threejsfundamentals.org/threejs/resources/images/wall-roughness.jpg');

//     // Trefoil Knot
//     const RES = 100, R = 10;
//     let knotMesh = null;

//     function computeTrefoil(phase) {
//       const pts = [];
//       for (let i = 0; i <= RES; i++) {
//         const t = (i / RES) * Math.PI * 2;
//         const x = (R + Math.cos(3*t + phase)) * Math.cos(2*t);
//         const y = (R + Math.cos(3*t + phase)) * Math.sin(2*t);
//         const z = Math.sin(3*t + phase) * R * 0.5;
//         pts.push(new THREE.Vector3(x, y, z));
//       }
//       return pts;
//     }

//     function updateKnot(phase) {
//       const path = new THREE.CatmullRomCurve3(computeTrefoil(phase), true);
//       const geo  = new THREE.TubeGeometry(path, RES, 1.5, 24, true);
//       const mat  = new THREE.MeshStandardMaterial({
//         map: diffuseMap,
//         normalMap,
//         roughnessMap: roughMap,
//         metalness: 0.8,
//         roughness: 0.6,
//         envMapIntensity: 1.2
//       });

//       if (knotMesh) {
//         knotMesh.geometry.dispose();
//         knotMesh.material.dispose();
//         knotMesh.geometry = geo;
//         knotMesh.material = mat;
//       } else {
//         knotMesh = new THREE.Mesh(geo, mat);
//         knotMesh.castShadow = true;
//         scene.add(knotMesh);
//       }
//     }

//     // Scroll interaction
//     window.addEventListener('scroll', () => {
//       scene.rotation.y = window.scrollY * 0.0009;
//       scene.rotation.x = window.scrollY * 0.0003;
//     });

//     // Animation
//     function animate(time = 0) {
//       requestAnimationFrame(animate);
//       updateKnot(time * 0.0009);
//       renderer.render(scene, camera);
//     }
//     animate();

//     // Resize
//     window.addEventListener('resize', () => {
//       camera.aspect = window.innerWidth / window.innerHeight;
//       camera.updateProjectionMatrix();
//       renderer.setSize(window.innerWidth, window.innerHeight);
//     });


//     import { FontLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/FontLoader.js';
//     import { TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/geometries/TextGeometry.js';
//     import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

//       /////
//       const container = document.getElementById('sceneContainer');
//       const canvas = document.getElementById('skillTreeCanvas');
//       const infoPanel = document.getElementById('infoPanel');

//       // Three.js setup
//       const scene = new THREE.Scene(); 
//       scene.background = null;
//       const camera = new THREE.PerspectiveCamera(50, window.innerWidth/ window.innerHeight, 0.1, 500);
//       camera.position.set(0,50,120);
//       const renderer = new THREE.WebGLRenderer({ canvas, antialias:true , alpha: true  });
//       renderer.setSize(window.innerWidth,window.innerHeight); renderer.setPixelRatio(devicePixelRatio);
//       const controls = new OrbitControls(camera, renderer.domElement);
//       controls.minDistance=20; controls.maxDistance=150; controls.enablePan=false;
//       renderer.setClearColor(0x000000, 0); // fully transparent

//       // Lights
//       scene.add(new THREE.AmbientLight(0x404050,0.8));
//       const dirLight=new THREE.DirectionalLight(0x6a0dad,1);
//       dirLight.position.set(30,50,30); scene.add(dirLight);

//       // Data definitions
//       const neonCyan=new THREE.Color(0x00ffff);
//       const neonViolet=new THREE.Color(0x6a0dad);
//       const baseColor=new THREE.Color(0x112244);
//       const nodeGeo=new THREE.SphereGeometry(3,32,32);

//       const skills=[
//         {id:0,name:'Angular',desc:'Framework TS puissant pour frontend.',level:5,children:[1,2]},
//         {id:1,name:'PHP',desc:'Langage backend solide et mature.',level:5,children:[3]},
//         {id:2,name:'Three.js',desc:'Bibliothèque 3D WebGL.',level:4,children:[]},
//         {id:3,name:'Symfony',desc:'Framework PHP structurant.',level:4,children:[]},
//         {id:4,name:'Illustrator',desc:'Création graphique vectorielle.',level:3,children:[5]},
//         {id:5,name:'Figma',desc:'UI/UX collaboratif.',level:3,children:[]},
//         {id:6,name:'Git',desc:'Gestion de versions et collaboration.',level:4,children:[]},
//         {id:7,name:'Anglais',desc:'Communication professionnelle fluide.',level:4,children:[]},
//         {id:8,name:'Français',desc:'Langue maternelle, communication claire.',level:5,children:[]}
//       ];

//       const positions={
//         0:new THREE.Vector3(0,0,0),1:new THREE.Vector3(-15,-15,-10),2:new THREE.Vector3(15,-15,-10),
//         3:new THREE.Vector3(-25,-30,-5),4:new THREE.Vector3(15,15,-5),5:new THREE.Vector3(25,30,-5),
//         6:new THREE.Vector3(30,0,-15),7:new THREE.Vector3(-15,15,10),8:new THREE.Vector3(-25,30,10)
//       };

//       // Containers
//       const nodes=[];
//       const lines=new THREE.Group(); scene.add(lines);
//       const labelsDiv=document.createElement('div');
//       Object.assign(labelsDiv.style,{position:'absolute',top:0,left:0,width:'100%',height:'100%'});
//       container.appendChild(labelsDiv);

//       // Build graph
//       skills.forEach(skill=>{
//         // Node
//         const mat=new THREE.MeshStandardMaterial({emissive:skill.id<4?neonCyan:neonViolet,emissiveIntensity:0.4,roughness:0.3,metalness:1});
//         const mesh=new THREE.Mesh(nodeGeo,mat); mesh.position.copy(positions[skill.id]); mesh.userData=skill;
//         scene.add(mesh); nodes.push(mesh);
//         // HTML Label
//         const lbl=document.createElement('div'); lbl.className='label-link'; lbl.textContent=skill.name;
//         labelsDiv.appendChild(lbl); skill.dom=lbl;
//         // Dashed line to children
//         skill.children.forEach(cid=>{
//           const matL=new THREE.LineDashedMaterial({dashSize:2,gapSize:0.5,transparent:true,opacity:0});
//           const geoL=new THREE.BufferGeometry().setFromPoints([positions[skill.id],positions[cid]]);
//           geoL.computeBoundingSphere(); const line=new THREE.Line(geoL,matL); line.computeLineDistances();
//           lines.add(line);
//         });
//       });

//       // Scroll-triggered TL
//       gsap.timeline({scrollTrigger:{trigger:container,start:'top center',once:true}})
//         .from(nodes.map(n=>n.scale),{x:0,y:0,z:0,stagger:0.1,duration:1,ease:'power2.out'})
//         .to(lines.children.map(l=>l.material),{opacity:1,stagger:0.05,duration:1,ease:'power1.inOut'},'<0.2')
//         .from(skills.map(s=>s.dom),{opacity:0,y:20,stagger:0.1,duration:0.8,ease:'power2.out'},'<0.5')
//         .fromTo(scene.rotation,{y:Math.PI/4,duration:.4,ease:'none'}, {y:0,duration:0.4,ease:'power1.inOut'},'0.6');

//       // Rotate scene
//       // gsap.to(scene.rotation,{y:Math.PI*2,duration:30,repeat:-1,ease:'none'});

//       // 3D Text labels
//       new FontLoader().load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',font=>{
//         skills.forEach(skill=>{
//           const tg=new TextGeometry(skill.name,{font,size:1.5,height:0.1,curveSegments:8});
//           const m=new THREE.MeshBasicMaterial({color:skill.id<4?neonCyan:neonViolet,transparent:true,opacity:0});
//           const txt=new THREE.Mesh(tg,m); txt.position.copy(positions[skill.id]).add(new THREE.Vector3(-skill.name.length*0.3,4,0));
//           scene.add(txt); gsap.to(m,{opacity:1,duration:1,delay:0.5});
//         });
//         const titleGeo = new TextGeometry("Eleo's Skills", { font, size: 6, height: 0.3 });
//         titleGeo.computeBoundingBox();
//         const vertexShader = `
//         uniform vec3 bboxMin;
//         uniform vec3 bboxMax;
//         varying float vGradientX;
      
//         void main() {
//           // Normaliser la position X entre bboxMin.x et bboxMax.x pour un gradient linéaire horizontal
//           vGradientX = (position.x - bboxMin.x) / (bboxMax.x - bboxMin.x);
//           gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//         }
//       `;
      
//       const fragmentShader = `
//         varying float vGradientX;
//         uniform vec3 leftColor;
//         uniform vec3 rightColor;
      
//         void main() {
//           vec3 color = mix(leftColor, rightColor, vGradientX);
//           gl_FragColor = vec4(color, 1.0);
//         }
//       `;
      
//       const shaderMaterial = new THREE.ShaderMaterial({
//         uniforms: {
//           bboxMin: { value: titleGeo.boundingBox.min },
//           bboxMax: { value: titleGeo.boundingBox.max },
//           leftColor: { value: new THREE.Color("#00c6ff") },  // bleu électrique lumineux
// rightColor: { value: new THREE.Color("#ff6ec4") } // purple
//         },
//         vertexShader,
//         fragmentShader,
//         side: THREE.DoubleSide,
//       });
      
//       const titleMesh = new THREE.Mesh(titleGeo, shaderMaterial);
//       titleMesh.position.set(-25, 35, 0);
//       scene.add(titleMesh);
//       });

//       // Interaction & render
//       const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
//       window.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;});
//       function updateLabels(){nodes.forEach(n=>{const p=n.position.clone().project(camera);n.userData.dom.style.transform=`translate(${(p.x*0.5+0.5)*innerWidth}px,${(-p.y*0.5+0.5)*innerHeight}px)`;});}
//       function animate(){requestAnimationFrame(animate);ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(nodes);
//         if(hits.length){const h=hits[0].object;h.material.emissiveIntensity=1;infoPanel.innerHTML=`<h2>${h.userData.name}</h2><p>${h.userData.desc}</p><p><strong>Level:</strong>${h.userData.level}</p>`;infoPanel.style.opacity='1';}
//         else{nodes.forEach(n=>n.material.emissiveIntensity=0.4);infoPanel.style.opacity='0';}
//         controls.update();updateLabels();renderer.render(scene,camera);}animate();
//       window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});



import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

let mixer;
// THREE.JS SETUP
const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(
  50,                               // FOV naturel
  window.innerWidth / window.innerHeight,
  0.01,                             // near
  100                               // far
);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('threeCanvas'), alpha: true });
// renderer.setSize(window.innerWidth / 2, window.innerHeight);
// renderer.setPixelRatio(window.devicePixelRatio);

const canvas = document.getElementById('threeCanvas');

// Récupère la vraie taille affichée (CSS) du canvas
const width = canvas.clientWidth;
const height = canvas.clientHeight;

// Met à jour la taille du renderer
renderer.setSize(width, height, false);

// Met à jour l'aspect de la caméra
camera.aspect = width / height;
camera.updateProjectionMatrix();

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(3, 3, 3);
scene.add(directionalLight);

// Load 3D model
const loader = new GLTFLoader();
loader.load(
  'assets/3d/broken_steampunk_clock/scene.gltf',  // ← Chemin vers ton modèle
  (gltf) => {
    const model = gltf.scene;

    // a) Bounding box d’origine
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // b) Scale automatique : la plus grande dimension → 1 unité
    const desiredSize = 1;
    const scaleFactor = desiredSize / maxDim;
    model.scale.setScalar(scaleFactor*3);

    // c) Recentre + pose à y=0
    box.setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.position.y = 2.4;

    scene.add(model);

    // d) Animations en boucle si présentes
    if (gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat);
        action.play();
      });
    }
  },
  // (xhr) => console.log(`Progression : ${(xhr.loaded / xhr.total * 100).toFixed(1)}%`),
  // (error) => console.error('Erreur de chargement :', error)
);

const clock = new THREE.Clock(); // ← Manquait

// Animate
function animate() {
  requestAnimationFrame(animate);
  // 📐 Mise à jour dynamique du renderer si taille CSS change
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (canvas.width !== width || canvas.height !== height) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  renderer.render(scene, camera);
}
animate();

// CHART.JS RADAR SETUP
const ctx = document.getElementById('radarChart').getContext('2d');
new Chart(ctx, {
  type: 'radar',
  data: {
    labels: ['Angular', 'Symfony', 'threeJs', 'UX/UI', 'Anglais', 'SQL'],
    datasets: [{
      label: "Eleo's Skills",
      data: [90, 80, 75, 85, 70, 65],
      backgroundColor: 'rgba(0, 255, 255, 0.15)',
      borderColor: '#0ff',
      borderWidth: 3,
      pointBackgroundColor: '#00ffff',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#0ff'
    }]
  },
  options: {
    responsive: true,
    scales: {
      r: {
        angleLines: { color: '#444' },
        grid: { color: '#555' },
        pointLabels: { color: '#fff', font: { size: 14 } },
        ticks: {
          color: '#ccc',
          backdropColor: 'transparent',
          stepSize: 20,
          beginAtZero: true,
          max: 100
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  }
});