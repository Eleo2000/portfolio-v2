    const canvasAurore = document.getElementById("aurora");
    const ctxAurore    = canvasAurore.getContext("2d");
    let width, height;

    function resizeCanvas() {
      width  = canvasAurore.width  = window.innerWidth;
      height = canvasAurore.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    class AuroraLayer {
      constructor(color, speed, amp1, freq1, amp2, freq2, offsetY) {
        this.color   = color;
        this.speed   = speed;
        this.amp1    = amp1;
        this.freq1   = freq1;
        this.amp2    = amp2;
        this.freq2   = freq2;
        this.offsetY = offsetY;
        this.phase1  = Math.random() * Math.PI * 2;
        this.phase2  = Math.random() * Math.PI * 2;
      }
      update() {
        this.phase1 += this.speed;
        this.phase2 += this.speed * 0.7;
      }
      draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let x = 0; x <= width; x += 2) {
          const y1 = Math.sin(x * this.freq1 + this.phase1) * this.amp1;
          const y2 = Math.sin(x * this.freq2 + this.phase2) * this.amp2;
          const y  = this.offsetY + y1 + y2;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, 0);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, this.offsetY - this.amp1 - this.amp2, 0, this.offsetY + this.amp1 + this.amp2);
        grad.addColorStop(0,   "transparent");
        grad.addColorStop(0.3, this.color);
        grad.addColorStop(0.7, this.color.replace(/[\d\.]+\)$/,"0.1)"));
        grad.addColorStop(1,   "transparent");

        ctx.fillStyle = grad;
        ctx.filter = 'blur(30px)';
        ctx.fill();
        ctx.filter = 'none';
      }
    }

    // Création de plusieurs couches
    const layers = [
      new AuroraLayer("rgba(0,255,150,0.5)", 0.01,  80, 0.008, 40, 0.015, height * 0.25),
      new AuroraLayer("rgba(0,200,255,0.4)", 0.013, 60, 0.010, 30, 0.018, height * 0.30),
      new AuroraLayer("rgba(150,255,200,0.3)",0.008, 70, 0.007, 50, 0.012, height * 0.20),
    ];

    function animateAurora() {
      ctxAurore.clearRect(0, 0, width, height);
      ctxAurore.globalCompositeOperation = 'lighter';

      // Optionnel : ajouter quelques étoiles
      for (let i = 0; i < 50; i++) {
        ctxAurore.fillStyle = `rgba(255,255,255,${Math.random()*0.5})`;
        const sx = Math.random()*width, sy = Math.random()*height*0.5;
        ctxAurore.fillRect(sx, sy, 1.5, 1.5);
      }

      layers.forEach(layer => {
        layer.update();
        layer.draw(ctxAurore);
      });

      requestAnimationFrame(animateAurora);
    }

    animateAurora();