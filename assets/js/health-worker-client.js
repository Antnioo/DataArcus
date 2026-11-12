/*
 * DataArcus Power BI Model Health Check: the worker's lifecycle (0.3.2 SP32, the split of model-health.js: the Codex
 * split map, B-280). The file is analysed in a Web Worker; this module starts it, keeps it and stops it. Interface:
 *   MHWorkerClient.create({ Worker }) -> client     starts one worker now (the page calls it when it loads)
 *   client.run(buffer, fileName, onMessage)         the file's bytes (an ArrayBuffer, transferred) and its name in;
 *                                                   onMessage gets, in order, typed messages only:
 *     { type: 'progress', step }                    step: 'model', 'report' or 'analyze'
 *     { type: 'result', result }                    the analysis, metadata only (names, DAX; never data values),
 *                                                   with result.meta set by the worker
 *     { type: 'error', code, message }              code: the worker's (PBIX, NO_MODEL, NOT_ZIP, ZIP_LIMIT, PARSE...),
 *                                                   'WORKER' (the browser blocked it) or 'PARSE' (the worker failed)
 *   client.cancel()                                 stops a run still going (its worker is terminated)
 * Lifecycle: the worker is started when the page loads (0.3.1 FX1: a visitor who then goes offline still gets a score)
 * and kept between runs (it holds nothing between messages). A run still going when another file comes is cancelled:
 * its worker is terminated, so its answer never arrives, and a new worker runs the new file. A worker that fails is
 * not kept. `Worker` is the constructor to use (the browser's when left out; a fake in tests). No analytics, no DOM,
 * no storage: the page decides what to show and what to count. Nothing is sent anywhere.
 * Loaded before model-health.js on the tool pages; in Node, require it. (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  // the worker's ?v= stamp: one place in the page's code (theme-generator.js starts the same worker with the same stamp)
  const WORKER_URL = '/assets/js/model-health-worker.min.js?v=adf8575970cb';

  function create(opts) {
    const W = (opts && opts.Worker) || root.Worker;
    let worker = null, ready = null, busy = false;
    const warm = () => { try { ready = new W(WORKER_URL); ready.onerror = () => { ready = null; }; } catch (e) { ready = null; } };
    warm();
    function cancel() {
      if (worker && busy) { worker.terminate(); worker = null; }
      busy = false;
    }
    function run(buffer, fileName, onMessage) {
      cancel();
      if (!worker) { if (!ready) warm(); worker = ready; ready = null; }
      if (!worker) return onMessage({ type: 'error', code: 'WORKER' });
      busy = true;
      // (the worker is kept, not stopped, when it is done: the next file runs on it, also offline)
      worker.onmessage = (ev) => {
        const d = ev.data;
        if (d.type === 'progress') onMessage({ type: 'progress', step: d.step });
        else if (d.type === 'error') { busy = false; onMessage({ type: 'error', code: d.code, message: d.message }); }
        else if (d.type === 'done') { busy = false; onMessage({ type: 'result', result: d.result }); }
      };
      // (a worker that fails is not kept)
      worker.onerror = () => { busy = false; if (worker) worker.terminate(); worker = null; onMessage({ type: 'error', code: 'PARSE' }); };
      worker.postMessage({ buffer, fileName }, [buffer]);
    }
    return { run, cancel };
  }

  const api = { create };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MHWorkerClient = api;
})(typeof self !== 'undefined' ? self : this);
