// Lint for bugs, not style (Q1, 0.3.1; the owner 25 Oct after an outside review: "linting and static checks for the
// core JavaScript"). `npm run lint` at the repo root; CI runs it in website-checks. Only rules that find a bug are on,
// all as errors; no formatting rule, no Prettier. Every exception below says why (mcp/work/Q1.md lists them all).
import fs from 'node:fs';
import globals from 'globals';

const BUGS = {
  'no-undef': 'error',
  'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true }],
  'no-unreachable': 'error',
  'no-dupe-keys': 'error',
  'no-dupe-else-if': 'error',
  'no-self-assign': 'error',
  'no-self-compare': 'error',
  'no-unsafe-finally': 'error',
  'no-unsafe-negation': 'error',
  'no-cond-assign': 'error',
  'no-constant-condition': ['error', { checkLoops: false }],
  'no-fallthrough': 'error',
  'no-sparse-arrays': 'error',
  'use-isnan': 'error',
  'valid-typeof': 'error',
  'no-redeclare': 'error',
  'no-shadow-restricted-names': 'error',
  'no-loss-of-precision': 'error',
  'no-async-promise-executor': 'error',
  'require-yield': 'error',
  'getter-return': 'error',
  'no-import-assign': 'error',
  'no-unused-private-class-members': 'error',
};

// The engines that run in the browser and in Node (UMD: they assign module.exports when there is one), found from the
// files themselves, so a new engine needs no edit here.
const ENGINE_DIR = new URL('./assets/js/', import.meta.url);
const UMD = fs.readdirSync(ENGINE_DIR)
  .filter((f) => f.endsWith('.js') && !f.endsWith('.min.js'))
  .filter((f) => /\bmodule\.exports\b/.test(fs.readFileSync(new URL(f, ENGINE_DIR), 'utf8')))
  .map((f) => `assets/js/${f}`);

export default [
  {
    ignores: ['**/node_modules/**', 'mcp/schemas/**', 'mcp/fixtures/**', 'assets/js/*.min.js', 'assets/js/translations/**'],
  },
  {
    files: ['mcp/**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node } },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: BUGS,
  },
  {
    files: ['assets/js/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'script', globals: { ...globals.browser } },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: BUGS,
  },
  {
    files: UMD,
    languageOptions: { globals: { module: 'readonly', require: 'readonly' } },
  },
  // the libraries every page loads from jsDelivr before main.js (package.json pins them; scripts/cdn.mjs writes the tags)
  {
    files: ['assets/js/main.js'],
    languageOptions: { globals: { AOS: 'readonly', bootstrap: 'readonly' } },
  },
  // the model health check's Web Worker (importScripts, self)
  {
    files: ['assets/js/model-health-worker.js'],
    languageOptions: { globals: { ...globals.worker } },
  },
];
