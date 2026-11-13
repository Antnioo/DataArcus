/*
 * DataArcus SVG KPI Designer: the editor's state and its history (0.3.2 SP25, moved from svg-kpi-designer.js).
 * Commands in, state and change events out: no DOM, no listeners, no canvas, no storage.
 *   const S = SVGEditorStore.create({ limit: 100 });
 *   state out (read only): S.design (the live design), S.sel (the selected layer, -1 = the card), S.canUndo, S.canRedo
 *   commands in: S.load(d) and S.select(i) (no history); S.apply(fn) (one undo step, then fn(design) changes it);
 *     S.checkpoint() (one undo step for the change that follows, such as a drag's first move); S.replace(d) (one undo
 *     step: the design becomes d, nothing selected); S.editOnce() (a field edit: one step per field visit, however
 *     many keys); S.newField() (a new field visit begins); S.undo(), S.redo() (true when the design changed)
 *   events out: S.on('history', fn) after an undo step is pushed; S.on('restore', fn) after undo or redo replaced the design
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  function create(opts) {
    const limit = (opts && opts.limit) || 100;
    let design = null, sel = -1, armed = true;
    const undoStack = [], redoStack = [], subs = { history: [], restore: [] };
    const emit = (kind) => subs[kind].forEach((fn) => fn());
    const snap = () => JSON.stringify(design);
    const checkpoint = () => { undoStack.push(snap()); if (undoStack.length > limit) undoStack.shift(); redoStack.length = 0; emit('history'); };
    const restore = (s) => { design = JSON.parse(s); if (sel >= design.layers.length) sel = design.layers.length - 1; emit('restore'); };
    return Object.freeze({
      get design() { return design; },
      get sel() { return sel; },
      get canUndo() { return undoStack.length > 0; },
      get canRedo() { return redoStack.length > 0; },
      load(d) { design = d; },
      select(i) { sel = i; },
      checkpoint: checkpoint,
      apply(fn) { checkpoint(); fn(design); },
      replace(d) { checkpoint(); design = d; sel = -1; },
      editOnce() { if (armed) { checkpoint(); armed = false; } },
      newField() { armed = true; },
      undo() { if (!undoStack.length) return false; redoStack.push(snap()); restore(undoStack.pop()); return true; },
      redo() { if (!redoStack.length) return false; undoStack.push(snap()); restore(redoStack.pop()); return true; },
      on(kind, fn) { if (subs[kind]) subs[kind].push(fn); }
    });
  }
  root.SVGEditorStore = Object.freeze({ create: create });
})(typeof window !== 'undefined' ? window : globalThis);
