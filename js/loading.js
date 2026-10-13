
/* lock du scroll pendant l'intro : en classe (pas en inline) pour que
   les overlays puissent réutiliser `body.style.overflow` librement */
document.body.classList.add("is-loading");

window.addEventListener("DOMContentLoaded", () => {
    const loader = document.querySelector(".loaderXd");
    const cube = document.querySelector(".mini-container");
    if (!loader) {
        document.body.classList.remove("is-loading");
        window.dispatchEvent(new Event("et-loader-done"));
        return;
    }

    /* sortie en 2 temps : le cube se replie puis les 8 bandes du voile
       remontent en cascade (~0.75s + stagger) — total ~1.8s */
    setTimeout(() => { if (cube) cube.classList.add("is-out"); }, 400);
    setTimeout(() => loader.classList.add("is-out"), 750);
    setTimeout(() => {
        loader.style.display = "none";
        document.body.classList.remove("is-loading");
        /* signal de fin de voile : le hero cale son intro dessus pour
           laisser respirer la transition au lieu de jouer caché dessous */
        window.dispatchEvent(new Event("et-loader-done"));
    }, 1800);
});
