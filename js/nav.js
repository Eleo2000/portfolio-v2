/* ================================================================
   nav.js — drawer menu (porté de RECKLESS-CUP Header.jsx) +
   scroll-spy sur .menu-panel__item
   ================================================================ */

window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('menu_btn');
    const wrap = document.getElementById('site-navigation');
    if (!btn || !wrap) return;

    const panel = wrap.querySelector('.menu-panel');
    const backdrop = wrap.querySelector('.menu-backdrop');
    const closeBtn = wrap.querySelector('.menu-panel__close');
    const links = [...wrap.querySelectorAll('.menu-panel__item')];
    let open = false;

    const setOpen = (v) => {
        open = v;
        wrap.classList.toggle('show', v);
        btn.classList.toggle('is-open', v);
        btn.setAttribute('aria-expanded', v ? 'true' : 'false');
        btn.setAttribute('aria-label', v ? 'Fermer le menu' : 'Ouvrir le menu');
        document.body.style.overflow = v ? 'hidden' : '';
        if (v) panel?.querySelector('.menu-panel__item')?.focus();
    };

    btn.addEventListener('click', () => setOpen(!open));
    backdrop?.addEventListener('click', () => setOpen(false));
    closeBtn?.addEventListener('click', () => setOpen(false));
    // clic item : smooth-scroll natif + fermeture (les ancres href="#id"
    // sautent brut sinon — RECKLESS utilise scrollIntoView smooth)
    links.forEach((l) => l.addEventListener('click', (e) => {
        const href = l.getAttribute('href');
        const target = href?.startsWith('#') && document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setOpen(false);
    }));
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && open) setOpen(false);
    });

    /* ---------- smooth-scroll global sur les ancres ---------- */
    // remplace le scroll-behavior:smooth CSS retiré (il empoisonnait le
    // snap ScrollTrigger : chaque scrollTo par frame relançait une
    // animation CSS). e.defaultPrevented = déjà pris en charge par les
    // items du menu ci-dessus.
    document.addEventListener('click', (e) => {
        if (e.defaultPrevented) return;
        const a = e.target.closest('a[href^="#"]');
        const target = a && document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /* ---------- scroll-spy (port RECKLESS Header.jsx) ---------- */
    // IntersectionObserver + bande centrale : insensible aux pins
    // (offsetTop renvoie la position *visuelle* d'un élément fixed
    // épinglé, les bornes offset étaient donc fausses dans .story/#exp/#join)
    const sections = [...document.querySelectorAll('.section[id]')];
    const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            links.forEach((l) =>
                l.classList.toggle('is-active', l.getAttribute('href') === `#${entry.target.id}`));
        });
    }, { rootMargin: '-40% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
});
