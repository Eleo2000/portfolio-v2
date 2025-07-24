// Mise à jour des projets
const projets = [
  {
    image: 'https://via.placeholder.com/244x300.png?text=Landing+Page',
    titre: 'Landing Page',
    titreCard: 'Landing Pro',
    description: "Création d'une landing page responsive avec animations.",
    slides: ['Design UI/UX', 'Intégration HTML/CSS', 'Animation GSAP']
  }
];

// Sélection du conteneur et génération des cartes
const container = document.getElementById('cardsContainer');
projets.forEach((p, i) => {
  const wrapper = document.createElement('div');
  wrapper.classList.add('card-wrapper');

  const front = document.createElement('div');
  front.classList.add('card-front');
  front.style.backgroundImage = `url(${p.image})`;

  const back = document.createElement('div');
  back.classList.add('card-back');
  back.innerHTML = `
    <h3>${p.titreCard}</h3>
    <p>${p.description}</p>
    <a href="#" class="btn" data-index="${i}">Consulter</a>
  `;

  wrapper.append(front, back);
  container.append(wrapper);

  // Initial GSAP setup
  gsap.set(wrapper, { transformPerspective: 600 });
  gsap.set(back,    { opacity: 0, y: 20 });
  gsap.set(front,   { opacity: 1 });

  // Hover In/Out
  wrapper.addEventListener('mouseenter', () => {
    gsap.to(back,  { opacity: 1, y: 0,  duration: 0.4, ease:'power2.out' });
    gsap.to(front, { opacity: 0,        duration: 0.4 });
  });
  wrapper.addEventListener('mouseleave', () => {
    gsap.to(back,  { opacity: 0, ease:'power2.in' });
    gsap.to(front, { opacity: 1,duration: 0.4 });
    gsap.to(wrapper, {
      y :0, x:0,
     rotationX: 0, rotationY: 0,
      duration: 0.6, ease: 'power2.out'
    });
  });

  // Parallax souris
  wrapper.addEventListener('mousemove', e => {
    const rect = wrapper.getBoundingClientRect();
    const offsetX = e.clientX - (rect.left + rect.width/2);
    const offsetY = e.clientY - (rect.top + rect.height/2);
    gsap.to(wrapper, {
      rotationY: offsetX/20,
      rotationX: -offsetY/20 + 25,
      x: offsetX/10,
      y: offsetY/10 -50,
      duration: 0.5
    });
  });
});