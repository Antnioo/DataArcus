// What a plan is pinned to: the model's key and print, the inputs, and the check right before a write that the model
// is still the one approved (lib/plans.mjs is the gate itself).
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import fs from 'node:fs';
import { inside } from './model.mjs';
import * as Plans from './plans.mjs';
import { testEditBeforeWrite } from './write-io.mjs';

// the model a plan is for: its folder's real path (a plan for one model never approves a write for another)
export const modelKey = (m, p) => { const f = m.folder || inside(p); try { return fs.realpathSync.native(f); } catch (e) { return f; } };
// (0.3, B-154) the model for the gate: its key and its fingerprint (loadModel's print), pinned by the plan, compared at the write
export const modelRef = (m, p) => ({ key: modelKey(m, p), print: m.print });
// (R6, F07) right before a writer's first write (before any folder is made): the model read again, and its print the
// approved one, or nothing is written (the gate's read can be seconds older than the write)
export const sameModelBeforeWrite = (planId, now, approved, report) => { testEditBeforeWrite(); if (now() !== approved) throw new Error(Plans.modelChanged(planId, report)); };
// the other writers pin every input they were proposed with (A6-5)
export const inputsPin = (a) => Object.fromEntries(Object.entries(a || {}).filter(([k]) => k !== 'planId'));
