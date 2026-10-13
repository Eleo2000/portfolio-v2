/* ================================================================
   are-ready.js — section CTA « let's build » (porté de RECKLESS-CUP
   AreReady.jsx) : fond WebGL raymarché (desktop) / champ d'étoiles
   (mobile), reveal lettre par lettre, pin + elargissement du frame.
   ================================================================ */

(function () {
    const section = document.querySelector('.ready');
    const frame = document.getElementById('readyFrame');
    const canvas = document.getElementById('readyCanvas');
    if (!section || !frame || !canvas) return;

    const compactGPU = window.matchMedia?.('(pointer: coarse)').matches
        || (navigator.hardwareConcurrency || 8) < 4;

    const VERTEX_SRC = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

    // desktop : prisme octaédrique raymarché + satellites (verbatim)
    const FRAGMENT_SRC = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;

#define PI 3.14159265359
#define TAU 6.28318530718
#define MAX_STEPS 80
#define MAX_DIST 50.0
#define SURF_DIST 0.001
#define SAT_COUNT 4

float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

mat2 rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

float sdOctahedron(vec3 p, float s) {
    p = abs(p);
    float m = p.x + p.y + p.z - s;
    vec3 q;
    if(3.0 * p.x < m) q = p.xyz;
    else if(3.0 * p.y < m) q = p.yzx;
    else if(3.0 * p.z < m) q = p.zxy;
    else return m * 0.57735027;

    float k = clamp(0.5 * (q.z - q.y + s), 0.0, s);
    return length(vec3(q.x, q.y - s + k, q.z - k));
}

float sdTriPrism(vec3 p, vec2 h) {
    vec3 q = abs(p);
    return max(q.z - h.y, max(q.x * 0.866025 + p.y * 0.5, -p.y) - h.x * 0.5);
}

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

float smax(float a, float b, float k) {
    return -smin(-a, -b, k);
}

float map(vec3 p) {
    vec2 m = (uMouse - 0.5) * 2.5;
    p.xy += m * 0.4;

    p.xz *= rot(uTime * 0.12);
    p.xy *= rot(uTime * 0.08);

    vec3 p1 = p;
    p1.yz *= rot(uTime * 0.15);

    float core_distort = sin(p1.x * 3.0 + uTime) * sin(p1.y * 3.0 + uTime) * sin(p1.z * 3.0 + uTime) * 0.1;
    float d = sdOctahedron(p1, 1.6) + core_distort;

    vec3 p2 = p1;
    p2.xy *= rot(PI * 0.25 + uTime * 0.2);
    float prism = sdTriPrism(p2, vec2(1.4, 2.0));
    d = smax(d, -prism, 0.2);

    float k_blend = 0.2 + 0.15 * (0.5 + 0.5 * sin(uTime * 1.5));

    for(int i = 0; i < SAT_COUNT; i++) {
        float fi = float(i);
        float angle = fi * TAU / float(SAT_COUNT) + uTime * 0.3;
        float radius = 3.0 + 0.3 * sin(uTime * 0.4 + fi);

        vec3 pos = vec3(
            cos(angle) * radius,
            sin(angle * 0.7) * 1.0,
            sin(angle) * radius
        );

        vec3 po = p - pos;
        po.xy *= rot(uTime * 0.5 + fi);

        float sat_distort = sin(po.x * 5.0 + fi) * sin(po.y * 5.0 + fi) * sin(po.z * 5.0 + fi) * 0.05;
        float satellite = sdOctahedron(po, 0.4) + sat_distort;

        d = smin(d, satellite, k_blend);
    }

    return d;
}

vec3 getNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yyx) - map(p - e.yyx)
    ));
}

float raymarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    for(int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);
        if(abs(d) < SURF_DIST || t > MAX_DIST) break;
        t += d * 0.7;
    }
    return t;
}

