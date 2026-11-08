/*
 * DataArcus live build page: the DNA helix (0.3.2 BF1). The data IS the helix: one strand is the integration branch (its
 * merges of the last 24 h as nodes along it), the other strand the builder branches; each rung is one job branch, newest at
 * the top, coloured by its state. Drawn with three.js (a classic script, global THREE, pinned on the page) and, where
 * WebGL is not there, as a still SVG helix, so the page works either way. The canvas is decorative (aria-hidden): the cards
 * below hold the same data. Every text shown comes from GitHub and is set with textContent.
 *
 * Interface (the pure part runs in Node too):
 *   COLOURS                   state -> hex colour: running amber, red coral, green teal, stopped violet, idle blue
 *   MAX_RUNGS                 60: the most rungs drawn
 *   helixModel(items, merges) items: [{ code, status, message, ci, time, note?, costText? }] newest first (status as build-page.js statusOf);
 *                             merges: [{ message, time }] -> { rungs: [{ ...item, t }], nodes: [{ message, t }] }, t = 0 (top) .. 1, the rungs spread evenly inside it
 *   mount(host, win)          host: the element to draw in; -> { mode: 'webgl' | 'svg', set(model), focus(code) }.
 *                             Rotation only when motion is allowed, the tab shows and the helix is on screen; reduced
 *                             motion: drawn once, still. host.dataset.mode and .motion say which.
 * (c) DataArcus. All rights reserved.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BuildHelix = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const COLOURS = Object.freeze({ running: '#ffb02e', red: '#ff6b6b', green: '#2dd4bf', stopped: '#9a8cc9', idle: '#7aa2ff' });
  const MAX_RUNGS = 60, MAX_NODES = 24, H = 7, R = 1.45;

  const helixModel = (items, merges) => {
    const list = (Array.isArray(items) ? items : []).slice(0, MAX_RUNGS), m = (Array.isArray(merges) ? merges : []).slice(0, MAX_NODES);
    return {
      rungs: list.map((it, i) => ({ ...it, t: (i + 0.5) / list.length })),
      nodes: m.map((n, i) => ({ message: String(n.message || ''), t: (i + 0.5) / m.length })),
    };
  };
  const turnsOf = (n) => Math.max(1.5, Math.min(8, n / 6));
  const labelText = (r) => [r.code, r.message || '(no message)', 'CI: ' + (r.ci || 'no run') + (r.note ? ' | note: ' + r.note : '') + (r.costText ? ' | cost ' + r.costText : '')];

  const mount = (host, win) => {
    const doc = win.document, THREE = win.THREE;
    const calm = () => !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const label = doc.createElement('div'); label.className = 'bh-label'; label.hidden = true;
    const showLabel = (r, x, y) => {
      label.replaceChildren(...labelText(r).map((t, i) => { const d = doc.createElement('div'); d.className = i === 0 ? 'bh-l0' : 'bh-l'; d.textContent = t; return d; }));
      label.hidden = false;
      const w = host.clientWidth || 300;
      label.style.left = Math.max(8, Math.min(w - label.offsetWidth - 8, x - label.offsetWidth / 2)) + 'px';
      label.style.top = Math.max(8, y - label.offsetHeight - 14) + 'px';
    };
    const hideLabel = () => { label.hidden = true; };
    let model = helixModel([], []), gl = null;

    // WebGL where the browser has it and the script loaded; no WebGL, or a failure on the way: the SVG helix
    if (THREE && typeof THREE.WebGLRenderer === 'function') {
      try {
        const canvas = doc.createElement('canvas');
        // ask first: three.js logs an error of its own when there is no WebGL
        if (!canvas.getContext('webgl2')) throw new Error('no WebGL');
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(win.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);
        gl = { canvas, renderer };
      } catch (e) { gl = null; }
    }

    // ---- WebGL
    if (gl) {
      const { canvas, renderer } = gl;
      canvas.className = 'bh-canvas'; host.replaceChildren(canvas, label);
      host.dataset.mode = 'webgl';
      const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x070d1f, 8, 15);
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50); camera.position.set(0, 0, 10.5);
      scene.add(new THREE.AmbientLight(0x8fa8ff, 0.7));
      const key = new THREE.PointLight(0xffffff, 1.2, 40); key.position.set(4, 5, 9); scene.add(key);
      const group = new THREE.Group(); group.rotation.z = 0.2; scene.add(group);
      const glowTex = (() => { const c = doc.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
      let live = null, pulses = [], flows = [], raf = 0, last = 0, onScreen = true;
      const at = (t, phase, turns) => { const a = t * turns * 6.2832 + phase; return new THREE.Vector3(R * Math.cos(a), H / 2 - t * H, R * Math.sin(a)); };
      const clear = () => { if (!live) return; group.remove(live); live.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); live = null; };
      const glowMat = (col) => new THREE.SpriteMaterial({ map: glowTex, color: col, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
      const build = () => {
        clear(); pulses = []; flows = [];
        live = new THREE.Group(); group.add(live);
        const turns = turnsOf(model.rungs.length), pts = (phase) => Array.from({ length: 160 }, (_, i) => at(i / 159, phase, turns));
        [[0, 0x5b8cff], [Math.PI, 0xa78bfa]].forEach(([phase, col]) => {
          const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts(phase)), 320, 0.055, 8, false), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.55, roughness: 0.35 }));
          live.add(tube);
        });
        model.nodes.forEach((n) => {
          const col = new THREE.Color(COLOURS.green), s = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1 }));
          s.position.copy(at(n.t, 0, turns)); live.add(s);
          const g = new THREE.Sprite(glowMat(col)); g.scale.set(0.7, 0.7, 1); g.position.copy(s.position); live.add(g);
        });
        const hits = [];
        model.rungs.forEach((r, i) => {
          const A = at(r.t, 0, turns), B = at(r.t, Math.PI, turns), mid = A.clone().add(B).multiplyScalar(0.5), dir = B.clone().sub(A), len = dir.length();
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
          const col = new THREE.Color(COLOURS[r.status] || COLOURS.idle), run = r.status === 'running';
          const rung = new THREE.Mesh(new THREE.CylinderGeometry(run ? 0.06 : 0.04, run ? 0.06 : 0.04, len, 8), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: run ? 1.3 : 0.75, roughness: 0.4 }));
          rung.position.copy(mid); rung.quaternion.copy(q); live.add(rung);
          const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, len, 6), new THREE.MeshBasicMaterial({ visible: false }));
          hit.position.copy(mid); hit.quaternion.copy(q); hit.userData.index = i; live.add(hit); hits.push(hit);
          for (const P of [A, B]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1 })); e.position.copy(P); live.add(e); }
          if (run) {
            const g = new THREE.Sprite(glowMat(col)); g.scale.set(1.6, 1.6, 1); g.position.copy(mid); live.add(g); pulses.push(g);
            const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3));
            const pts3 = new THREE.Points(geo, new THREE.PointsMaterial({ color: col, size: 0.09, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
            live.add(pts3); flows.push({ geo, A, B, i });
          }
        });
        live.userData.hits = hits;
      };
      const size = () => { const w = host.clientWidth || 600, h = host.clientHeight || 400; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
      const draw = (time) => {
        pulses.forEach((p, i) => { const k = 1.5 + Math.sin(time / 350 + i) * 0.25; p.scale.set(k, k, 1); });
        flows.forEach((f) => { const a = f.geo.attributes.position; for (let k = 0; k < 6; k++) { const u = ((time / 1800) + k / 6) % 1; a.setXYZ(k, f.A.x + (f.B.x - f.A.x) * u, f.A.y + (f.B.y - f.A.y) * u, f.A.z + (f.B.z - f.A.z) * u); } a.needsUpdate = true; });
        renderer.render(scene, camera);
      };
      const playing = () => !calm() && !doc.hidden && onScreen;
      const tick = (time) => { group.rotation.y += Math.min(0.05, (time - last) / 1000) * 0.18; last = time; draw(time); raf = win.requestAnimationFrame(tick); };
      const play = () => { win.cancelAnimationFrame(raf); raf = 0; host.dataset.motion = calm() ? 'still' : 'live'; if (playing()) { last = win.performance.now(); raf = win.requestAnimationFrame(tick); } else draw(win.performance.now()); };
      const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
      const pick = (ev) => {
        if (!live) return;
        const b = canvas.getBoundingClientRect(); ndc.set(((ev.clientX - b.left) / b.width) * 2 - 1, -((ev.clientY - b.top) / b.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const hit = ray.intersectObjects(live.userData.hits, false)[0];
        if (hit) showLabel(model.rungs[hit.object.userData.index], ev.clientX - b.left, ev.clientY - b.top); else hideLabel();
      };
      canvas.addEventListener('pointermove', pick); canvas.addEventListener('pointerdown', pick); canvas.addEventListener('pointerleave', hideLabel);
      if (win.ResizeObserver) new win.ResizeObserver(() => { size(); if (!raf) draw(win.performance.now()); }).observe(host);
      if (win.IntersectionObserver) new win.IntersectionObserver((es) => { onScreen = es.some((e) => e.isIntersecting); play(); }).observe(host);
      doc.addEventListener('visibilitychange', play);
      size();
      return {
        mode: 'webgl',
        set: (m) => { model = m; build(); size(); play(); },
        focus: (code) => {
          const i = model.rungs.findIndex((r) => r.code === code); if (i < 0 || !live) return;
          const hit = live.userData.hits[i], v = new THREE.Vector3(); hit.getWorldPosition(v); v.project(camera);
          showLabel(model.rungs[i], (v.x + 1) / 2 * host.clientWidth, (1 - v.y) / 2 * host.clientHeight);
        },
      };
    }

    // ---- no WebGL: a still SVG helix, drawn once per data
    host.dataset.mode = 'svg'; host.dataset.motion = 'still';
    const NS = 'http://www.w3.org/2000/svg', svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 440'); svg.setAttribute('class', 'bh-svg'); svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    host.replaceChildren(svg, label);
    const mk = (tag, attrs) => { const e = doc.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
    const draw2d = () => {
      svg.replaceChildren();
      const turns = turnsOf(model.rungs.length), X = (t, ph) => 200 + 120 * Math.cos(t * turns * 6.2832 + ph), Y = (t) => 30 + t * 380;
      for (const [ph, col] of [[0, '#5b8cff'], [Math.PI, '#a78bfa']]) {
        let d = ''; for (let i = 0; i <= 160; i++) d += (i ? 'L' : 'M') + X(i / 160, ph).toFixed(1) + ' ' + Y(i / 160).toFixed(1);
        svg.append(mk('path', { d, fill: 'none', stroke: col, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.85 }));
      }
      for (const n of model.nodes) svg.append(mk('circle', { cx: X(n.t, 0), cy: Y(n.t), r: 6, fill: COLOURS.green }));
      model.rungs.forEach((r) => {
        const col = COLOURS[r.status] || COLOURS.idle, g = mk('g', { 'data-code': r.code, tabindex: '-1' });
        g.append(mk('line', { x1: X(r.t, 0), y1: Y(r.t), x2: X(r.t, Math.PI), y2: Y(r.t), stroke: col, 'stroke-width': r.status === 'running' ? 6 : 3.5, 'stroke-linecap': 'round' }),
          mk('line', { x1: X(r.t, 0), y1: Y(r.t), x2: X(r.t, Math.PI), y2: Y(r.t), stroke: 'transparent', 'stroke-width': 18 }));
        const t = doc.createElementNS(NS, 'title'); t.textContent = labelText(r).join(' - '); g.append(t);
        g.addEventListener('pointerenter', (ev) => { const b = host.getBoundingClientRect(); showLabel(r, ev.clientX - b.left, ev.clientY - b.top); });
        g.addEventListener('pointerdown', (ev) => { const b = host.getBoundingClientRect(); showLabel(r, ev.clientX - b.left, ev.clientY - b.top); });
        g.addEventListener('pointerleave', hideLabel);
        svg.append(g);
      });
    };
    return {
      mode: 'svg',
      set: (m) => { model = m; draw2d(); },
      focus: (code) => { const r = model.rungs.find((x) => x.code === code); if (r) showLabel(r, host.clientWidth / 2, host.clientHeight / 2); },
    };
  };

  return { COLOURS, MAX_RUNGS, helixModel, mount };
}));
