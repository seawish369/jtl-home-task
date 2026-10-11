## Planning

# prompt 1

Read instructions.md (the task brief) and ai-journey/plan.md before doing anything.

Then tell me:

1. In a few sentences, what you understand we're building and what matters most for this task.
2. Anything in my plan that looks unclear, missing, risky, or that you'd do differently, and why.
3. Any questions you need answered before we start.

Don't write any code or create any files yet. I'll review your answer and decide what to change in the plan. After that, we'll start with step 1.

# prompt 2

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

# prompt 3

Yes to all, with one clarification on the optimistic create: do both. On success, replace the temp item in place (no flicker). And when the last pending create settles, still invalidate the list so it re-syncs with the server. The in-place swap doesn't replace that refetch.

I'm updating plan.md and committing it now. After that I'll say "start step 1".

# prompt 4

1. Agree to use Node 22 LTS, I will install it by myself
2. agree to pin

# prompt 5

Start step 2

# prompt 6

1. Boundary rule: also forbid @tanstack/react-router and jotai in users, todos, core and ui. The plan says features navigate through callbacks and only apps/web uses Jotai; lint should enforce that too.
2. When proving the rule, test both an `import type` and a normal value import from @todo-app/users in todos. Both must fail lint. Show me the output for each.
3. Don't add TextField, SelectField and Alert in step 2. Nothing uses them yet, so they can't be checked, and their API should come from real use. Accessibility still lives in packages/ui either way. Add TextField and Alert in step 4, SelectField in step 5.
4. Don't add new dependencies to apps/web yet; that belongs to step 3.
5. http.get/post should accept an AbortSignal, so TanStack Query can cancel requests.
6. ApiError must let callers tell a 404 apart from other errors, and a network failure (no response) apart from a server error.

The rest is fine, including zod as a peer of core and using ESLint's built-in rule instead of a plugin. Go ahead.

# prompt 7

start step 3

# prompt 8

MSW runs in every mode, as the plan says.
Yes, start the users data layer now (listUsers + usersQueries.list()).

Changes to the file list: 3. Route definitions go in one file, src/router.tsx: paths, loaders, validateSearch and the tree. Only page components live in separate files (e.g. src/pages/UsersPage.tsx) and are lazy-loaded. I chose code-based routes so the whole tree is readable in one place; splitting each route into two files loses that. 4. Mock latency: 400–800 ms for most requests, but POST /api/todos takes about 1.5 s, so the optimistic state is easy to see and test in step 6. 5. Keep the mock's own validation rules (not importing client schemas). I'll note the trade-off in the README.

When step 3 is done, show me:

- /api/users in the Network tab when /users loads, and an unknown URL showing the 404 page,
- the http client handling: GET /api/users/<unknown id> → isNotFoundError, a network failure, an aborted request, and a response that fails the schema,
- `pnpm build && pnpm preview` still serving the mock API.
  Then run lint and typecheck from the root.

# prompt 9

start step 4

# prompt 10

1. Show the rule up front as a hint on the field: "3–20 letters or numbers." Users should know the rule before they get it wrong.
2. Don't set maxLength on the input; let people type and show the validation message instead.
3. When the server returns a field error (e.g. the 409 duplicate), move focus to that field too, not only for client-side errors.
4. While saving, keep the button enabled but set aria-disabled="true" and ignore extra submits.

# prompt 11

start step 5

# prompt 12

1. List order: oldest first, newest last, matching the mock. In step 6 the optimistic item is appended to the end, so the order must not change when the list refetches.
2. In the /users/$userId loader, load the user and the users list in parallel (Promise.all), and only prefetch the todos without awaiting them. Don't make the page wait for requests one after another.
3. The key={assigneeId} remount on /todos is fine; I'll note the trade-off (a half-typed title is lost when switching the filter) in the README.

Run the checks you listed, plus: creating a todo before the list has finished loading still works and the new todo shows once the list loads.

# prompt 13

start step 6

# prompt 14

1. Bug: isMutating({ mutationKey }) === 1 counts creates for all assignees. Create for ada, then quickly for grace: ada's create settles while grace's is pending, so ada's list is never refetched. Count only pending creates for the same assignee (e.g. a predicate on mutation.state.variables.assigneeId). Add a test for this case.

2. Failures: if two creates fail, keep both titles in the alert (a list) until the next successful submit or until it's dismissed — don't let the second failure overwrite the first.

3. Announce the submit: set the status region to "Saving “X” for <name>…" when the form submits, then "Added …" on success. The item may be in a list that isn't on screen.

4. Tell me what happens if a refetch (e.g. window focus) finishes while a create is pending. Either keep pending temp items when that data arrives, or tell me it's an accepted trade-off and I'll note it in the README.

5. Catch the mutateAsync rejection in the form (no unhandled rejections). If the form unmounted, skip the title restore; the hook still rolls back.

Keep the rest as planned. Read Vitest 5's config API from the installed package before writing the config, as you said.

# prompt 15

Bug in CreateTodoForm, found in a real browser: submit "please fail", then immediately "Second ok". The first fails, then the second succeeds ~30 ms later and clears the alert because 2 > 1. The user sees the title come back with no error message.

A success should only clear failures that were already visible when that submission was made. Suggestion: number failures as they arrive; at submit, remember the latest failure number; on success, remove only failures up to that number.

Add a test that renders CreateTodoForm (not just the hook) for this exact sequence: first fails, second succeeds after it → the alert still lists the first title. Break the fix on purpose to confirm the test fails.

# prompt 16

start step 7

# prompt 17

Yes, go ahead with the store in the router context. The loader prefetch is only an optimisation; components still own the fetching, since the loader doesn't re-run when the active user changes.

Please add:

1. Fold in the step 5 leftover: the form only preselects an assignee that exists in assigneeOptions. With ?assigneeId=bogus, the list still shows "No user with this ID." (the URL wins, no fallback to the active user), and submitting shows the client message "Choose an assignee."
2. Clear the saved ID only after the users list loaded successfully; never on an error.
3. The header picker uses a plain useQuery, so it never suspends the layout.
4. On /users/$userId, changing the active user must not remount or change the form (the page wins). Check this in the browser.
5. Put the precedence in one pure function, e.g. resolveAssignee({ pageUserId, urlAssigneeId, activeUserId, validIds }), with unit tests in apps/web for each rule, including a bogus URL ID.
