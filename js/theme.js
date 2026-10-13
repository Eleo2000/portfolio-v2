/* ================================================================
   theme.js — toggle light/dark.
   data-theme posé tôt en <head> (init inline index.html) pour éviter
   le flash ; ce fichier gère le bouton + la persistance.
   ================================================================ */

(function () {
    const KEY = 'et-theme';
    const root = document.documentElement;

    const current = () => (root.dataset.theme === 'dark' ? 'dark' : 'light');

    const apply = (theme) => {
        root.dataset.theme = theme;
        try { localStorage.setItem(KEY, theme); } catch (e) { /* privé */ }
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            const dark = theme === 'dark';
            btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
            btn.setAttribute('aria-label', dark ? 'Passer en mode clair' : 'Passer en mode sombre');
            btn.title = btn.getAttribute('aria-label');
        }
    };

    window.addEventListener('DOMContentLoaded', () => {
        apply(current()); // synchro aria/pressed avec le theme posé en head
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            apply(current() === 'dark' ? 'light' : 'dark');
        });
    });
})();
