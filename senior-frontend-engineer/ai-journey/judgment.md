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

## Step 4: users feature

### AI caught an accessibility detail I didn't know

- **AI proposed:** Don't disable the submit button while saving.
- **Why:** Disabling the focused button sends focus back to <body>, so keyboard and screen reader users lose their place.
- **What I did:** Kept it, and added aria-disabled="true" while saving so the state is still announced.

### Form placement

- **AI asked:** Form on /users or a separate /users/new route.
- **I chose:** /users, above the list. The brief asks for a form, not a page; routing is already shown through a path param, a search param and notFound().

### Additions to the AI's plan

- Show the username rule as a hint up front; no maxLength (it blocks typing silently); move focus to the field for server errors too, not just client errors.

### Verified independently

- Ran the full flow in a real browser with keyboard only (second AI session): validation messages, 409 on the field with focus moved back, one POST despite repeated Enter/Space while saving, focus on the new user's <h1>, no extra detail request after create, list updated after Back, "User not found" for an unknown ID with a single request.

### Accessibility details from the AI I kept

- The submit button isn't disabled while saving (disabling a focused button drops focus to <body>); it uses aria-disabled instead and ignores extra submits.
- Focus moves to the invalid field after the error has rendered, so screen readers announce the field with its new error. Focusing straight away would read the old description.

### Unplanned change, accepted

- The AI also edited Button.tsx (styles for aria-disabled). Not in the agreed file list, but it said so and the change is small and needed.

### A step 3 fix that slipped through

- The pnpm 11 pin I asked for before committing step 3 wasn't applied; step 3 was committed with pnpm 12, which corepack can't install. Caught while reviewing step 4; fixing it in its own commit.

## Step 5: todos feature

### AI's architecture choice I agreed with

- **AI proposed:** The todo list uses useQuery with its own loading/error/empty states, not Suspense; loaders only start fetching.
- **Why it's right:** Step 7 needs the Jotai active user, which a route loader can't read; and step 6 needs the form to work while the list is still loading.

### Additions to the plan

- Fixed the list order (oldest first) so the optimistic item appended in step 6 doesn't jump when the list refetches.
- Parallel loading on the user detail page instead of sequential awaits.
- Added a check for creating a todo before the list has loaded, as a baseline for step 6.

### Accepted trade-off

- Switching the assignee filter on /todos remounts the form, so a half-typed title is lost. Simple and predictable; noted in the README.

### A step 3 bug found in step 5

