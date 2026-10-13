# Prompts

Curated from my sessions with the coding agent (Claude Code). I wrote or approved every prompt; many were drafted together with a second AI session that reviewed each step (see toolchain.md) and edited before sending.

Each step was started with a one-line "start step N", and the agent first replied with its plan and file list. Those one-liners are left out; the prompts below are my answers to its plans and results.

## Planning

### Prompt 1: Plan review before any code

Read instructions.md (the task brief) and ai-journey/plan.md before doing anything.

Then tell me:

1. In a few sentences, what you understand we're building and what matters most for this task.
2. Anything in my plan that looks unclear, missing, risky, or that you'd do differently, and why.
3. Any questions you need answered before we start.

Don't write any code or create any files yet. I'll review your answer and decide what to change in the plan. After that, we'll start with step 1.

### Prompt 2: Answers to the plan review

1. Monorepo lives inside senior-frontend-engineer/, next to instructions.md and ai-journey/. Other tracks' folders stay untouched
2. /todos without assigneeId shows the active user's list implicitly. No redirect; the URL stays clean
3. Code-based routes, with lazy-loaded route components for code splitting
4. Keep server-generated IDs with a temp-ID swap
5. Package scope: @todo-app/\*
6. Yes to mocking the todos API module in tests, and yes to building a11y into each step (step 8 becomes a keyboard-only check)
7. No need to do the "reset demo data". I will add guidance into README how to clear it.

On versions: your expected majors may be out of date (e.g. MSW and ESLint have newer majors, and TypeScript 7 may not work with typescript-eslint yet). Check what actually gets installed before using any API.

Validation rules:

- Username: 3 - 20 characters (letters, numbers, trimmed, unique case-insensitively)
- Todo title: 1 - 120 characters, trimmed
  Query client: staleTime 30s, no retries on 4xx, no retries for mutations
  Pin Node and pnpm. I commit after each step myself.

I'll update plan.md with these decisions. Don't create or edit any files, including notes or review files. When I say "start step 1", list the files you'll create, then wait for my OK.

### Prompt 3: Clarifying the optimistic create

Yes to all, with one clarification on the optimistic create: do both. On success, replace the temp item in place (no flicker). And when the last pending create settles, still invalidate the list so it re-syncs with the server. The in-place swap doesn't replace that refetch.

I'm updating plan.md and committing it now. After that I'll say "start step 1".

## Step 1: scaffold

### Prompt 4: Node and pnpm

1. Agree to use Node 22 LTS, I will install it by myself
2. agree to pin

## Step 2: shared packages and boundary rule

### Prompt 5: Changes to the step 2 plan

1. Boundary rule: also forbid @tanstack/react-router and jotai in users, todos, core and ui. The plan says features navigate through callbacks and only apps/web uses Jotai; lint should enforce that too.
2. When proving the rule, test both an `import type` and a normal value import from @todo-app/users in todos. Both must fail lint. Show me the output for each.
3. Don't add TextField, SelectField and Alert in step 2. Nothing uses them yet, so they can't be checked, and their API should come from real use. Accessibility still lives in packages/ui either way. Add TextField and Alert in step 4, SelectField in step 5.
4. Don't add new dependencies to apps/web yet; that belongs to step 3.
5. http.get/post should accept an AbortSignal, so TanStack Query can cancel requests.
6. ApiError must let callers tell a 404 apart from other errors, and a network failure (no response) apart from a server error.

The rest is fine, including zod as a peer of core and using ESLint's built-in rule instead of a plugin. Go ahead.

## Step 3: mock API and routing

### Prompt 6: Changes to the step 3 plan

MSW runs in every mode, as the plan says.
Yes, start the users data layer now (listUsers + usersQueries.list()).

