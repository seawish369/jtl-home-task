# Toolchain

## Claude Code (desktop app), model Claude Opus 5.5

- Plan review in plan mode (read-only) before any code; then one step at a time:
  propose a file list, wait for approval, implement, verify, report.
- Read installed package sources before relying on an API, especially for new majors:
  MSW 3 (Vite plugin, `onUnhandledFrame`), Jotai 3 (`getOnInit` default), Vitest 5 config,
  TanStack Query internals (retry count, `isMutating` timing, when a fetch is cancelled vs joined),
  TanStack Router (`lazyRouteComponent`, `activeOptions`).
- `npm view` / `npm pack` (into a scratch folder, never executed) to check latest versions,
  peer ranges and engines before installing.

## Built-in browser pane (Claude desktop)

- Used for the first scaffold check. It can't register service workers, so it couldn't run
  the MSW mock API; browser checks moved to headless Chrome.

## Headless Google Chrome over the DevTools protocol (scripts in a scratch folder)

- Small Node scripts, not committed, driving a throwaway Chrome profile.
- Real (trusted) key events for keyboard-only walkthroughs: Tab order, focus after each
  action, visible focus outline at every stop.
- Network timing (e.g. parallel loader requests), console and uncaught-error capture.
- Live-region and focus logging to see what a screen reader would be told.
- Init scripts to force failures (e.g. `/api/users` returning 500, no service worker API),
  and MSW `worker.use()` overrides for slow or failing responses.
- 320 px viewport and screenshots.

## axe-core 4.14 (scratch folder, injected into the page; not a project dependency)

- WCAG 2.x A/AA and best-practice audits on every page and state, including transient
  ones (a todo while it's pending, validation errors, failure alert, error pages).

## Verification habits used with these tools

- Breaking a behaviour on purpose to prove a test can fail (optimistic create, form
  failure list, assignee precedence).
- Comparing dev against a production build before calling something a bug (StrictMode).
- A fresh clone in an empty folder, following the README literally, as the final check.

## Second AI session (reviewer): Claude in the Claude app, linked to my computer

- Used only to review and verify, never to write project code. It read the repo on my machine through the app's computer link and ran checks in its own cloud container.
- Reviewed each step's plan before coding and each result before committing; drafted many of my prompts to the coding agent and the judgment.md entries, which I edited.
- Verified each step independently: copied the changed files into its own clone, ran install/lint/typecheck/test, then its own Playwright scripts in headless Chromium (keyboard-only flows, request timing, sampling the list every 50 ms, live-region announcements, axe-core).
- Found issues the coding agent missed: the global "last pending create" count (step 6 plan), an alert cleared by an earlier submission's success (step 6), and validation errors not announced when the field already had focus (step 8).

## Skills and MCP servers

- No custom skills. No MCP servers in the coding agent beyond its built-in tools; the reviewer session reached my files only through the Claude app's computer link.
