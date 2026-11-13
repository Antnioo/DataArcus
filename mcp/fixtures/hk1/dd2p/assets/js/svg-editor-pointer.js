/*
 * DataArcus SVG KPI Designer: the canvas pointer, select, move (with snapping) and resize (0.3.2 SP33, moved from
 * svg-kpi-designer.js). Viewport transforms in, store commands and render requests out; the gesture is its only state.
 *   const p = SVGEditorPointer.attach({ stage, store, pos, r1, clone, view, on });
 *   in:  stage (the element whose pointerdown/move/up/cancel it listens to); store (SVGEditorStore: reads design and
 *        sel; commands select(i) and checkpoint()); pos (each layer type's position keys, POS); r1, clone (the
 *        designer's rounding and copy); view (the viewport transforms: hasCanvas(), zoom(), toDesign(event) -> design
 *        point, bboxOf(i) -> a layer's box in design units or null)
 *   out: on.picked() (the selection changed: redraw the layer list and the properties); on.canvas() (redraw the
 *        canvas); on.moved() (a drag changed the design: the DAX); on.dropped() (a drag that moved ended: the
 *        properties, then save); p.guides (the snapping guides to draw, [{ axis, at }]); p.dragging (a gesture is on)
 *   p.detach() removes every listener attach() added and drops the gesture (listener cleanup).
 * History grouping: one store.checkpoint() per drag, on its first move past 3 screen px; a click that does not move,
 * a right click and a cancelled press make no undo step. Snapping: the box edges and centre to the card and the
 * other layers, within 5 screen px; Alt turns it off.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  function attach(o) {
    const stage = o.stage, S = o.store, POS = o.pos, r1 = o.r1, clone = o.clone, view = o.view, on = o.on;
    let drag = null, guides = [];
    const down = (e) => {
      if (!view.hasCanvas() || e.button > 0) return;
      const p = view.toDesign(e), hEl = e.target.closest('[data-h]'), lEl = e.target.closest('[data-l]');
      if (hEl && S.sel >= 0) drag = { mode: 'resize', h: hEl.dataset.h, p0: p, l0: clone(S.design.layers[S.sel]), b0: view.bboxOf(S.sel), moved: false };
      else if (lEl) {
        const i = +lEl.dataset.l;
        if (i !== S.sel) { S.select(i); on.picked(); }
        drag = { mode: 'move', p0: p, l0: clone(S.design.layers[S.sel]), b0: view.bboxOf(S.sel), others: S.design.layers.map((_, j) => (j === S.sel ? null : view.bboxOf(j))).filter(Boolean), moved: false };
      } else { S.select(-1); on.picked(); on.canvas(); return; }
      stage.setPointerCapture(e.pointerId);
      on.canvas();
      e.preventDefault();
    };
    const move = (e) => {
      if (!drag) return;
      const zoom = view.zoom(), p = view.toDesign(e); let dx = p.x - drag.p0.x, dy = p.y - drag.p0.y;
      if (!drag.moved) { if (Math.hypot(dx, dy) * zoom < 3) return; S.checkpoint(); drag.moved = true; }
      const l = S.design.layers[S.sel], l0 = drag.l0, bd = l0.bind || {};
      guides = [];
      if (drag.mode === 'move') {
        // snap the box edges and centre to the card and to other layers (hold Alt to turn off)
        if (!e.altKey && drag.b0) {
          const thr = 5 / zoom, b = drag.b0;
          const tx = [0, S.design.w / 2, S.design.w], ty = [0, S.design.h / 2, S.design.h];
          drag.others.forEach((ob) => { tx.push(ob.x, ob.x + ob.width / 2, ob.x + ob.width); ty.push(ob.y, ob.y + ob.height / 2, ob.y + ob.height); });
          const best = (start, size, targets, d) => { let bestD = null; [0, size / 2, size].forEach((off) => targets.forEach((t) => { const diff = t - (start + d + off); if (Math.abs(diff) < thr && (bestD == null || Math.abs(diff) < Math.abs(bestD.diff))) bestD = { diff: diff, at: t }; })); return bestD; };
          const sx = best(b.x, b.width, tx, dx), sy = best(b.y, b.height, ty, dy);
          if (sx) { dx += sx.diff; guides.push({ axis: 'x', at: sx.at }); }
          if (sy) { dy += sy.diff; guides.push({ axis: 'y', at: sy.at }); }
        }
        POS[l.type].forEach(([kx, ky]) => { if (!bd[kx]) l[kx] = r1(l0[kx] + dx); if (!bd[ky]) l[ky] = r1(l0[ky] + dy); });
      } else {
        const h = drag.h;
        if (h === 'se' || h === 'e') l.w = Math.max(1, r1(p.x - l0.x));
        if (h === 'se' || h === 's') l.h = Math.max(1, r1(p.y - l0.y));
        if (h === 'r') l.r = Math.max(1, r1(Math.hypot(p.x - l0.cx, p.y - l0.cy)));
        if (h === 'p1') { l.x1 = r1(p.x); l.y1 = r1(p.y); }
        if (h === 'p2') { l.x2 = r1(p.x); l.y2 = r1(p.y); }
        if (h === 'size') l.size = Math.max(4, r1(Math.max(p.x - l0.x, p.y - l0.y)));
        if (h === 'fs' && drag.b0) l.size = Math.max(4, Math.min(200, r1(l0.size * (p.y - drag.b0.y) / drag.b0.height)));
      }
      on.canvas(); on.moved();
    };
    const end = () => { if (!drag) return; const moved = drag.moved; drag = null; guides = []; if (moved) on.dropped(); on.canvas(); };
    const L = [['pointerdown', down], ['pointermove', move], ['pointerup', end], ['pointercancel', end]];
    L.forEach(([k, fn]) => stage.addEventListener(k, fn));
    return Object.freeze({
      get guides() { return guides; },
      get dragging() { return !!drag; },
      detach() { L.forEach(([k, fn]) => stage.removeEventListener(k, fn)); drag = null; guides = []; }
    });
  }
  root.SVGEditorPointer = Object.freeze({ attach: attach });
})(typeof window !== 'undefined' ? window : globalThis);