Changes to the file list: 3. Route definitions go in one file, src/router.tsx: paths, loaders, validateSearch and the tree. Only page components live in separate files (e.g. src/pages/UsersPage.tsx) and are lazy-loaded. I chose code-based routes so the whole tree is readable in one place; splitting each route into two files loses that. 4. Mock latency: 400–800 ms for most requests, but POST /api/todos takes about 1.5 s, so the optimistic state is easy to see and test in step 6. 5. Keep the mock's own validation rules (not importing client schemas). I'll note the trade-off in the README.

When step 3 is done, show me:

- /api/users in the Network tab when /users loads, and an unknown URL showing the 404 page,
- the http client handling: GET /api/users/<unknown id> → isNotFoundError, a network failure, an aborted request, and a response that fails the schema,
- `pnpm build && pnpm preview` still serving the mock API.
  Then run lint and typecheck from the root.

## Step 4: users feature

### Prompt 7: Additions to the user form

1. Show the rule up front as a hint on the field: "3–20 letters or numbers." Users should know the rule before they get it wrong.
2. Don't set maxLength on the input; let people type and show the validation message instead.
3. When the server returns a field error (e.g. the 409 duplicate), move focus to that field too, not only for client-side errors.
4. While saving, keep the button enabled but set aria-disabled="true" and ignore extra submits.

## Step 5: todos feature

### Prompt 8: Changes to the step 5 plan

1. List order: oldest first, newest last, matching the mock. In step 6 the optimistic item is appended to the end, so the order must not change when the list refetches.
2. In the /users/$userId loader, load the user and the users list in parallel (Promise.all), and only prefetch the todos without awaiting them. Don't make the page wait for requests one after another.
3. The key={assigneeId} remount on /todos is fine; I'll note the trade-off (a half-typed title is lost when switching the filter) in the README.

Run the checks you listed, plus: creating a todo before the list has finished loading still works and the new todo shows once the list loads.

## Step 6: optimistic create

### Prompt 9: Review of the optimistic-create plan

1. Bug: isMutating({ mutationKey }) === 1 counts creates for all assignees. Create for ada, then quickly for grace: ada's create settles while grace's is pending, so ada's list is never refetched. Count only pending creates for the same assignee (e.g. a predicate on mutation.state.variables.assigneeId). Add a test for this case.

2. Failures: if two creates fail, keep both titles in the alert (a list) until the next successful submit or until it's dismissed — don't let the second failure overwrite the first.

3. Announce the submit: set the status region to "Saving “X” for <name>…" when the form submits, then "Added …" on success. The item may be in a list that isn't on screen.

4. Tell me what happens if a refetch (e.g. window focus) finishes while a create is pending. Either keep pending temp items when that data arrives, or tell me it's an accepted trade-off and I'll note it in the README.

5. Catch the mutateAsync rejection in the form (no unhandled rejections). If the form unmounted, skip the title restore; the hook still rolls back.

Keep the rest as planned. Read Vitest 5's config API from the installed package before writing the config, as you said.

### Prompt 10: Bug found in the browser: alert cleared too early

Bug in CreateTodoForm, found in a real browser: submit "please fail", then immediately "Second ok". The first fails, then the second succeeds ~30 ms later and clears the alert because 2 > 1. The user sees the title come back with no error message.

A success should only clear failures that were already visible when that submission was made. Suggestion: number failures as they arrive; at submit, remember the latest failure number; on success, remove only failures up to that number.

Add a test that renders CreateTodoForm (not just the hook) for this exact sequence: first fails, second succeeds after it → the alert still lists the first title. Break the fix on purpose to confirm the test fails.

## Step 7: active user

### Prompt 11: Review of the active-user plan

Yes, go ahead with the store in the router context. The loader prefetch is only an optimisation; components still own the fetching, since the loader doesn't re-run when the active user changes.

Please add:

