const starCanvas = document.getElementById("starfield");
  const ctx2 = starCanvas.getContext("2d");

  let w = starCanvas.width = window.innerWidth;
  let h = starCanvas.height = window.innerHeight;

  const stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.1 + 0.4,
    baseSpeed: Math.random() * 0.3 + 0.1,
    flicker: Math.random() * 100,
    isShooting: false
  }));

  window.addEventListener("resize", () => {
    w = starCanvas.width = window.innerWidth;
    h = starCanvas.height = window.innerHeight;
  });

  let scrollBoost = 0;
  window.addEventListener("scroll", () => {
    scrollBoost = 1.2;
  });

  function animateStars() {
    ctx2.clearRect(0, 0, w, h);

    scrollBoost *= 0.94;

    for (let star of stars) {
      // Flicker (clignotement fluide)
      star.flicker += 0.05;
      const flickerAlpha = 0.5 + Math.sin(star.flicker) * 0.3;

      const speed = star.baseSpeed + scrollBoost;

      // Shooting star behavior
      if (!star.isShooting && Math.random() < 0.001) {
        star.isShooting = true;
        star.vx = Math.random() * 4 + 2;
        star.vy = Math.random() * 2 + 1;
        star.opacity = 1;
      }

      if (star.isShooting) {
        star.x += star.vx;
        star.y += star.vy;
        star.r = 1.5;
        star.opacity -= 0.02;

        if (star.opacity <= 0 || star.x > w || star.y > h) {
          star.x = Math.random() * w;
          star.y = Math.random() * h / 2;
          star.r = Math.random() * 1 + 0.4;
          star.isShooting = false;
          star.opacity = 1;
        }
      } else {
        star.y += speed;
        if (star.y > h) {
          star.y = 0;
          star.x = Math.random() * w;
        }
      }

      ctx2.beginPath();
      ctx2.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx2.fillStyle = `rgba(255,255,255,${flickerAlpha.toFixed(2)})`;
      ctx2.shadowColor = "#0ff";
      ctx2.shadowBlur = 6;
      ctx2.fill();
    }

    requestAnimationFrame(animateStars);
  }

  animateStars();