## Planning phase

### AI edited plan.md although I said not to

- **What happened:** In the first plan review I said "don't create any files", but it wrote its review into plan.md.
- **How I noticed:** It said so at the end of its reply; I checked the diff.
- **What I did:** Reverted it and added "Don't edit plan.md or the ai-journey files; propose changes in chat" to "How to work with me".

### Version knowledge was outdated

- **AI proposed:** Expected majors "MSW 2, ESLint 9", and assumed the latest TypeScript would work.
- **Problem:** Newer majors exist, and typescript-eslint doesn't support TypeScript 7 yet.
- **How I found it:** Pushed back; the AI then checked npm and corrected itself. I verified with `npm view typescript-eslint peerDependencies`.
- **What I did:** Pinned TypeScript 6.0.x; kept the rule "check installed versions before using an API" in the plan.

### Client-generated UUIDs instead of a temp-ID swap (rejected)

- **AI proposed:** Let the client generate the todo ID, so no ID swap on success.
- **Why I said no:** Rows have nothing focusable, so the remount is harmless; server-generated IDs are the normal API contract, and I didn't want to change the API for UI convenience. The temp-ID swap also shows the rollback mechanism clearly.
- **What I did:** Kept the temp-ID swap; client UUIDs go into the README as an alternative.

### File-based routes (rejected)

- **AI proposed:** File-based routing with the Vite plugin and auto code splitting.
- **Why I said no:** For ~5 routes, one readable file beats a codegen step; lazy route components still give code splitting.
- **What I did:** Code-based routes with lazy page components.

### Render slot → assigneeOptions (accepted, changed my plan)

- **AI proposed:** Pass `assigneeOptions: { id, label }[]` to the todo form instead of a render slot.
- **Why I agreed:** Same decoupling, but todos owns its own select, labels, validation and focus. A slot needs extra plumbing to focus a control rendered by another package.
- **What I did:** Updated the plan's boundary rule.

### Ambiguous wording: "replace rather than refetch"

- **What happened:** The AI said it would replace the temp item "rather than refetching".
- **Problem:** The plan needs both: swap in place on success, and still refetch when the last pending create settles.
- **What I did:** Clarified before step 1, so it doesn't turn into a bug in step 6.

### Scope control in step 1

- **AI proposed:** `@todo-app/config` as a dependency of apps/web; users and todos created in step 2.
- **What I did:** Config is a devDependency everywhere. Users/todos in step 2 are empty skeletons only, just enough to test the boundary rule. Also kept `engines.node` at ">=22" instead of an exact pin, so reviewers on Node 22 or 24 can install.

### Where AI helped most

- The first plan review found real gaps I hadn't written down: the snapshot-rollback trap with two concurrent creates, MSW needing to run in production builds, Tailwind `@source` for unbuilt packages, and the conflict between clearing the form and "keeping my text" on failure.

## Step 1: scaffold

### AI was more precise than my instruction (accepted)

- **I asked for:** `engines.node: ">=22"`.
- **AI set:** `">=22.12.0"`.
- **Why it's right:** Vite 8 needs Node 22.12+; with ">=22", someone on 22.5 could install but Vite wouldn't run. The AI had pointed this out earlier; I'd missed it.
- **What I did:** Kept its version.

### A tool changed the repo, not the AI

- **What happened:** An AGENTS.md file appeared. Turborepo writes it automatically when it detects an AI agent running its commands.
- **How I found it:** Checked untracked files before committing.
- **What I did:** <kept and committed it / disabled it with agentGuidance: false>. Also ignored `.claude/settings.local.json` (local agent permissions).

### Verified, not trusted

- Ran lint and typecheck myself, opened the page, and checked the built CSS contains the ui package's Tailwind classes (`@source` works).

## Step 2: shared packages and boundary rule

### Boundary rule didn't cover the plan's other rules

- **AI proposed:** Lint forbids users ↔ todos and imports from apps/web.
- **Problem:** The plan also says features don't use the router or Jotai, but nothing enforced it.
- **What I did:** Added @tanstack/react-router and jotai to the forbidden list for users, todos, core and ui.

### Form components up front (rejected)

- **AI proposed:** Build TextField, SelectField and Alert in step 2 "so accessibility lives in one place".
- **Why I said no:** Accessibility lives in packages/ui either way. In step 2 nothing uses them, so they can't be verified, and their API should come from real use.
- **What I did:** TextField and Alert in step 4, SelectField in step 5.

### Testing the test

- **What I did:** Asked the AI to prove the boundary rule with both a type import and a value import, since lint rules can treat `import type` differently.
- **Result:** Both were blocked. `import type { User } from '@todo-app/users'` and `import * as users from '@todo-app/users'` in todos each failed lint with the boundary message, and failed typecheck with TS2307 (todos doesn't list users as a dependency, so pnpm can't resolve it). Type imports are caught because the rule's `allowTypeImports` stays at its default (false). I also checked the other direction (users → todos) and a deep import from apps/web (`@todo-app/ui/src/...`): both fail lint too.

### AI verified instead of guessing

- Before claiming "2 retries", the AI read the installed TanStack Query retryer source to confirm the failure count starts at 0. Good habit; I'll keep asking for this kind of check.

### Environment problem found through the logs

- **What happened:** Lint and typecheck passed, but Turbo's log showed it calling pnpm from my Node 18 install, not the pinned pnpm on Node 22.
- **Why it matters:** The project needs Node ≥ 22.12 (Vite 8); later steps and "fresh clone runs" would break or behave differently.
- **What I did:** Set Node 22 as default with nvm, enabled corepack, re-ran install, lint and typecheck.

## Step 3: mock API and routing

### AI read the new MSW major instead of guessing

- **What happened:** MSW 3 was new to the AI. It downloaded the package to a scratch folder and read its types and Vite plugin source (without running it) before planning.
- **Result:** Used the stable `worker-only` mode of the new `msw/vite` plugin instead of the experimental default; no `msw init` step needed.

### Route files split per route (changed)

- **AI proposed:** Two files per route (definition + lazy page) plus a tree file.
- **Problem:** I picked code-based routing so the whole route tree is readable in one file; this split loses that.
- **What I did:** All route definitions in one router.tsx; only page components are separate, lazy-loaded files.

### Mock latency tuned for step 6

- **AI proposed:** 400–800 ms on every response.
- **What I did:** POST /api/todos ~1.5 s, so the optimistic "Saving…" state and two overlapping creates can be tested by hand.

### Mock validates on its own (accepted)

- **AI proposed:** The mock checks its own rules instead of importing the client's Zod schemas.
- **Why I agreed:** It behaves like a real, independent server; a bug in client validation would still be caught. Cost: a few rules exist twice. Noted in the README.