- **What happened:** The mock database created random seed IDs on load but only saved them to localStorage after the first write. Reloading before any write produced new IDs, so a bookmarked /users/<id> or ?assigneeId= link showed "not found".
- **How it was found:** The AI hit it while testing a reload on /todos?assigneeId=… in a real browser. I reproduced it independently.
- **What I did:** Accepted the fix (save the seed data as soon as it's created). Lesson: some bugs only show up when a later step uses the data in a new way, here a user ID kept in the URL.

### Investigated before fixing: duplicate GET in dev

- **What happened:** Changing the filter sent two GET /api/todos requests.
- **How it was checked:** The AI suspected React StrictMode (mount → unmount → remount; the query passes the AbortSignal, so the first fetch is cancelled) and compared against a production build: one request there.
- **What I did:** No change. Dev-only, and cancelling on unmount is the behaviour we want.

### Accessibility detail kept

- **AI proposed:** Show the success message in a `<p role="status">` that is always on the page, instead of an Alert rendered only after success.
- **Why it's right:** Screen readers reliably announce changes to a live region that already exists, but often miss one that is inserted together with its text.

### Lint pushed toward simpler code

- **What happened:** The React Compiler lint rule rejected reading refs out of an object (`fieldRefs.title`) during render.
- **What I did:** Accepted the AI's switch to two plain refs. It's clearer, and an eslint-disable comment went away.

### Baseline for step 6, measured

- **What happened:** Creating a todo while the list was still loading: first GET at 1215 ms, POST at 1650 ms, new GET at 3164 ms. The create's `invalidateQueries` cancelled the slow first load and started it again, so the list appeared ~2 s later than necessary.
- **What I did:** Added "don't cancel the first load of a list that isn't cached yet" to the step 6 prompt, with a regression test.
- **Also for step 6:** The form remounts when the filter changes, so rollback and refetch must go in the `useMutation` callbacks, not the per-call `mutate(…, { onError })` callbacks, which are lost on unmount.

### Found in my review

- **Problem:** With ?assigneeId=bogus, the select showed "Choose a user", but the form state held "bogus". Submitting skipped client validation and got the server error "Choose an existing user."
- **What I did:** fixed: the form only preselects defaultAssigneeId if it exists in assigneeOptions.

### Verified independently

- A second AI session ran a keyboard-only flow in a real browser:
  - ada's todos load oldest first
  - the form's assignee follows the filter
  - empty or too long titles get the right messages, with focus on the field
  - a new todo is appended last, with the title cleared, focus back on Title and the status announced
  - assigning to grace from ada's page leaves ada's list unchanged
  - a "fail" title shows the Alert and keeps the text
  - the user detail page loads user and todos in parallel
  - IDs survive a reload
- Lint and typecheck pass; grep confirms

## Step 6: optimistic create

### AI caught a TanStack Query trap

- **AI proposed:** Use mutateAsync() in the form instead of mutate() with per-call callbacks.
- **Why it's right:** Callbacks passed to mutate() only run for the latest call. With two quick creates, the first one's failure would never reach the form.
- **What I did:** Kept it.

### Refetch condition counted every assignee

- **AI proposed:** Refetch when the last pending create settles: `isMutating({ mutationKey }) === 1`.
- **Problem:** That counts creates for all assignees. Create for ada, then quickly for grace: ada's create settles while grace's is still pending, so ada's list is never refetched.
- **How I found it:** Reviewing the plan with a concrete two-assignee sequence.
- **What I did:** Count only pending creates for the same assignee; added a test.

### Additions to the plan

- Keep every failed title in the alert, so a second failure can't hide the first.
- Announce "Saving “X” for <name>…" on submit, since the form clears immediately and the item may be in a list that isn't on screen.

### Plan fixes confirmed in the browser

- The per-assignee refetch works: ada's POST finished at 4486 ms and her list re-synced at 4487 ms while grace's create was still pending.

### Alert cleared by an earlier submission's success

- **AI proposed:** Number submissions; a success clears failures with a lower submission number.
- **Problem:** Submit "please fail", then "Second ok". The first fails, the second succeeds 30 ms later and clears the alert: the title comes back with no message, for sighted and screen reader users alike.
- **How I found it:** My own browser check of the "two quick creates, one fails" case. The AI's unit tests only covered the hook, and its browser check looked at the restored title but not the alert.
- **What I did:** A success now only clears failures that were already visible when that submission was made. Added a form-level test and broke the fix on purpose to confirm the test catches it.

### AI corrected its own earlier claim

- In step 5 the AI said invalidateQueries cancelled the slow first load. After reading the installed query.js, it corrected this: a fetch is only cancelled when the query already has data. The extra GET was StrictMode. Step 6 has a test showing the first load's signal is never aborted.

### Tests that couldn't fail

- The AI broke each behaviour on purpose (7 cases). Two tests passed anyway: one read state before TanStack Query's notification arrived, and one checked after the final refetch had already hidden the duplicate. Both were fixed until all 7 breakages failed a test.

### Trade-offs for the README

- If the list hasn't loaded when you submit, no optimistic item is shown; it appears when the save finishes.
- If the form unmounts (navigate away, filter change) before a create fails, the list still rolls back but the title and error message are lost.
- The todo form no longer has a saving state on the button; the user form keeps it.

### The fix, verified both ways

- A form-level test replays the exact sequence (first fails, second succeeds after it → alert still lists the first). A second test checks the opposite (a failure already on screen is cleared by a later success), so the fix can't just stop clearing altogether.
- Broke the fix both ways on purpose; each broken version fails one test. Re-ran the sequence in a real browser myself: the alert stays.

### Hidden test leak found along the way

- **What happened:** The new form test failed with "Found multiple elements with the text of: Title".
- **Cause:** Testing Library only cleans up automatically when Vitest globals are on; we import from 'vitest' explicitly, so each test's DOM stayed for the next. The earlier hook tests had the same leak without a visible effect.
- **What I did:** Accepted the AI's vitest.setup.ts that runs cleanup() after every test.
