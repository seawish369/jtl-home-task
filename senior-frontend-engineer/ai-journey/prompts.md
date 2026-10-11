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
