// S2-3 (20 Oct 2026, mcp/research/SEE-THE-RESULT.md "S2: the v1"): render_report, EXPERIMENTAL. The server registers it
// only when DATAARCUS_EXPERIMENTAL_RENDER=1 and loads this module only then: otherwise the tools, their count and the
// instructions are 0.3.0's. It waits for the owner's go (a new tool and a privacy page change; the draft is
// mcp/research/PRIVACY-render-draft.md) and the laptop's proof.
// What it does: reads the written report's own files and its model's definition (never data), makes the copy with
// made-up rows (lib/shadow-model.mjs renderProject), and lets Power BI Desktop draw it (lib/desktop-render.mjs). It writes
// nothing in the working folder; a fix the AI sees is proposed as a new plan, never written by this tool.
import path from 'node:path';
import { loadModel, shownName } from './model.mjs';
import { locate, strictFiles, readBytes, readJson, safeName, typeName } from './read-report.mjs';
import { renderProject, daxLiterals, MAGNITUDES } from './shadow-model.mjs';
import { render, helperCommand, RenderStop, scoreRender } from './desktop-render.mjs';
import { BY, CANT_TELL, DESCRIPTION, HOW_TO_LOOK, INSTEAD, LITERALS_ASK, MADE_UP, NOT_WINDOWS } from './render-text.mjs';

export const RENDER_TOOL = 'render_report';
export const renderOn = (env) => (env || process.env).DATAARCUS_EXPERIMENTAL_RENDER === '1';
const LIST_MAX = 60;

// (tests only, as DATAARCUS_TEST_WRITE_FAIL) a fake Desktop helper with the PowerShell helper's protocol, and short waits
const testHelper = () => { const v = process.env.DATAARCUS_TEST_RENDER_HELPER; if (!v) return null; try { const j = JSON.parse(v); return j && j.cmd ? j : null; } catch (e) { return null; } };

/** Registers render_report. deps: the server's own { safe, text, z, untrusted } (every answer leaves through text()). */
export function registerRender(server, deps) {
  const { safe, text, z, untrusted } = deps;
  server.registerTool(RENDER_TOOL, {
    title: 'See a report as Power BI Desktop draws it (experimental)',
    description: DESCRIPTION + (untrusted || ''),
    inputSchema: {
      path: z.string().describe('The written report: a .pbip file, a .Report folder, or a folder holding definition/, inside the working folder. Its model is the one its definition.pbir names'),
      pages: z.array(z.number().int().min(1).max(500)).min(1).max(20).optional().describe('Only these pages (1 is the first in the report\'s order; tooltip and hidden pages are not captured). Default: every page'),
      literals: z.enum(['stub', 'keep']).optional().describe('Only after the user chose, when the first call listed DAX constants: "stub" replaces each with a made-up one in the copy (the model is not changed), "keep" leaves them as they are'),
      magnitude: z.enum(MAGNITUDES).optional().describe('Only when the user said it ("sales are in millions"): the size of the made-up amounts that have no unit in their format string. Never guessed, never read from data')
    }, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, safe(async (a) => {
    const loc = locate(a.path, RENDER_TOOL), t = testHelper(), helper = t ? { cmd: t.cmd, args: t.args || [] } : helperCommand();
    if (!helper) return text({ rendered: false, why: NOT_WINDOWS, instead: INSTEAD, done: 'Nothing was opened or written.' });
    // the report's own files, read the reading block's way (links refused, capped), and the model it names
    const files = strictFiles(loc.reportDir, { files: 20000 }).map((rel) => ({ path: rel, data: readBytes(path.join(loc.reportDir, ...rel.split('/'))) }));
    let by = null;
    try { const pbir = readJson(path.join(loc.reportDir, 'definition.pbir')); by = pbir && pbir.datasetReference && pbir.datasetReference.byPath && pbir.datasetReference.byPath.path; } catch (e) { by = null; }
    if (!by) throw new Error('This report names no model folder (definition.pbir, datasetReference.byPath): render_report needs the model\'s definition to make its copy with made-up rows. Nothing was opened.');
    const m = loadModel(path.resolve(loc.reportDir, String(by)));
    // the model's DAX constants: the person decides before anything is drawn
    const lits = daxLiterals(m.tmsl);
    if (lits.length && !a.literals) {
      return text({ rendered: false, literals: { count: lits.length, items: lits.slice(0, LIST_MAX).map((x) => ({ table: shownName(x.table), name: shownName(x.name), kind: x.kind, numbers: x.numbers, texts: x.texts })), ...(lits.length > LIST_MAX ? { more: lits.length - LIST_MAX } : {}) },
        sayFirst: LITERALS_ASK, done: 'Nothing was opened or written.' });
    }
    const pj = renderProject(m.tmsl, files, { name: 'DataArcus render', literals: a.literals || 'keep', magnitude: a.magnitude, pages: a.pages });
    if (!pj.pages.length) throw new Error('This report has no page to capture (tooltip and hidden pages are not captured). Nothing was opened.');
    let r;
    try { r = await render(pj, { helper, timing: t && t.timing }); } catch (e) {
      if (e instanceof RenderStop) return text({ rendered: false, why: e.message, done: 'Nothing was written in the working folder; DataArcus closed the Desktop window it started, if any, and deleted its temporary copy.' });
      throw e;
    }
    const images = [];
    const pages = r.pages.map((p) => {
      const pg = pj.pages.find((x) => x.id === p.id) || { boxes: [] };
      const base = { n: p.n, name: safeName(p.name), boxes: pg.boxes.map((b) => ({ i: b.i, type: typeName(b.type), kind: b.kind, x: b.x, y: b.y, w: b.w, h: b.h })) };
      if (p.error) return Object.assign(base, { error: p.error });
      images.push(p.png);
      return Object.assign(base, { image: images.length - 1, settled: p.settled, seconds: p.seconds }, p.settled ? {} : { note: 'Not settled: two captures in a row never matched before the wait ended (an animation, or still loading): the image is the last capture.' });
    });
    const answer = text({ rendered: true, by: BY, madeUpData: MADE_UP, report: safeName(path.basename(loc.reportDir)), pages, cantTell: CANT_TELL, howToLook: HOW_TO_LOOK,
      literals: a.literals === 'stub' ? { replaced: lits.length } : { kept: lits.length }, ...(a.magnitude ? { magnitude: a.magnitude } : {}),
      copy: { notes: pj.notes, typesGuessed: pj.guessed.length }, seconds: { open: r.openSeconds, total: r.totalSeconds },
      learning: scoreRender(pj.pages[0], null), ...(r.notClosed ? { notClosed: r.notClosed } : {}), ...(r.leftBehind ? { leftBehind: r.leftBehind } : {}) });
    answer.content.push(...images.map((b) => ({ type: 'image', data: b.toString('base64'), mimeType: 'image/png' })));
    return answer;
  }));
}
