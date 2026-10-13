# Verification

- This is a static site. Serve the repository with `python3 -m http.server 8791 --directory .` for browser checks; Three.js modules and assets require HTTP.
- Validate changed JavaScript with `node --check js/three-cards.js` (and the equivalent command for other changed scripts).
- For card-rendering changes, check desktop and mobile: repeated section entry/exit, open/close, Escape, resize during preview, and document/body overflow restoration.
- Measure performance with the same viewport, rendering backend, scroll position and loaded assets before and after changes. Software WebGL results are not representative of hardware GPU frame rates.
- An open, settled card preview should stop rendering. Rendering must resume on close or resize, and stop while the section or document is hidden.