vec3 getBackground(vec3 rd) {
    float stars = 0.0;
    vec3 p = rd * 100.0;
    float h = hash(dot(p, vec3(12.9898, 78.233, 54.53)));
    if(h > 0.98) stars = pow(h - 0.98, 10.0) * 20.0;
    vec3 nebula = vec3(0.0);
    nebula += vec3(0.3, 0.15, 0.5) * pow(max(0.0, sin(rd.x * 2.0 + uTime * 0.1)), 3.0) * 0.2;
    nebula += vec3(0.15, 0.3, 0.6) * pow(max(0.0, sin(rd.y * 2.5 + uTime * 0.05)), 3.0) * 0.2;
    return stars + nebula;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);
    vec2 m = (uMouse - 0.5) * 0.5;
    vec3 ro = vec3(m.x * 2.0, m.y * 2.0, 5.5);
    vec3 rd = normalize(vec3(uv, -1.0));

    rd.xy *= rot(m.x * 0.2);
    rd.yz *= rot(m.y * 0.2);

    float t = raymarch(ro, rd);
    vec3 color = vec3(0.0);

    if(t < MAX_DIST) {
        vec3 p = ro + rd * t;
        vec3 normal = getNormal(p);
        vec3 viewDir = normalize(ro - p);

        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
        float ior = 1.5;
        vec3 refractDir = refract(rd, normal, 1.0 / ior);

        if(length(refractDir) > 0.0) {
            float t2 = raymarch(p - normal * 0.01, refractDir);
            if(t2 < MAX_DIST) {
                vec3 p2 = p - normal * 0.01 + refractDir * t2;
                vec3 normal2 = getNormal(p2);
                vec3 r = refract(refractDir, -normal2, ior - 0.2);
                vec3 g = refract(refractDir, -normal2, ior);
                vec3 b = refract(refractDir, -normal2, ior + 0.2);
                vec3 bgR = getBackground(r) * vec3(1.4, 0.7, 0.7);
                vec3 bgG = getBackground(g) * vec3(0.7, 1.4, 0.8);
                vec3 bgB = getBackground(b) * vec3(0.7, 0.8, 1.4);
                color = vec3(bgR.x, bgG.y, bgB.z);
                color = pow(color, vec3(0.7)) * 5.0;
            } else {
                color = getBackground(refractDir) * 2.0;
            }
        }

        vec3 lightDir = normalize(vec3(1.0, 1.0, -1.0));
        vec3 halfDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfDir), 0.0), 150.0);
        color += spec * vec3(1.0) * 3.5;

        vec3 fresnelColor = vec3(
            0.5 + 0.5 * sin(fresnel * TAU + uTime),
            0.5 + 0.5 * sin(fresnel * TAU + uTime + TAU / 3.0),
            0.5 + 0.5 * sin(fresnel * TAU + uTime + TAU * 2.0 / 3.0)
        );
        color += fresnel * fresnelColor * 1.2;

        float edge = pow(1.0 - abs(dot(viewDir, normal)), 4.0);
        color += edge * vec3(0.6, 0.7, 1.0) * 0.7;

        float sss = pow(max(dot(-normal, lightDir), 0.0), 2.0);
        color += sss * vec3(1.0, 0.6, 0.8) * 0.5;
    } else {
        color = getBackground(rd);
    }

    float vignette = 1.0 - length(uv) * 0.4;
    vignette = smoothstep(0.3, 1.0, vignette);
    color *= vignette;
    color *= vec3(0.96, 0.99, 1.06);
    color = pow(color, vec3(0.88));
    color *= 1.12;

    gl_FragColor = vec4(color, 1.0);
}
`;

    // mobile : pas de raymarching — étoiles scintillantes + nebula douce
    const FRAGMENT_SRC_MOBILE = `
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;

