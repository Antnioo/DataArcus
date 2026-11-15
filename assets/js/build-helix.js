/*
 * DataArcus live build page: the helix (0.3.2 BF1; redrawn in 0.3.3 RL33, the owner D-1112-04: the Today app's helix,
 * movable and scalable). The integration branch is the spine; each job is a sphere on the strand around it, joined to the
 * spine by its rung, oldest at the bottom, newest at the top next to main, a glowing ring above the spine. A job whose
 * tests run carries an amber ring. A sphere's size is its cost. Drawn with three.js (a classic script, global THREE,
 * pinned on the page) with a bloom and a focus pass written here from three's own parts; where WebGL is not there, or
 * the device draws too slowly, the same helix seen from the front as an SVG. Every text shown comes from GitHub and is
 * set with textContent. It draws only what build-page.js hands it: the public repository's branches, runs and merges.
 *
 * Interface (the pure part runs in Node too):
 *   COLOURS                   state -> hex: red, ready, running, held, queued, merged; spine; background
 *   HELIX                     { height: 9, radius: 2.3 }
 *   MAX_NODES                 60: the most jobs drawn (the newest are kept)
 *   TIERS                     full | bloom | plain: pixel ratio, bloom, focus, shadows, stars
 *   turnsOf(n)                clamp(n / 10, 1.5, 4.5)
 *   nodeAt(i, n)              { t, angle, a: [x, y, z], b: [x, y, z] }: t = (i + 0.5) / n, a on the strand, b its mirror
 *   nodeRadius(cost, max)     0.11 + 0.21 * sqrt(cost / max) (0.11 without a cost)
 *   stateOf(status, merged)   the page's status (build-page.js statusOf) -> a helix state
 *   helixModel(items, merges, now?)  items: [{ code, status, message, ci, time, started?, cost?, note?, costText? }] newest
 *                             first; merges: [{ message, time }] -> { nodes: [...] oldest first, from, to, maxCost }
 *   replayAt(model, at)       the helix at a moment: { nodes: [{ ...node, shown, state }], building, finished, cost }; a
 *                             node is absent before it started and running until it merged; at model.to it is as it is now
 *   counterText(r, fmt?)      ["<n> being built", "<m> finished · $<cost> in 24 hours"]
 *   nextTier(tier, ms)        the tier after 45 frames averaging ms: above 28 one step down; above 50 at plain: 'svg'
 *   mount(host, win, opts?)   host: the element to draw in; opts.hhmm: the page's "HH:MM" (build-page.js); needs page-toast.js on the page; -> { mode: 'webgl' | 'svg', set(model), focus(code), tier(name?) }.
 *                             Drag turns it, the wheel (with the helix in focus, or Ctrl) and a pinch zoom, the arrow keys
 *                             turn and step through the jobs, + and - zoom, 0 resets, F is full screen. It turns by itself
 *                             only when motion is allowed, the tab shows and the helix is on screen; reduced motion: still.
 *                             host.dataset.mode, .motion and .tier say which; a data-tier on the element before mount pins that tier.
 * (c) DataArcus. All rights reserved.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BuildHelix = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const COLOURS = Object.freeze({ red: '#ff6b6b', ready: '#2dd4bf', running: '#fdcb6e', held: '#a29bfe', queued: '#74b9ff', merged: '#00d4ff', spine: '#00d4ff', background: '#0a0f1c' });
  const HELIX = Object.freeze({ height: 9, radius: 2.3 });
  const MAX_NODES = 60, DAY = 864e5, TAU = Math.PI * 2, MAIN_Y = HELIX.height / 2 + 0.75;
  const TIERS = Object.freeze({
    full: Object.freeze({ ratio: 2, bloom: true, focus: true, shadows: true, stars: 320 }),
    bloom: Object.freeze({ ratio: 1.5, bloom: true, focus: false, shadows: false, stars: 220 }),
    plain: Object.freeze({ ratio: 1, bloom: false, focus: false, shadows: false, stars: 120 }),
  });
  const CUT = 0.62, STEP_MS = 28, GIVE_UP_MS = 50, FRAMES = 45;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

  const turnsOf = (n) => clamp(n / 10, 1.5, 4.5);
  const nodeAt = (i, n) => {
    const t = (i + 0.5) / Math.max(1, n), angle = t * turnsOf(n) * TAU, x = HELIX.radius * Math.cos(angle), y = -HELIX.height / 2 + t * HELIX.height, z = HELIX.radius * Math.sin(angle);
    return { t, angle, a: [x, y, z], b: [-x, y, -z] };
  };
  const nodeRadius = (cost, max) => 0.11 + 0.21 * Math.sqrt(num(max) ? clamp(num(cost) / num(max), 0, 1) : 0);
  const stateOf = (status, merged) => (merged ? 'merged' : { running: 'running', red: 'red', green: 'ready', stopped: 'held', idle: 'queued' }[status] || 'queued');
  const nextTier = (tier, ms) => (ms > GIVE_UP_MS && tier === 'plain' ? 'svg' : ms > STEP_MS ? { full: 'bloom', bloom: 'plain', plain: 'plain' }[tier] || tier : tier);

  const helixModel = (items, merges, now) => {
    const to = num(now) || Date.now(), ms = Array.isArray(merges) ? merges : [];
    const list = (Array.isArray(items) ? items : []).slice(0, MAX_NODES).reverse();   // newest first in, oldest first out
    const mergedAt = (code) => { const m = code && ms.find((x) => x && new RegExp('^Merge ' + String(code).replace(/[^\w.-]/g, '') + '\\b').test(String(x.message || ''))); return m ? num(m.time) : 0; };
    const maxCost = list.reduce((m, it) => Math.max(m, num(it && it.cost)), 0);
    const nodes = list.map((it, i) => {
      const merged = mergedAt(it.code), started = Math.min(num(it.started) || num(it.time) || to, num(it.time) || to, merged || to);
      return { ...it, ...nodeAt(i, list.length), cost: num(it.cost), radius: nodeRadius(it.cost, maxCost), started, merged, state: stateOf(it.status, merged) };
    });
    const first = nodes.reduce((m, n) => Math.min(m, n.started), to);
    return { nodes, from: Math.min(to, Math.max(to - DAY, first)), to, maxCost };
  };
  const replayAt = (model, at) => {
    const live = at == null || at >= model.to, when = live ? model.to : Math.max(model.from, at);
    const nodes = model.nodes.map((n) => {
      const shown = live || n.started <= when;
      return { ...n, shown, state: live ? n.state : n.merged && when >= n.merged ? 'merged' : 'running' };
    });
    const seen = nodes.filter((n) => n.shown), done = seen.filter((n) => n.state === 'merged' || n.state === 'ready');
    return { nodes, at: when, live, building: seen.length - done.length, finished: done.length, cost: done.reduce((s, n) => s + n.cost, 0) };
  };
  const usd = (n) => '$' + (Math.round(n * 100) / 100).toFixed(2);
  const counterText = (r, fmt) => [r.building + ' being built', r.finished + ' finished' + (r.cost > 0 ? ' · ' + (fmt || usd)(r.cost) : '') + ' in 24 hours'];
  const labelText = (n) => [n.code, n.message || '(no message)', 'CI: ' + (n.ci || 'no run') + (n.note ? ' | note: ' + n.note : '') + (n.costText ? ' | cost ' + n.costText : '')];
  const WORDS = Object.freeze({
    stage: 'The build helix. Drag to turn it; scroll or pinch to zoom; arrow keys turn it and step through the jobs; plus and minus zoom; 0 resets; F is full screen.',
    full: 'Full screen', leave: 'Leave full screen', replay: 'Replay the last 24 hours', now: 'now',
    hint: 'Drag to turn. Click the helix, then scroll, or pinch, to zoom.',
    flat: 'Your browser does not draw 3D here: this is the same helix seen from the front. The cards below hold the same jobs.',
  });

  const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const FRAG_BRIGHT = 'uniform sampler2D tMap; uniform float uCut; varying vec2 vUv; void main() { vec3 c = texture2D(tMap, vUv).rgb; float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); gl_FragColor = vec4(c * smoothstep(uCut, uCut + 0.3, l), 1.0); }';
  const FRAG_BLUR = 'uniform sampler2D tMap; uniform vec2 uStep; varying vec2 vUv; void main() { vec3 c = texture2D(tMap, vUv).rgb * 0.227; c += (texture2D(tMap, vUv + uStep * 1.385).rgb + texture2D(tMap, vUv - uStep * 1.385).rgb) * 0.316; c += (texture2D(tMap, vUv + uStep * 3.231).rgb + texture2D(tMap, vUv - uStep * 3.231).rgb) * 0.0703; gl_FragColor = vec4(c, 1.0); }';
  const FRAG_MIX = '#include <packing>\nuniform sampler2D tMap; uniform sampler2D tGlow; uniform sampler2D tWide; uniform sampler2D tSoft; uniform sampler2D tDepth; uniform float uGlow; uniform float uFocus; uniform float uNear; uniform float uFar; uniform float uAt; uniform float uRange; varying vec2 vUv;\n'
    + 'void main() { vec3 c = texture2D(tMap, vUv).rgb; if (uFocus > 0.0) { float z = -perspectiveDepthToViewZ(texture2D(tDepth, vUv).x, uNear, uFar); c = mix(c, texture2D(tSoft, vUv).rgb, uFocus * smoothstep(uRange * 0.45, uRange, abs(z - uAt))); }\n'
    + 'c += (texture2D(tGlow, vUv).rgb + texture2D(tWide, vUv).rgb * 0.8) * uGlow; vec2 q = vUv - 0.5; c *= 1.0 - dot(q, q) * 0.35; gl_FragColor = vec4(c, 1.0);\n#include <colorspace_fragment>\n}';

  // ---- the frame every mode shares: the stage (canvas or SVG), the label, the full-screen button, the replay row; and what the
  // steps below share (cx): the model, the view at the replay's moment, the job in hand, the mode drawing it
  const makeFrame = (host, win, opts) => {
    const doc = win.document, THREE = win.THREE, NS = 'http://www.w3.org/2000/svg';
    const calm = () => !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const el = (tag, cls, text) => win.DAPageToast.el(doc, tag, cls, text);   // page-toast.js, its one place (loaded before build-page.js, which calls mount)
    const mk = (tag, attrs) => { const e = doc.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
    host.removeAttribute('aria-hidden'); host.classList.add('bh');
    const stage = el('div', 'bh-stage'); stage.tabIndex = 0; stage.setAttribute('role', 'group'); stage.setAttribute('aria-label', WORDS.stage);
    const label = el('div', 'bh-label'); label.hidden = true;
    const said = el('p', 'bh-said'); said.setAttribute('aria-live', 'polite');   // the job the keys stepped to, for a screen reader
    const fullBtn = el('button', 'bh-full'); fullBtn.type = 'button';
    const icon = mk('svg', { viewBox: '0 0 24 24', width: 20, height: 20, 'aria-hidden': 'true', focusable: 'false' });
    const iconPath = mk('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); icon.append(iconPath); fullBtn.append(icon);
    const hint = el('p', 'bh-hint', WORDS.hint), flat = el('p', 'bh-flat', WORDS.flat); flat.hidden = true;
    const bar = el('div', 'bh-bar'), count = el('p', 'bh-count'), cA = el('span', 'bh-c1'), cB = el('span', 'bh-c2'); count.append(cA, cB);
    const slideLab = el('label', 'bh-replay'), slideText = el('span', 'bh-replay-t', WORDS.replay), slider = el('input', 'bh-range'), slideAt = el('output', 'bh-at', WORDS.now);
    slider.type = 'range'; slider.min = '0'; slider.max = '1000'; slider.step = '1'; slider.value = '1000';
    slideLab.append(slideText, slider); bar.append(count, slideLab, slideAt);
    host.replaceChildren(stage, hint, flat, bar, said);
    const showLabel = (n, x, y) => {
      label.replaceChildren(...labelText(n).map((t, i) => el('div', i === 0 ? 'bh-l0' : 'bh-l', t)));
      label.hidden = false;
      const w = stage.clientWidth || 300;
      label.style.left = Math.max(8, Math.min(w - label.offsetWidth - 8, x - label.offsetWidth / 2)) + 'px';
      label.style.top = Math.max(8, y - label.offsetHeight - 14) + 'px';
    };
    const hideLabel = () => { label.hidden = true; };
    const hhmm = (opts && opts.hhmm) || ((ms) => new Date(ms).toISOString().slice(11, 16));   // the page's own clock text (build-page.js hhmm); without it, the hour in UTC
    const cx = { host, win, doc, THREE, NS, el, mk, calm, stage, label, said, fullBtn, iconPath, flat, slider, slideAt, cA, cB, hhmm, showLabel, hideLabel,
      model: helixModel([], [], Date.now()), view: null, at: null, picked: -1, impl: null, filled: false, api: null };
    cx.view = replayAt(cx.model, null);
    return cx;
  };

  // ---- the replay slider and the counter beside it
  const wireReplay = (cx) => {
    const { slider, slideAt, cA, cB, hhmm } = cx;
    cx.paint = () => {
      cx.view = replayAt(cx.model, cx.at);
      const [a, b] = counterText(cx.view); cA.textContent = a; cB.textContent = b;
      slideAt.textContent = cx.view.live ? WORDS.now : hhmm(cx.view.at);
      slider.setAttribute('aria-valuetext', cx.view.live ? WORDS.now : hhmm(cx.view.at));
      if (cx.impl) cx.impl.show();
    };
    slider.addEventListener('input', () => { const v = +slider.value; cx.at = v >= 1000 ? null : cx.model.from + (cx.model.to - cx.model.from) * v / 1000; cx.hideLabel(); cx.paint(); });
  };

  // ---- full screen: the browser's own where it has it, else the stage fills the window (iPhone); Escape leaves either
  const wireFull = (cx) => {
    const { host, doc, fullBtn, iconPath } = cx;
    const isFull = () => cx.filled || doc.fullscreenElement === host;
    const fullLook = () => {
      const on = isFull(); host.classList.toggle('bh-on', on); fullBtn.setAttribute('aria-label', on ? WORDS.leave : WORDS.full); fullBtn.title = on ? WORDS.leave : WORDS.full; fullBtn.setAttribute('aria-pressed', String(on));
      iconPath.setAttribute('d', on ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5' : 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5');
      if (cx.impl) cx.impl.size();
    };
    const toggleFull = () => {
      if (doc.fullscreenElement === host) { doc.exitFullscreen(); return; }
      if (cx.filled) { cx.filled = false; fullLook(); return; }
      const fill = () => { cx.filled = true; fullLook(); };
      if (host.requestFullscreen) host.requestFullscreen().catch(fill); else fill();
    };
    fullBtn.addEventListener('click', toggleFull);
    doc.addEventListener('fullscreenchange', fullLook);
    Object.assign(cx, { isFull, fullLook, toggleFull });
  };

  // ---- the keys, the same in both modes: the mode gives turn, zoom, reset and where a node is on screen
  const wireKeys = (cx) => {
    const { stage, said, hideLabel } = cx;
    const step = (d) => {
      const idx = cx.view.nodes.map((n, i) => (n.shown ? i : -1)).filter((i) => i >= 0); if (!idx.length) return;
      const p = idx.indexOf(cx.picked), next = idx[p < 0 ? (d > 0 ? 0 : idx.length - 1) : clamp(p + d, 0, idx.length - 1)];
      cx.picked = next; const n = cx.view.nodes[next]; said.textContent = labelText(n).join('. ');
      if (cx.impl) cx.impl.focusIndex(next);
    };
    stage.addEventListener('keydown', (ev) => {
      const k = ev.key; let used = true;
      if (k === 'ArrowLeft') cx.impl.turn(-0.2, 0); else if (k === 'ArrowRight') cx.impl.turn(0.2, 0);
      else if (k === 'ArrowUp') step(1); else if (k === 'ArrowDown') step(-1);
      else if (k === '+' || k === '=') cx.impl.zoom(1 / 1.15); else if (k === '-' || k === '_') cx.impl.zoom(1.15);
      else if (k === '0' || k === 'Home') { cx.impl.reset(); hideLabel(); }
      else if (k === 'f' || k === 'F') cx.toggleFull();
      else if (k === 'Escape' && cx.filled) { cx.filled = false; cx.fullLook(); }
      else if (k === 'Escape') hideLabel();
      else used = false;
      if (used) ev.preventDefault();
    });
  };

  // ---- the SVG helix: the same points seen from the front (x across, y up, depth as size and light)
  const flatMode = (cx) => {
    const { host, win, doc, NS, stage, label, fullBtn, flat, mk, showLabel, hideLabel } = cx;
    host.dataset.mode = 'svg'; host.dataset.motion = 'still'; host.dataset.tier = 'svg'; flat.hidden = false;
    const svg = mk('svg', { viewBox: '0 0 400 520', class: 'bh-svg', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': 'The build helix, seen from the front' });
    stage.replaceChildren(svg, label, fullBtn);
    let yaw = 0, scale = 1;
    const P = (p) => { const c = Math.cos(yaw), s = Math.sin(yaw), x = p[0] * c + p[2] * s, z = -p[0] * s + p[2] * c; return { x: 200 + x * 42 * scale, y: 268 - p[1] * 46 * scale, z }; };
    const draw = () => {
      svg.replaceChildren();
      const n = cx.model.nodes.length, turns = turnsOf(n), top = P([0, MAIN_Y, 0]), low = P([0, -HELIX.height / 2 - 0.2, 0]);
      const defs = mk('defs', {}), g = mk('radialGradient', { id: 'bh-glow' }); g.append(mk('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '.9' }), mk('stop', { offset: '1', 'stop-color': COLOURS.spine, 'stop-opacity': '0' })); defs.append(g); svg.append(defs);
      for (const ph of [0, Math.PI]) {
        let d = ''; for (let i = 0; i <= 160; i++) { const t = i / 160, a = t * turns * TAU + ph, q = P([HELIX.radius * Math.cos(a), -HELIX.height / 2 + t * HELIX.height, HELIX.radius * Math.sin(a)]); d += (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1); }
        svg.append(mk('path', { d, fill: 'none', stroke: ph ? COLOURS.held : COLOURS.queued, 'stroke-width': 1.5, 'stroke-linecap': 'round', opacity: 0.45 }));
      }
      svg.append(mk('line', { x1: low.x, y1: low.y, x2: top.x, y2: top.y, stroke: COLOURS.spine, 'stroke-width': 3, 'stroke-linecap': 'round' }));
      svg.append(mk('circle', { cx: top.x, cy: top.y, r: 30 * scale, fill: 'url(#bh-glow)', opacity: 0.55 }), mk('ellipse', { cx: top.x, cy: top.y, rx: 26 * scale, ry: 8 * scale, fill: 'none', stroke: '#eaffff', 'stroke-width': 3 }));
      cx.view.nodes.map((nd, i) => ({ nd, i, a: P(nd.a), b: P(nd.b) })).filter((o) => o.nd.shown).sort((p, q) => p.a.z - q.a.z).forEach(({ nd, i, a, b }) => {
        const col = COLOURS[nd.state] || COLOURS.queued, r = nd.radius * 42 * scale * (1 + a.z * 0.06), grp = mk('g', { 'data-code': nd.code, 'data-index': i, tabindex: '-1', opacity: (0.72 + 0.28 * (a.z / HELIX.radius + 1) / 2).toFixed(2) });
        grp.append(mk('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: col, 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.6 }), mk('circle', { cx: b.x, cy: b.y, r: 2.2, fill: col }), mk('circle', { cx: a.x, cy: a.y, r: r.toFixed(1), fill: col }));
        if (nd.state === 'running') grp.append(mk('circle', { cx: a.x, cy: a.y, r: (r + 5).toFixed(1), fill: 'none', stroke: COLOURS.running, 'stroke-width': 2 }));
        grp.append(mk('circle', { cx: a.x, cy: a.y, r: Math.max(14, r + 6), fill: 'transparent' }));
        const t = doc.createElementNS(NS, 'title'); t.textContent = labelText(nd).join(' - '); grp.append(t);
        const at2 = (ev) => { const bx = stage.getBoundingClientRect(); showLabel(nd, ev.clientX - bx.left, ev.clientY - bx.top); };
        grp.addEventListener('pointerenter', at2); grp.addEventListener('pointerdown', at2); grp.addEventListener('pointerleave', hideLabel);
        svg.append(grp);
      });
    };
    const where = (i) => { const q = P(cx.model.nodes[i].a), bx = svg.getBoundingClientRect(), k = Math.min(bx.width / 400, bx.height / 520); return [bx.width / 2 + (q.x - 200) * k, bx.height / 2 + (q.y - 260) * k]; };
    let drag = null;
    svg.addEventListener('pointerdown', (ev) => { drag = { x: ev.clientX, yaw }; });
    win.addEventListener('pointermove', (ev) => { if (drag && Math.abs(ev.clientX - drag.x) > 4) { yaw = drag.yaw + (ev.clientX - drag.x) * 0.01; hideLabel(); draw(); } });
    win.addEventListener('pointerup', () => { drag = null; });
    return {
      show: draw, size: () => {}, turn: (dy) => { yaw += dy; draw(); }, zoom: (k) => { scale = clamp(scale / k, 0.6, 2.4); draw(); }, reset: () => { yaw = 0; scale = 1; draw(); },
      focusIndex: (i) => { const [x, y] = where(i); showLabel(cx.view.nodes[i], x, y); },
    };
  };

  // ---- WebGL, step 1: the renderer, the lights, the camera and what the next steps share (g)
  const glStage = (cx, canvas, pinned) => {
    const { THREE, doc, host, stage, label, fullBtn, flat } = cx;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setClearColor(new THREE.Color(COLOURS.background), 1);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvas.className = 'bh-canvas'; canvas.setAttribute('aria-hidden', 'true');
    stage.replaceChildren(canvas, label, fullBtn);
    host.dataset.mode = 'webgl'; flat.hidden = true;

    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(new THREE.Color(COLOURS.background), 14, 34);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 80);
    scene.add(new THREE.AmbientLight(0x9fb4ff, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(5, 9, 8); sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 7, bottom: -7, near: 1, far: 30 }); sun.shadow.bias = -0.002; scene.add(sun);
    const rim = new THREE.PointLight(new THREE.Color(COLOURS.spine), 30, 30); rim.position.set(-4, 2, -6); scene.add(rim);
    const group = new THREE.Group(); scene.add(group);

    // a soft round dot: the stars and the glows are this picture, so a point is round at every zoom, never a square
    const dot = (() => { const c = doc.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const glowMat = (col, op) => new THREE.SpriteMaterial({ map: dot, color: col, opacity: op == null ? 1 : op, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
    const lit = (col, glow) => new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: glow, roughness: 0.35, metalness: 0.1 });
    const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
    const rod = (A, B, r, mat) => { const d = B.clone().sub(A), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), mat); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m; };
    const st = { yaw: 0.5, pitch: 0.12, zoom: 1, fit: 14, w: 2, h: 2 };
    const place = () => { group.rotation.set(st.pitch, st.yaw, 0); camera.position.set(0, 0.25, st.fit * st.zoom); camera.lookAt(0, 0.25, 0); };
    return { canvas, renderer, scene, camera, sun, group, dot, glowMat, lit, V, rod, st, place, tierName: pinned || 'full', tier: TIERS[pinned || 'full'],
      stars: null, live: null, rings: [], spheres: [], mainRing: null, rt: null, held: 0, gone: false };
  };

  // ---- WebGL, step 2: the stars, the helix's parts, and the replay's view of them
  const glNodes = (cx, g) => {
    const { THREE, win } = cx, { scene, group, dot, glowMat, lit, V, rod } = g;
    g.makeStars = () => {
      if (g.stars) { scene.remove(g.stars); g.stars.geometry.dispose(); g.stars.material.dispose(); }
      const n = g.tier.stars, pos = new Float32Array(n * 3); let s = 7;
      const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };   // the same sky on every visit
      for (let i = 0; i < n; i++) { const r = 6 + rnd() * 9, a = rnd() * TAU, y = (rnd() - 0.5) * 18; pos[i * 3] = r * Math.cos(a); pos[i * 3 + 1] = y; pos[i * 3 + 2] = r * Math.sin(a); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.stars = new THREE.Points(geo, new THREE.PointsMaterial({ map: dot, color: 0xbfd4ff, size: 0.22, sizeAttenuation: true, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
      scene.add(g.stars);
    };
    g.clear = () => { if (!g.live) return; group.remove(g.live); g.live.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); }); g.live = null; };
    g.build = () => {
      g.clear(); g.rings = []; g.spheres = [];
      g.live = new THREE.Group(); group.add(g.live);
      const n = cx.model.nodes.length, turns = turnsOf(n), spineCol = new THREE.Color(COLOURS.spine);
      const spine = rod(new THREE.Vector3(0, -HELIX.height / 2 - 0.2, 0), new THREE.Vector3(0, MAIN_Y, 0), 0.05, lit(spineCol, 1.6)); spine.receiveShadow = true; g.live.add(spine);
      for (const [ph, col] of [[0, COLOURS.queued], [Math.PI, COLOURS.held]]) {
        const pts = Array.from({ length: 180 }, (_, i) => { const t = i / 179, a = t * turns * TAU + ph; return new THREE.Vector3(HELIX.radius * Math.cos(a), -HELIX.height / 2 + t * HELIX.height, HELIX.radius * Math.sin(a)); });
        g.live.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 360, 0.018, 6, false), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35 })));
      }
      g.mainRing = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.05, 16, 72), lit(new THREE.Color(0xeaffff), 1.5)); g.mainRing.rotation.x = Math.PI / 2 - 0.35; g.mainRing.position.y = MAIN_Y; g.live.add(g.mainRing);
      const halo = new THREE.Sprite(glowMat(spineCol, 0.55)); halo.scale.set(3.4, 3.4, 1); halo.position.y = MAIN_Y; g.live.add(halo);
      cx.model.nodes.forEach((nd, i) => {
        const A = V(nd.a), B = V(nd.b), mat = lit(new THREE.Color(COLOURS[nd.state] || COLOURS.queued), 0.9), part = new THREE.Group();
        const ball = new THREE.Mesh(new THREE.SphereGeometry(nd.radius, 28, 20), mat); ball.position.copy(A); ball.castShadow = true; ball.receiveShadow = true; ball.userData.index = i;
        const rung = rod(A, B, 0.022, mat), end = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mat); end.position.copy(B);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(nd.radius + 0.12, 0.022, 10, 48), lit(new THREE.Color(COLOURS.running), 2)); ring.position.copy(A);
        const glow = new THREE.Sprite(glowMat(mat.color, 0.5)); glow.scale.setScalar(nd.radius * 5); glow.position.copy(A);
        part.add(ball, rung, end, ring, glow); g.live.add(part);
        g.spheres.push({ part, ball, ring, glow, mat }); g.rings.push(ring);
      });
    };
    // the replay: which nodes are there, in which colour, which carry the ring
    g.show = () => {
      cx.view.nodes.forEach((nd, i) => {
        const s = g.spheres[i]; if (!s) return;
        s.part.visible = nd.shown; s.mat.color.set(COLOURS[nd.state] || COLOURS.queued); s.mat.emissive.copy(s.mat.color); s.glow.material.color.copy(s.mat.color); s.ring.visible = nd.state === 'running';
      });
      g.draw(win.performance.now());
    };
  };

  // ---- WebGL, step 3: the passes: bright parts blurred twice (a near and a wide glow), the picture softened away from the focus
  const glPasses = (cx, g) => {
    const { THREE, calm } = cx, { renderer, scene, camera, group } = g;
    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)), quadScene = new THREE.Scene(); quadScene.add(quad); quad.frustumCulled = false;
    const pass = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
    const mBright = pass(FRAG_BRIGHT, { tMap: { value: null }, uCut: { value: CUT } }), mBlur = pass(FRAG_BLUR, { tMap: { value: null }, uStep: { value: new THREE.Vector2() } });
    const mMix = pass(FRAG_MIX, { tMap: { value: null }, tGlow: { value: null }, tWide: { value: null }, tSoft: { value: null }, tDepth: { value: null }, uGlow: { value: 0.9 }, uFocus: { value: 0 }, uNear: { value: 0.5 }, uFar: { value: 80 }, uAt: { value: 10 }, uRange: { value: 4 } });
    const floatOk = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
    const target = (w, h, depth) => { const t = new THREE.WebGLRenderTarget(Math.max(2, w), Math.max(2, h), { type: floatOk ? THREE.HalfFloatType : THREE.UnsignedByteType, depthBuffer: !!depth }); if (depth) { t.depthTexture = new THREE.DepthTexture(Math.max(2, w), Math.max(2, h)); } return t; };
    g.freeTargets = () => { if (g.rt) { Object.values(g.rt).forEach((t) => { if (t.depthTexture) t.depthTexture.dispose(); t.dispose(); }); g.rt = null; } };
    const run = (mat, to) => { quad.material = mat; renderer.setRenderTarget(to); renderer.render(quadScene, quadCam); };
    const blur = (src, tmp, out) => { mBlur.uniforms.tMap.value = src.texture; mBlur.uniforms.uStep.value.set(1 / tmp.width, 0); run(mBlur, tmp); mBlur.uniforms.tMap.value = tmp.texture; mBlur.uniforms.uStep.value.set(0, 1 / out.height); run(mBlur, out); };
    g.makeTargets = (w, h, ratio) => { if (g.tier.bloom) { const W = Math.round(w * ratio), H = Math.round(h * ratio), h2 = [W >> 1, H >> 1], h4 = [W >> 2, H >> 2]; g.rt = { main: target(W, H, g.tier.focus), a: target(...h2), b: target(...h2), c: target(...h4), d: target(...h4) }; if (g.tier.focus) { g.rt.e = target(...h2); g.rt.f = target(...h2); } } };
    g.draw = (time) => {
      if (g.gone) return;
      const moving = !calm(), k = moving ? 1 + Math.sin(time / 420) * 0.08 : 1;
      g.rings.forEach((r, i) => { r.quaternion.copy(camera.quaternion).premultiply(group.quaternion.clone().invert()); r.scale.setScalar(moving ? 1 + Math.sin(time / 380 + i) * 0.1 : 1); });
      if (g.mainRing) g.mainRing.scale.setScalar(k);
      if (g.stars) g.stars.rotation.y = moving ? time / 60000 : 0;
      if (!g.tier.bloom || !g.rt) { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }
      renderer.setRenderTarget(g.rt.main); renderer.render(scene, camera);
      mBright.uniforms.tMap.value = g.rt.main.texture; run(mBright, g.rt.a); blur(g.rt.a, g.rt.b, g.rt.a); blur(g.rt.a, g.rt.c, g.rt.d); blur(g.rt.d, g.rt.c, g.rt.d);
      const u = mMix.uniforms; u.tMap.value = g.rt.main.texture; u.tGlow.value = g.rt.a.texture; u.tWide.value = g.rt.d.texture; u.uFocus.value = 0;
      if (g.tier.focus && g.rt.e) { mBright.uniforms.uCut.value = -1; run(mBright, g.rt.e); mBright.uniforms.uCut.value = CUT; blur(g.rt.e, g.rt.f, g.rt.e); u.tSoft.value = g.rt.e.texture; u.tDepth.value = g.rt.main.depthTexture; u.uFocus.value = 0.7; u.uNear.value = camera.near; u.uFar.value = camera.far; u.uAt.value = camera.position.z; u.uRange.value = HELIX.radius * 1.9; }
      run(mMix, null);
    };
  };

  // ---- WebGL, step 4: the pointer, the pinch and the wheel
  const glInput = (cx, g) => {
    const { THREE, win, doc, stage, showLabel, hideLabel } = cx, { canvas, camera, st } = g;
    g.turn = (dyaw, dpitch) => { st.yaw += dyaw; st.pitch = clamp(st.pitch + dpitch, -0.9, 0.9); g.held = win.performance.now() + 4000; g.still(); };
    g.zoom = (k) => { st.zoom = clamp(st.zoom * k, 0.35, 1.8); g.held = win.performance.now() + 1500; g.still(); };
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const pick = (ev) => {
      const b = canvas.getBoundingClientRect(); ndc.set(((ev.clientX - b.left) / b.width) * 2 - 1, -((ev.clientY - b.top) / b.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(g.spheres.filter((s) => s.part.visible).map((s) => s.ball), false)[0];
      if (hit) { cx.picked = hit.object.userData.index; showLabel(cx.view.nodes[cx.picked], ev.clientX - b.left, ev.clientY - b.top); } else hideLabel();
    };
    // drag: one pointer turns (across always; up and down too with a mouse or in full screen, where a finger need not
    // scroll the page); two pointers pinch
    const ptrs = new Map(); let pinch = 0, moved = false;
    const down = (ev) => { ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY }); moved = false; if (ptrs.size === 2) { const [p, q] = [...ptrs.values()]; pinch = Math.hypot(p.x - q.x, p.y - q.y); } try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* a pointer that is already gone */ } };
    const move = (ev) => {
      const p = ptrs.get(ev.pointerId);
      if (!p) { pick(ev); return; }
      const dx = ev.clientX - p.x, dy = ev.clientY - p.y; p.x = ev.clientX; p.y = ev.clientY;
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch > 0 && d > 0) g.zoom(pinch / d); pinch = d; moved = true; return; }
      if (Math.abs(dx) + Math.abs(dy) > 0) { moved = moved || Math.abs(dx) + Math.abs(dy) > 2; g.turn(dx * 0.008, ev.pointerType !== 'touch' || cx.isFull() ? dy * 0.006 : 0); hideLabel(); }
    };
    const up = (ev) => { const had = ptrs.delete(ev.pointerId); pinch = 0; if (had && !moved && ev.type === 'pointerup') pick(ev); };
    const wheel = (ev) => { if (!(ev.ctrlKey || cx.isFull() || doc.activeElement === stage)) return; ev.preventDefault(); g.zoom(Math.exp(clamp(ev.deltaY, -120, 120) * 0.0016)); };
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', (ev) => { if (!ptrs.has(ev.pointerId)) hideLabel(); });
    canvas.addEventListener('wheel', wheel, { passive: false });
  };

  // ---- WebGL: the steps together, the size, the tier the device can hold, the frame loop
  const glMode = (cx, pinned) => {
    const { THREE, win, doc, host, stage, calm, showLabel } = cx;
    const canvas = doc.createElement('canvas');
    if (!canvas.getContext('webgl2')) throw new Error('no WebGL');   // ask first: three.js logs an error of its own when there is none
    const g = glStage(cx, canvas, pinned), { renderer, camera, sun, group, st, place } = g;
    glNodes(cx, g); glPasses(cx, g);
    const size = () => {
      const w = stage.clientWidth || 600, h = stage.clientHeight || 400, ratio = Math.min(win.devicePixelRatio || 1, g.tier.ratio);
      st.w = w; st.h = h; renderer.setPixelRatio(ratio); renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      // the whole helix in the box: its height (with main's ring) or its width, whichever asks for more room
      const half = Math.tan(camera.fov * Math.PI / 360); st.fit = Math.max((HELIX.height / 2 + 1.5) / half, (HELIX.radius + 0.9) / (half * camera.aspect)) * 1.04;
      g.freeTargets();
      g.makeTargets(w, h, ratio);
      place(); g.draw(win.performance.now());
    };
    const setTier = (name) => { g.tierName = name; g.tier = TIERS[name]; host.dataset.tier = name; sun.castShadow = g.tier.shadows; g.makeStars(); size(); };

    let raf = 0, last = 0, onScreen = true, acc = 0, frames = 0, locked = !!pinned;
    const playing = () => !calm() && !doc.hidden && onScreen;
    const tick = (time) => {
      const dt = time - last; last = time;
      if (time > g.held) st.yaw += Math.min(0.05, dt / 1000) * 0.16;
      place(); g.draw(time);
      // the device says which tier it can hold: 45 frames' average, a pause (another tab) left out
      if (!locked && dt > 0 && dt < 250) { acc += dt; if (++frames >= FRAMES) { const next = nextTier(g.tierName, acc / frames); acc = 0; frames = 0; if (next === 'svg') { leave(); cx.impl = flatMode(cx); cx.impl.show(); cx.api.mode = 'svg'; return; } if (next !== g.tierName) setTier(next); } }
      raf = win.requestAnimationFrame(tick);
    };
    const play = () => { win.cancelAnimationFrame(raf); raf = 0; host.dataset.motion = calm() ? 'still' : 'live'; if (g.gone) return; if (playing()) { last = win.performance.now(); acc = 0; frames = 0; raf = win.requestAnimationFrame(tick); } else { place(); g.draw(win.performance.now()); } };
    g.still = () => { if (!raf) { place(); g.draw(win.performance.now()); } };
    glInput(cx, g);
    const ro = win.ResizeObserver ? new win.ResizeObserver(() => size()) : null; if (ro) ro.observe(stage);
    const io = win.IntersectionObserver ? new win.IntersectionObserver((es) => { onScreen = es.some((e) => e.isIntersecting); play(); }) : null; if (io) io.observe(host);
    doc.addEventListener('visibilitychange', play);
    const leave = () => { g.gone = true; win.cancelAnimationFrame(raf); raf = 0; if (ro) ro.disconnect(); if (io) io.disconnect(); doc.removeEventListener('visibilitychange', play); g.clear(); g.freeTargets(); renderer.dispose(); };
    const where = (i) => { const v = g.spheres[i].ball.getWorldPosition(new THREE.Vector3()).project(camera); return [(v.x + 1) / 2 * st.w, (1 - v.y) / 2 * st.h]; };

    g.build(); setTier(g.tierName); play();
    return {
      show: g.show, size, turn: g.turn, zoom: g.zoom, leave, reset: () => { st.yaw = 0.5; st.pitch = 0.12; st.zoom = 1; g.still(); },
      rebuild: () => { g.build(); g.show(); play(); },
      focusIndex: (i) => { place(); group.updateMatrixWorld(true); camera.updateMatrixWorld(true); const [x, y] = where(i); showLabel(cx.view.nodes[i], x, y); },
      lock: (name) => { locked = true; if (name !== g.tierName) setTier(name); },
      tier: () => g.tierName,
    };
  };

  const mount = (host, win, opts) => {
    const cx = makeFrame(host, win, opts);
    wireReplay(cx); wireFull(cx); wireKeys(cx);
    const startGl = (pinned) => { try { if (cx.THREE && typeof cx.THREE.WebGLRenderer === 'function') return glMode(cx, pinned); } catch (e) { /* no WebGL, or a failure on the way: the SVG helix */ } return null; };
    // a page (or a check on a slow machine) may name one tier on the element: data-tier="plain" draws that one and measures nothing
    cx.impl = startGl(TIERS[host.dataset.tier] ? host.dataset.tier : null) || flatMode(cx);
    cx.fullLook();
    cx.api = {
      mode: host.dataset.mode,
      set: (m) => { cx.model = m && Array.isArray(m.nodes) ? m : helixModel([], [], Date.now()); if (cx.picked >= cx.model.nodes.length) cx.picked = -1; cx.hideLabel(); cx.view = replayAt(cx.model, cx.at); if (cx.impl.rebuild) cx.impl.rebuild(); cx.paint(); },
      focus: (code) => { const i = cx.view.nodes.findIndex((n) => n.code === code && n.shown); if (i >= 0) { cx.picked = i; cx.impl.focusIndex(i); } },
      // tier(): the tier drawn now; tier(name): draw this one from here on and stop measuring (WebGL again where it was given up)
      tier: (name) => {
        if (name && TIERS[name]) { if (cx.impl.lock) cx.impl.lock(name); else { const g = startGl(name); if (g) { cx.impl = g; cx.api.mode = 'webgl'; cx.impl.rebuild(); } } }
        return host.dataset.tier;
      },
    };
    return cx.api;
  };

  return { COLOURS, HELIX, MAX_NODES, TIERS, turnsOf, nodeAt, nodeRadius, stateOf, helixModel, replayAt, counterText, nextTier, mount };
}));
