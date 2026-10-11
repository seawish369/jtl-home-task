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