#define TAU 6.28318530718

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);
    vec2 m = (uMouse - 0.5) * 0.5;

    vec3 color = vec3(0.0);

    // etoiles : une par cellule, scintillement
    vec2 sp = uv * 55.0;
    vec2 cell = floor(sp);
    float h = hash(cell);
    vec2 off = vec2(hash(cell + 7.13), hash(cell + 3.71)) - 0.5;
    float sd = length(fract(sp) - 0.5 - off * 0.7);
    float tw = 0.5 + 0.5 * sin(uTime * (1.0 + h * 2.0) + h * TAU);
    color += (1.0 - smoothstep(0.0, 0.07, sd)) * step(0.80, h) * tw * vec3(0.85, 0.92, 1.1) * 1.4;

    // deuxieme passe : grains plus fins, quelques etoiles vives en plus
    vec2 sp2 = uv * 120.0 + 31.7;
    vec2 cell2 = floor(sp2);
    float h2 = hash(cell2);
    float sd2 = length(fract(sp2) - 0.5 - (vec2(hash(cell2 + 2.9), hash(cell2 + 9.4)) - 0.5) * 0.6);
    float tw2 = 0.5 + 0.5 * sin(uTime * (0.8 + h2 * 1.5) + h2 * TAU);
    color += (1.0 - smoothstep(0.0, 0.05, sd2)) * step(0.93, h2) * tw2 * vec3(1.0, 0.9, 0.8) * 1.1;

    // nebula : deux blobs doux en derive
    vec2 np = uv + m * 0.2;
    vec2 n1 = np - vec2(sin(uTime * 0.11) * 0.4, 0.28 + cos(uTime * 0.09) * 0.08);
    vec2 n2 = np - vec2(-0.32 + cos(uTime * 0.07) * 0.12, -0.2);
    color += vec3(0.30, 0.15, 0.55) * exp(-3.0 * dot(n1, n1)) * 0.55;
    color += vec3(0.12, 0.28, 0.62) * exp(-4.5 * dot(n2, n2)) * 0.55;

    // vignette + tonalite identiques a la version desktop
    float vignette = 1.0 - length(uv) * 0.4;
    vignette = smoothstep(0.3, 1.0, vignette);
    color *= vignette;
    color *= vec3(0.96, 0.99, 1.06);
    color = pow(color, vec3(0.88));
    color *= 1.12;

    gl_FragColor = vec4(color, 1.0);
}
`;

    /* ---------- WebGL ---------- */
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' });
    if (gl) {
        const compile = (type, src) => {
            const sh = gl.createShader(type);
            gl.shaderSource(sh, src);
            gl.compileShader(sh);
            if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
                console.warn('ready shader', gl.getShaderInfoLog(sh));
                return null;
            }
            return sh;
        };

        const vs = compile(gl.VERTEX_SHADER, VERTEX_SRC);
        const fs = compile(gl.FRAGMENT_SHADER, compactGPU ? FRAGMENT_SRC_MOBILE : FRAGMENT_SRC);
        const program = gl.createProgram();
        if (vs && fs) {
            gl.attachShader(program, vs);
            gl.attachShader(program, fs);
            gl.linkProgram(program);
        }

        if (vs && fs && gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
            const posLoc = gl.getAttribLocation(program, 'position');
            const uTime = gl.getUniformLocation(program, 'uTime');
            const uResolution = gl.getUniformLocation(program, 'uResolution');
            const uMouse = gl.getUniformLocation(program, 'uMouse');
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

            // canvas = 100vw fixe centré dans le frame : il ne bouge pas
            // quand le frame s'élargit, on ne recalibre que sur resize
            const resize = () => {
                const r = canvas.getBoundingClientRect();
                if (r.width === 0 || r.height === 0) return;
                const dpr = Math.min(window.devicePixelRatio || 1, compactGPU ? 0.75 : 1.5);
                canvas.width = Math.round(r.width * dpr);
                canvas.height = Math.round(r.height * dpr);
                gl.viewport(0, 0, canvas.width, canvas.height);
            };
            resize();
            window.addEventListener('resize', resize);

            const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
            const onMove = (e) => {
                const r = canvas.getBoundingClientRect();
                if (r.width === 0 || r.height === 0) return;
                mouse.tx = (e.clientX - r.left) / r.width;
                mouse.ty = 1.0 - (e.clientY - r.top) / r.height;
            };
            // pointermove couvre aussi le drag tactile : la parallax
            // fonctionne sur mobile quand le doigt reste sur la section
            section.addEventListener('pointermove', onMove);

            let raf = null;
            let visible = false;
            const start = performance.now();
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const frameMs = compactGPU ? 40 : 0; // tactile : ~25fps
            let lastT = 0;

            const tick = () => {
                if (!visible) { raf = null; return; }
                const now = performance.now();
                if (now - lastT >= frameMs) {
                    lastT = now;
                    mouse.x += (mouse.tx - mouse.x) * 0.05;
                    mouse.y += (mouse.ty - mouse.y) * 0.05;
                    gl.clearColor(0, 0, 0, 1);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                    gl.useProgram(program);
                    gl.uniform1f(uTime, (now - start) * 0.001);
                    gl.uniform2f(uResolution, canvas.width, canvas.height);
                    gl.uniform2f(uMouse, mouse.x, mouse.y);
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                }
                if (reduced) { raf = null; return; } // une frame statique suffit
                raf = requestAnimationFrame(tick);
            };

            const io = new IntersectionObserver(([entry]) => {
                visible = entry.isIntersecting;
                if (visible && raf === null) raf = requestAnimationFrame(tick);
            }, { threshold: 0.05 });
            io.observe(section);
        }
    } else {
        frame.classList.add('ready__frame--no-gl');
    }

    /* ---------- reveal + élargissement + pin (verbatim AreReady) ---------- */
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    // le fond shader apparait en fondu a l'entree de la section
    gsap.fromTo(canvas,
        { opacity: 0 },
        {
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'top 95%',
                end: 'top 55%',
                scrub: 0.6
            }
        }
    );

    // container etroit qui s'elargit en entrant dans la section,
    // centre par margin-inline:auto
    const endRadius = getComputedStyle(frame).borderRadius;
    gsap.fromTo(frame,
        { width: '62%', borderRadius: '40px' },
        {
            width: '100%',
            borderRadius: endRadius,
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'top 95%',
                end: 'center center',
                scrub: 0.6,
                invalidateOnRefresh: true
            }
        }
    );

    // le pin fige la section centree pendant le scroll : le reveal finit
    // de se jouer puis le CTA reste a l'ecran un moment — hold un peu
    // plus court sur tactile car le scroll y est plus lent.
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    const pinST = ScrollTrigger.create({
        trigger: section,
        start: 'center center',
        end: coarse ? '+=75%' : '+=80%',
        pin: true,
        pinSpacing: true,
        anticipatePin: 1
    });

    // le texte ne se montre que quand le frame est ~100% : le trigger
    // demarre juste avant la fin de l'elargissement (positions derivees
    // du pin, refreshPriority -1 pour mesurer apres le pin). pas de
    // scrub : la cascade joue en entier meme sur un geste bref, le
    // reverse re-masque tout en remontant
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: () => pinST.start - (pinST.end - pinST.start) * (coarse ? 0.06 : 0.17),
            toggleActions: 'play none none reverse',
            refreshPriority: -1
        }
    });

    tl.from('.ready__ch-in', {
        yPercent: 120,
        rotation: 6,
        transformOrigin: '50% 100%',
        duration: 0.9,
        ease: 'power4.out',
        stagger: { each: 0.035, from: 'center' }
    })
    .from('.ready__tag', { opacity: 0, y: 12, duration: 0.5, ease: 'power2.out' }, '-=0.55')
    .from('.ready__tagline', { opacity: 0, y: 14, duration: 0.6, ease: 'power2.out' }, '-=0.35')
    .from('.ready__btn', { opacity: 0, y: 18, scale: 0.94, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.3');

    // le hold du pin depasse la fin du reveal : ce message comble le
    // temps mort, colle en bas du frame pendant la fin du hold
    // (positions derivees du pin : 72% -> 97% de sa duree)
    gsap.fromTo('.ready__hint',
        { opacity: 0, y: 14 },
        {
            opacity: 1,
            y: 0,
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: () => pinST.start + (pinST.end - pinST.start) * 0.72,
                end: () => pinST.start + (pinST.end - pinST.start) * 0.97,
                scrub: 0.6,
                refreshPriority: -1
            }
        }
    );

    // halo radial du bouton qui suit le curseur (verbatim)
    const btn = section.querySelector('.ready__btn');
    if (btn) {
        btn.addEventListener('mousemove', (e) => {
            const r = btn.getBoundingClientRect();
            btn.style.setProperty('--x', `${e.clientX - r.left}px`);
            btn.style.setProperty('--y', `${e.clientY - r.top}px`);
        });
    }
})();
