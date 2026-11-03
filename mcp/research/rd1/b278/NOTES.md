# B-278: the app's own approval prompt (MCP elicitation) and the browser page

Research only (rd/0.3.2-ideas, 3 Nov). Nothing here is shipped. Made-up data only.

## (a) What the code does today

The app's prompt is already built and preferred; the browser page is already the fallback. B-278's real gaps are the
words and the cases where an app declares elicitation but no person answers.

- `mcp/tools/approve_plan.mjs:28-29`: reads `getClientCapabilities()`; takes the app's prompt when the app declares
  `elicitation` with `form` (or bare `{}`), otherwise the browser page.
- `approve_plan.mjs:34-37`: `elicitInput({ mode: 'form', message: promptText, requestedSchema: { approve: boolean,
  default false } }, { timeout: 10 min })`.
- `approve_plan.mjs:38`: any error or timeout throws "Not approved ... Ask the user to try again". **There is no fallback
  to the browser page.**
- `approve_plan.mjs:41-43`: `cancel` leaves the plan open; `decline` or an unticked box refuses it for good (rc.23, F7b).
- `approve_plan.mjs:44`: `Plans.approve(id, 'user-in-app')`. `lib/plans.mjs:66-77` accepts `user-in-browser` or
  `user-in-app`, nothing else.
- `approve_plan.mjs:47-55`: the browser page: `Approval.open` then waits 45 s (`APPROVAL_WAIT`, line 12), else `waiting`.
- `lib/approval-window.mjs:5-9`: what the page guards (127.0.0.1, one-time secret never given to the assistant, Host and
  Origin checks) and what it can't ("another program ... that controls their browser or mouse ... could click it too").
- `approval-window.mjs:323-345` (Host 421, Origin / Sec-Fetch-Site 403, one decision), `:359-373` (24-byte secret, launch).
- `approval-window.mjs:111-160`: `promptText` / `promptBox`, the prompt's short form of the page (B-183, R4A).
- Tests already cover the prompt path: `mcp/test-audit6.mjs:19-20` (`elicitClient`, `elicitation: {}`), `:44-77`;
  `test-rc23.mjs:129`; `test-0.3.0-sweep-s1.mjs:103`; `test-0.3.1-sq1.mjs:104`; `test-0.3.1-aud047.mjs:149`.
  `test-audit6.mjs:77` checks README and PRIVACY name the window, `user-in-browser` and elicitation.

Current public words (to change in (e)):
- `mcp/PRIVACY.md:259-262` (A6-3), `:14-16`, `:38-41`, `:67`; `mcp/README.md:64-68`; `mcp/TOOLS.md:58`.
- Site: `power-bi-mcp/index.html:179` and `ar/power-bi-mcp/index.html:179` (`beta.tools.approve_plan`),
  `:169` (`beta.how.s3`); their source `assets/js/translations/beta-page.js:73` (EN), `:188` (AR), `:64`/`:179` (s3).
  `privacy.html` has no approval text.

## (b) What the spec and the SDK document

