(() => {
    const canvas = document.getElementById('life');
    const ctx = canvas.getContext('2d');
  
    // Taille de cellule plus grande pour plus d'espace
    const cellSize = 12;
    let cols, rows;
  
    let grid = [];
    let brightness = [];
  
    function initGrid() {
      cols = Math.floor(window.innerWidth / cellSize);
      rows = Math.floor(canvas.height / cellSize);
      canvas.width = cols * cellSize;
      canvas.height = rows * cellSize;
  
      // Grille 100% aléatoire à chaque load (densité 20%)
      grid = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => (Math.random() < 0.20 ? 1 : 0))
      );
      brightness = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => Math.random() * 0.7 + 0.3)
      );
    }
  
    function countNeighbors(r, c) {
      let sum = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = (r + dr + rows) % rows; // wrap vertical
          const nc = (c + dc + cols) % cols; // wrap horizontal
          sum += grid[nr][nc];
        }
      }
      return sum;
    }
  
    function nextGen() {
      const next = grid.map(arr => arr.slice());
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const n = countNeighbors(r, c);
          if (grid[r][c] === 1) {
            next[r][c] = n === 2 || n === 3 ? 1 : 0;
          } else {
            next[r][c] = n === 3 ? 1 : 0;
          }
        }
      }
      grid = next;
    }
  
    function updateBrightness() {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] === 1) {
            brightness[r][c] += (Math.random() - 0.5) * 0.03;
            brightness[r][c] = Math.min(Math.max(brightness[r][c], 0.4), 1);
          } else {
            brightness[r][c] = 0;
          }
        }
      }
    }
  
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] === 1) {
            const b = brightness[r][c];
            const t = c / cols;
            // Gradient orange → bleu
            const rc = Math.floor(255 * (1 - t));
            const gc = Math.floor(165 * (1 - t) + 170 * t);
            const bc = Math.floor(0 * (1 - t) + 255 * t);
            const alpha = b * 0.7;
  
            const grad = ctx.createRadialGradient(
              c*cellSize + cellSize/2,
              r*cellSize + cellSize/2,
              cellSize/6,
              c*cellSize + cellSize/2,
              r*cellSize + cellSize/2,
              cellSize/1.2
            );
            grad.addColorStop(0, `rgba(${rc},${gc},${bc},${alpha})`);
            grad.addColorStop(1, `rgba(${rc},${gc},${bc},0)`);
  
            ctx.fillStyle = grad;
            ctx.fillRect(c*cellSize, r*cellSize, cellSize, cellSize);
          }
        }
      }
    }
  
    let frame = 0;
    const speed = 12; // plus grand = génération plus lente
  
    function loop() {
      frame++;
      if (frame % speed === 0) nextGen();
      updateBrightness();
      draw();
      requestAnimationFrame(loop);
    }
  
    // Initialisation et lancement
    initGrid();
    loop();
  
    // Responsive
    window.addEventListener('resize', () => {
      initGrid();
    });
  })();