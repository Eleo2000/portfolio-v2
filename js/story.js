/* ================================================================
   story.js — portage vanilla de RECKLESS-CUP Story.jsx
   pin + scrub : chaque étape = hold stable puis transition,
   images via mask-image sprite inkmask en steps(48).
   ================================================================ */

window.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('story');
    if (!section || typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const counter = document.getElementById('storyCounter');
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
        // la barre d'adresse mobile ne doit pas relancer un refresh du pin
        ScrollTrigger.config({ ignoreMobileResize: true });

        const layers = gsap.utils.toArray(section.querySelectorAll('.story__image-layer'));
        const copies = gsap.utils.toArray(section.querySelectorAll('.story__copy'));

        layers.forEach((layer, i) => {
            gsap.set(layer, {
                zIndex: layers.length - i,
                webkitMaskPosition: '0% 0%',
                maskPosition: '0% 0%'
            });
        });
        copies.forEach((item, i) => {
            // visibility (pas opacity) : une copie inactive sort du
            // hit-test ET de l'ordre de tab
            gsap.set(item, { zIndex: copies.length - i, visibility: i === 0 ? 'inherit' : 'hidden' });
            if (i > 0) gsap.set(item.querySelectorAll('.story__reveal-in'), { yPercent: 125, opacity: 0 });
        });

        // entrée de section : le premier frame monte depuis le bas et se pose
        gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: 'top 75%',
                toggleActions: 'play none none reverse'
            }
        })
        .fromTo(layers[0].querySelector('.story__frame'),
            { scale: 0.7, yPercent: 55, transformOrigin: '50% 100%' },
            { scale: 1, yPercent: 0, duration: 0.9, ease: 'power3.out' });

        // pin + scrub : le scroll NATIF porte la timeline — wheel, tactile,
        // scrollbar, clavier marchent pareil, mobile inclus.
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: 'top top',
                // +=150% + scrub 0.65 : moins de scroll à parcourir et suivi
                // plus serré que le couple RECKLESS (+=200% / scrub 1) —
                // le lag de rattrapage d'1s rendait la traversée molle
                end: '+=150%',
                pin: true,
                scrub: 0.65,
                anticipatePin: 1,
                refreshPriority: 1,
                invalidateOnRefresh: true,
                // geste relâché -> le scroll auto-settle au label le plus
                // proche : jamais de slide garée à moitié
                snap: {
                    snapTo: 'labelsDirectional',
                    duration: { min: 0.25, max: 0.85 },
                    delay: 0.1,
                    ease: 'power2.inOut',
                    inertia: false
                }
            }
        });
        tl.addLabel('step0', 0);

        // convoyeur : cartes entrantes posées SOUS le stack
        gsap.set(layers.slice(1), { yPercent: 55, autoAlpha: 0 });
        const visualStack = section.querySelector('.story__visual-stack');
        gsap.set(visualStack, { yPercent: 4 });

        // chaque cran = [hold ~0.5u : état stable] + transition.
        // le texte sortant finit AVANT que l'entrant n'arrive.
        layers.forEach((_, i) => {
            if (i === 0) return;
            const base = `step${i - 1}`;
            const outgoingCopy = copies[i - 1].querySelectorAll('.story__reveal-in');
            const incomingCopy = copies[i].querySelectorAll('.story__reveal-in');

            // crossfade continu : l'entrante devient visible des le debut
            // de la transition et la sortante n'est masquee qu'une fois
            // l'entrante en place — plus aucune zone « copie vide » meme
            // si le scroll se gare au milieu d'un cran
            tl.set(copies[i], { visibility: 'inherit' }, `${base}+=0.55`)
            .set(copies[i - 1], { visibility: 'hidden' }, `${base}+=1.0`)
            .to(outgoingCopy, {
                yPercent: -125,
                opacity: 0,
                stagger: 0.035,
                duration: 0.24,
                ease: 'power2.in'
            }, `${base}+=0.50`)
            .to(layers[i - 1], {
                webkitMaskPosition: '100% 0%',
                maskPosition: '100% 0%',
                duration: 0.72,
                ease: 'steps(48)'
            }, `${base}+=0.56`)
            // convoyeur : le sortant glisse vers le haut, l'entrant monte
            .to(layers[i - 1], {
                yPercent: -60,
                duration: 0.8,
                ease: 'power1.in'
            }, `${base}+=0.58`)
            .to(layers[i], {
                yPercent: 0,
                autoAlpha: 1,
                duration: 0.86,
                ease: 'power2.out'
            }, `${base}+=0.52`)
            .fromTo(layers[i].querySelector('.story__frame'), {
                scale: 1.04
            }, {
                scale: 1,
                duration: 0.72,
                ease: 'power1.out'
            }, `${base}+=0.56`)
            .to(counter, {
                yPercent: (-100 / layers.length) * i,
                duration: 0.3,
                ease: 'power2.inOut'
            }, `${base}+=0.80`)
            .to(incomingCopy, {
                yPercent: 0,
                opacity: 1,
                stagger: 0.05,
                duration: 0.35,
                ease: 'power3.out'
            }, `${base}+=0.84`);
            tl.addLabel(`step${i}`); // point de repos = fin de transition
        });
        // parallax décor sur l'ensemble
        tl.to(visualStack, { yPercent: -4, ease: 'none', duration: tl.duration() }, 0);
        return () => tl.kill();
    });
});