Spec 2025-11-25, [client/elicitation](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation)
(read 3 Nov 2026): form mode (flat schema, boolean/enum allowed) and URL mode (new in 2025-11-25). Bare
`elicitation: {}` means form only. Clients MUST show which server asks and give decline and cancel. Actions: `accept`,
`decline`, `cancel`. URL mode: the client MUST show the full URL and get consent, MUST NOT let the client or LLM inspect
the page; servers SHOULD use HTTPS outside development and MUST NOT send a pre-authenticated URL. Nothing in the spec
says or can say that the answer came from a person and not from software driving the app.
The current revision is [2026-07-28](https://modelcontextprotocol.io/specification/versioning); its
[deprecated registry](https://modelcontextprotocol.io/specification/2026-07-28/deprecated) deprecates roots, sampling and
logging, not elicitation. The pinned SDK speaks 2025-11-25 (`LATEST_PROTOCOL_VERSION`, `dist/esm/types.js:2`).

SDK 1.32.2, `mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/`:
- `server/index.js:274` `getClientCapabilities()`; `:340-372` `elicitInput` (url needs `elicitation.url`, form needs
  `elicitation.form`, else a plain `Error`; validates an accepted form's content, `McpError -32602` on mismatch);
  `:383` `createElicitationCompletionNotifier`; `:147-149` capability check on raw `elicitation/create`.
- `types.js:332-345` capability schema (`{}` becomes `{ form: {} }`); `:1731` form params; `:1755` URL params; `:1783`
  `ElicitRequestSchema`; `:1810` `ElicitResultSchema`; `:2055` `UrlElicitationRequiredError` (-32042).
- `client/index.js:60` `getSupportedElicitationModes`; `:180-220` client-side checks; `inMemory.js:11` `createLinkedPair`.
- `shared/protocol.js:8` default request timeout 60 s (approve_plan passes 10 min).

Which apps support it (sources read 3 Nov 2026; "unknown" where not verified):

| App | Elicitation | Source |
|---|---|---|
| Claude Desktop, chat | none declared to local servers (owner's rc.16 test, Oct); no Anthropic statement | `approval-window.mjs:1-4`; [#41110](https://github.com/anthropics/claude-code/issues/41110) closed by author, no reply |
| Claude Desktop, Code tab / Cowork | Code tab's local client declares none; embedded Claude Code reported to declare it but never show it (hangs) or auto-decline | [#96043](https://github.com/anthropics/claude-code/issues/96043) open, 22 Sep 2026, Desktop 2.2553.x; links #88901, #94450, #89858 |
| Claude Code CLI | form and URL (`{form:{},url:{}}` from v2.1.287 on local servers; bare `{}` elsewhere); interactive sessions only; an `Elicitation` hook can answer without a dialog | [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp#respond-to-mcp-elicitation-requests) |
| VS Code (Copilot) | form since 1.102 (Jun 2025), URL mode 1.107 (Nov 2025), forms redone 1.112 | [v1_102](https://code.visualstudio.com/updates/v1_102), [v1_107](https://code.visualstudio.com/updates/v1_107), [v1_112](https://code.visualstudio.com/updates/v1_112) |
| Cursor | "Supported" in its protocol table; modes and date unknown | [cursor.com/docs/context/mcp](https://cursor.com/docs/context/mcp) |
| Others (Zed, Cline, Windsurf) | unknown | not verified |

## (c) Ways to build it

**A. Keep the prompt preferred; make the fallback real (size M, risk medium).** When the app declares form mode, ask
there; on a timeout, a transport error or `-32601`, open the browser page in the same call (as today's no-elicitation
path), never approving anything by itself. Shorten the prompt's wait from 10 min to something under the apps' tool-call
limit. Add a setting (e.g. `DATAARCUS_APPROVAL=browser`) for apps that declare elicitation but show nothing. Changes
`approve_plan.mjs` only, plus tests. Risk: an auto-decline (#96043/#89858) looks the same as a person's "No" and
refuses the plan; that is an owner's decision (below).

**B. URL-mode elicitation pointing at the same local page (size M, risk medium-high).** For apps that declare `url`,
send `{ mode: 'url', url: http://127.0.0.1:<port>/approve/<secret> }`; the app asks "open this link?", then the page.
Changes: the secret now passes through the app (its logs, transcripts; Claude Code hands it to the system's URL
handler), where today it goes from DataArcus straight to the browser launcher (`approval-window.mjs:5-6`). The spec
prefers HTTPS outside development. Gains little: every app seen that declares `url` also declares `form`.

**C. Words only (size S, risk low).** Change no code; say plainly what either route can and can't tell (below).

What stays true for A, B and C: the prompt and the page each prove that something on the person's computer answered
through the app or the browser. Neither can tell the person's click from an AI that controls the screen, mouse or
browser (computer use, a browser extension), from another program, or from an app setting that answers prompts by
itself (Claude Code's `Elicitation` hook). A typed-back code does not change this (the AI reads both) and is not proposed.

## (d) Prototype, measured (`node mcp/research/rd1/b278/prototype.mjs`, SDK 1.32.2, node v22.23.4, 3 Nov)

Server and Client in one process over `InMemoryTransport`; "DataArcus route" is the rule at `approve_plan.mjs:29`.

| case | client declares | server sees | DataArcus route | result | ms |
|---|---|---|---|---|---|
| 1 bare {} : accept, ticked | {} | {"form":{}} | app prompt | accept {"approve":true} | 18.11 (first call, schema compile) |
| 2 form : accept, ticked | {"form":{}} | {"form":{}} | app prompt | accept {"approve":true} | 2.47 |
| 3 form : accept, unticked | {"form":{}} | {"form":{}} | app prompt | accept {"approve":false} | 1.50 |
| 4 form : decline | {"form":{}} | {"form":{}} | app prompt | decline | 1.12 |
| 5 form : cancel | {"form":{}} | {"form":{}} | app prompt | cancel | 0.85 |
| 6 form : wrong type | {"form":{}} | {"form":{}} | app prompt | ERROR -32602: content does not match requested schema: data/approve must be boolean | 1.00 |
| 7 form+url : accept | {"form":{},"url":{}} | same | app prompt | accept {"approve":true} | 1.00 |
| 8 url only : form asked | {"url":{}} | {"url":{}} | browser page | ERROR (no code): Client does not support form elicitation. | 0.06 |
| 9 url only : url asked | {"url":{}} | {"url":{}} | browser page | accept (no content) | 1.16 |
| 10 none : form asked | none | none | browser page | ERROR (no code): Client does not support form elicitation. | 0.09 |
| 11 none : raw request | none | none | browser page | ERROR -32601: Method not found | 0.65 |
| 12 declared, never shown | {} | {"form":{}} | app prompt | ERROR -32001: Request timed out (200 ms set) | 201.51 |

Accept round trip, 200 runs: median 0.199 ms, p95 0.380 ms, max 1.947 ms. Case 12 is the gap: with today's 10-min
timeout the call waits 10 min, then fails with no page. Case 4 is how an SDK host without a handler answers (#96043).
In-process numbers only: a real app's prompt time is the person's.

## (e) Recommendation

C now, plus A's fallback as one builder job (size M in total, risk medium; no change for Claude Desktop chat, which
declares none and keeps the page). Not B. Exact words (no claim of proof against an AI controlling the screen):

`mcp/PRIVACY.md:259-262` (A6-3), replace with:
> - **A6-3** (who approves; closed in 0.2.9 rc.17): a plan is approved by your click on Approve in DataArcus's approval
>   window (`approvedBy: "user-in-browser"`) or by your yes in the app's own prompt, when the app supports MCP
>   elicitation (`"user-in-app"`); what the AI passes in a tool call approves nothing. What neither can tell: whether the
>   click or the yes came from you or from software acting on your computer: an AI that controls your screen, mouse or
>   browser (computer use, a browser extension), another program, or an app setting that answers prompts by itself.
>   Turn such access off while you approve, and approve a plan you asked for.

`mcp/README.md:67-68`: "What neither the window nor the app's prompt can tell: your click from one made by an AI or a
program that controls your screen, mouse or browser, or by an app setting that answers prompts by itself."

Site `beta.tools.approve_plan` (EN, `beta-page.js:73` and `power-bi-mcp/index.html:179`):
> Asks for your approval, with the plan and every file it writes: in the app's own prompt when the app has one,
> otherwise in DataArcus's approval window in your browser. No tool writes a file in your folder without an approved
> plan. Neither the prompt nor the window can tell your click from one made by an AI or a program that controls your
> screen, mouse or browser: see the privacy notes.

AR (`beta-page.js:188`, `ar/power-bi-mcp/index.html:179`; draft for the owner to check):
> تطلب موافقتك، وتعرض الخطة وكل ملف ستكتبه: في نافذة الموافقة الخاصة بالتطبيق إن كانت لديه، وإلا ففي نافذة الموافقة من
> DataArcus في متصفحك. لا تكتب أي أداة ملفًا في مجلدك دون خطة موافَق عليها. ولا تستطيع النافذتان التمييز بين نقرتك ونقرة
> ذكاء اصطناعي أو برنامج يتحكم في الشاشة أو الفأرة أو المتصفح: راجع ملاحظات الخصوصية.

`beta.how.s3` stays (Claude Desktop, the stated requirement, shows the window).

**Owner's decisions:** (1) an app-prompt "decline" refuses the plan for good (today) or opens the page instead (an
auto-decline can't be told from a person's No); recommended: keep refusing, and name the setting in the error. (2) the
prompt's wait (today 10 min; recommended 45 s, as the page's). (3) the setting's name.

## (f) Checks for a real-client pass

Claude Desktop (laptop, chat): `approve_plan` opens the browser page, no prompt; the answer says `user-in-browser`;
record the client name and capabilities DataArcus saw (a log line to stderr). Desktop Code tab / Cowork: does the app
declare elicitation, does a prompt show, or does it decline or hang (time it). Claude Code CLI (interactive): the prompt
names DataArcus, shows the plan's files and the box unticked; Accept ticked gives `user-in-app`; Accept unticked and
Decline refuse; Esc (cancel) leaves the plan approvable; the plan's Arabic text reads right. Claude Code `-p`: cancel,
no write. VS Code: the same three answers. Every case: nothing written before approval; a client without elicitation
falls back to the page; a declared-but-silent client falls back to the page within the new wait.

## (g) Brief for the builder (job B-278)

**Do:** in `approve_plan.mjs`, on a prompt timeout or transport error or `-32601`, open the browser page in the same
call; shorten the prompt's wait per decision (2); add the setting per (3) to force the page; log the client's name and
elicitation capability to stderr once. Change the words in (e) in PRIVACY.md, README.md, TOOLS.md, `beta-page.js` (EN
and AR) and both `power-bi-mcp/index.html`; `npm run build:min`; `node scripts/test-site-config.mjs`.
**Test (tests first):** a client that declares elicitation and never answers gets the page, not an error (fails today);
the setting forces the page with an eliciting client; decline still refuses, cancel still leaves it open; no path
approves without `user-in-app` or `user-in-browser`; the words test at `test-audit6.mjs:77` extended to the new
sentences. Then `npm test -- --keep-going`.
**Not in this job:** URL-mode elicitation (B); any typed-back code; any claim that approval is proof against an AI
controlling the screen; changes to the page's own security (Host, Origin, secret).