1. Fold in the step 5 leftover: the form only preselects an assignee that exists in assigneeOptions. With ?assigneeId=bogus, the list still shows "No user with this ID." (the URL wins, no fallback to the active user), and submitting shows the client message "Choose an assignee."
2. Clear the saved ID only after the users list loaded successfully; never on an error.
3. The header picker uses a plain useQuery, so it never suspends the layout.
4. On /users/$userId, changing the active user must not remount or change the form (the page wins). Check this in the browser.
5. Put the precedence in one pure function, e.g. resolveAssignee({ pageUserId, urlAssigneeId, activeUserId, validIds }), with unit tests in apps/web for each rule, including a bogus URL ID.

## Step 8: accessibility and keyboard pass

### Prompt 12: Audit scope

Yes, start Part A with axe-core in your scratch folder. Also:

1. Run axe while a todo is pending too (opacity-60 + "Saving…" may fail contrast), not only on settled states.
2. Check whether changing the active user on /todos is announced (the list changes, only the heading text changes).
3. Check a 320px-wide viewport: header with the picker wraps, no horizontal scroll.
4. Check focus after browser Back/Forward lands on the <h1>, not <body>.

Service worker fallback: yes, do it in step 8. If worker.start() fails, render a short message in #root explaining the app needs service workers for its mock API and suggesting a normal (non-private) window. Test it by making worker.start() reject.

### Prompt 13: Fixes, plus a finding the audit missed

Go ahead with Part B: all 7 findings, including #6.

One more finding from a second check that recorded what a screen reader actually receives (live-region changes plus the focused element's name and description):

8. Serious (WCAG 4.1.3 / 3.3.1): validation errors aren't announced when you submit with Enter from the field. Focus is already on the input, so focus() is a no-op, no focus event fires, and the new aria-describedby text is never read. Happens for Username ("ab", the 409 duplicate) and Title. The audit checked where focus is, not what gets announced. Fix it so the error is announced even when the invalid field already has focus (for example, also put the message in the form's live region on a failed submit). Re-check both forms.

9. Minor: move the Dismiss button outside the role="alert" element, so the alert doesn't read "…Please try again. Dismiss".

For #1: note that it's a regression from step 7's "only preselect real options" fix, which exposed the stale users-list cache.

After the fixes, re-run axe, the keyboard walkthrough, and an announcement log (what each live region says at each step) for: invalid username, duplicate, add todo, failed todo, changing the active user and the filter.

## Step 9: README and fresh clone

### Prompt 14: README and fresh-clone check

Go ahead, with these changes:

1. Write sections 1–3 and 5 of the README. For section 4 (Reflection), leave only the headings "Performance" and "Testing strategy" with a TODO; I'll write it myself.
2. Root README: first check instructions.md for whether files outside senior-frontend-engineer/ may change. If nothing forbids it, add only a two-line pointer at the top; change nothing else there.
3. Send the toolchain.md draft in chat (only what you used). I'll add my second verification session.
4. Also list known gaps in the README: no real screen reader run, native select popups not driven (type-ahead used), browser checks were scripted in scratch folders and aren't committed as e2e tests.
5. Do the fresh-clone check exactly as you described, through corepack with the pinned pnpm 11.28.2.

### Prompt 15: Shorten the README

The brief asks for a README of "about half a page". Please shorten senior-frontend-engineer/README.md to roughly that:

- Run it: requirements + the 4 commands, and the demo tips in 3 short bullets.
- Why this split: one short paragraph.
- Key decisions: 5–6 one-line bullets (boundaries enforced by lint + pnpm, routing/loaders, optimistic create, Jotai only for the active user, Zod, MSW).
- Trade-offs and known gaps: the 4–5 most important, one line each.
- Reflection: keep my section as it is (I'm pasting it in).
- Link to ai-journey/ and to the long version.
  Move the current detailed architecture text, unchanged, into senior-frontend-engineer/docs/architecture.md and link to it. Don't touch ai-journey/.

_Note: the move to docs/architecture.md was dropped in the next prompts; the README was shortened instead._

### Prompt 16: Review my reflection

review my reflection section in the README

### Prompt 17: Apply the review

apply 1, 2, 3 and 5. Also please help me reduce README to become short (about half a page)
