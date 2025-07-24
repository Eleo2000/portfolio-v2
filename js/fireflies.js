const fireflyContainer = document.getElementById('fireflies-container');

function createFirefly() {
  const firefly = document.createElement('div');
  firefly.classList.add('firefly');

  const screenW = window.innerWidth;

  // Position horizontale aléatoire
  const x = Math.random() * screenW;
  firefly.style.left = `${x}px`;

  // Déplacement horizontal aléatoire (entre -50px et +50px)
  const xMove = (Math.random() - 0.5) * 100;
  firefly.style.setProperty('--x-move', `${xMove}px`);

  // Couleur orange à gauche / bleu à droite
  const color = x < screenW / 2 ? 'rgba(255, 165, 0, 0.7)' : 'rgba(135, 206, 250, 0.7)';
  firefly.style.background = color;
  firefly.style.boxShadow = `0 0 6px ${color}`;

  // Durée légèrement variable
  firefly.style.animationDuration = `${4 + Math.random() * 1.5}s`;

  // Taille plus petite (1.5 à 3px)
  const size = 1.5 + Math.random() * 1.5;
  firefly.style.width = `${size}px`;
  firefly.style.height = `${size}px`;

  fireflyContainer.appendChild(firefly);

  // Suppression après animation
  setTimeout(() => {
    firefly.remove();
  }, 6000);
}

// Génère des lucioles toutes les 250ms
setInterval(createFirefly, 250);
