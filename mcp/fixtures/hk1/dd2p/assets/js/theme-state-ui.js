/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The Theme Generator's saved design (0.3.2 SP31, the split of theme-generator.js: the Codex split map, B-280): the
// design read back from the browser's storage and repaired (an old or hand-edited save may be partial: each value that
// is not valid falls back to its default, the design engine's repairState), the first visit's look, and the page's
// other saved keys (the folded steps, the design kept before "See an example").
//
// Interface (one input, one output, no state but the design it holds):
//   In:  createStore({ storage, engine, key })
//        storage  a localStorage-like object (getItem, setItem, removeItem) or null; any call may throw (a private
//                 window, storage turned off): a read then gives null and a write is skipped
//        engine   the design engine (DAEngine): repairState(saved), DEFAULT_LOOK
//        key      the design's key (default 'dataarcus-theme-generator'); the other keys are key + a suffix
//   Out: { key, firstVisit, get, update, replace, subscribe, save, keep }
//        get()          the design (the live object the page reads and changes)
//        update(fn)     fn(design) changes it in place, or returns a new design to take its place; subscribers told
//        replace(next)  the design becomes next (the example, Undo); subscribers told
//        subscribe(fn)  fn(design) after each update or replace; returns the function that unsubscribes
//        save()         writes the design to its key (nothing is written before save is called)
//        keep(suffix)   { get(), set(text), remove() } for the key + suffix ('-folded', '-before')
//        firstVisit     true when nothing usable was saved: the design then opens on the engine's DEFAULT_LOOK
//                       (0.3.1 GD1, the owner, 27 Oct: "i want to make the glassy dashboard default"); a saved design
//                       keeps its own look (one saved without a look: plain, as it was made)
// It reads no page, draws nothing and loads nothing.
(function (root) {
  'use strict';
  const KEY = 'dataarcus-theme-generator';

  function createStore({ storage, engine, key }) {
    const E = engine, at = key || KEY;
    const read = (k) => { try { return storage ? storage.getItem(k) : null; } catch (e) { return null; } };
    const write = (k, v) => { try { if (storage) storage.setItem(k, v); } catch (e) { /* private mode */ } };
    const drop = (k) => { try { if (storage) storage.removeItem(k); } catch (e) { /* private mode */ } };
    // the migration: whatever was saved, repaired; nothing usable is a first visit
    let state;
    try { state = JSON.parse(read(at)); } catch (e) { state = null; }
    const firstVisit = !state || typeof state !== 'object';
    state = E.repairState(state);
    if (firstVisit) state.chart = Object.assign({}, state.chart, { look: E.DEFAULT_LOOK });
    const subs = [];
    const tell = () => subs.slice().forEach((fn) => fn(state));
    return {
      key: at, firstVisit,
      get: () => state,
      update(fn) { const r = fn(state); if (r !== undefined && r !== state) state = r; tell(); return state; },
      replace(next) { state = next; tell(); return state; },
      subscribe(fn) { subs.push(fn); return () => { const i = subs.indexOf(fn); if (i >= 0) subs.splice(i, 1); }; },
      save: () => write(at, JSON.stringify(state)),
      keep: (suffix) => ({ get: () => read(at + suffix), set: (v) => write(at + suffix, v), remove: () => drop(at + suffix) }),
    };
  }

  const api = { KEY, createStore };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAThemeState = api;
})(typeof self !== 'undefined' ? self : this);
