# Plan

Written before coding. Updated as decisions changed (see "Changes during the build").

The task and its requirements are in `instructions.md` (in senior-frontend-engineer/).
This file only covers how I'm going to build it.

## Goal

Cover the brief with a small, clean solution. What matters most: independent feature
packages, and an optimistic todo create that rolls back correctly.

## Monorepo structure

- apps/web — routing, pages, composition. The only place that knows both features.
- packages/users — user feature: components, hooks, API calls, types.
- packages/todos — todo feature: components, hooks, API calls, types.
- packages/core — QueryClient factory, http client, API error type. Nothing feature-specific.
- packages/ui — shared UI components.
- packages/config — tsconfig, eslint config.
- Mock API (MSW) lives in apps/web/src/mocks, with one in-memory db and seed users.

Boundaries:

- users and todos never import each other. Enforced by an ESLint rule, and by not
  listing each other in package.json (pnpm then can't resolve the import).
- todos only knows `assigneeId`. Where the features meet (e.g. the assignee picker in
  the todo form), the feature takes data/callback props (e.g. assigneeOptions, onCreated) and apps/web fills it.
- IDs are strings.

## How I'll use the stack

- **pnpm + Turborepo** — tasks: build, lint, typecheck, test, dev. Nothing more.
- **Packages aren't built** — they export their TS source; Vite compiles it. Tailwind
  needs `@source` for each package so their classes aren't dropped.
- **TanStack Router** — /users/$userId (path param), /todos?assigneeId=... (search
  param, validated with Zod). The user detail page also shows that user's todos and
  a form to create one.
- **TanStack Query** — all server data. Query keys live in each feature package.
- **Optimistic create** — each new todo gets a temp ID; on error remove only that item;
  refetch only after the last pending create finishes; add it only to its assignee's
  list. If that list hasn't loaded yet, don't cancel its first load.
- **Failed create** — put the title back into the form only if the form is empty, show
  an error, and announce it for screen readers. An inline "Retry" is out of scope.
- **Jotai** — only for the active user (below). Atom lives in apps/web; feature
  packages get values as props and don't import Jotai.
- **MSW** — some delay so loading states show; a todo title containing "fail" returns
  an error, to show the rollback. Data is saved to localStorage so it survives a reload.
- **Zod** — one schema per form, also used to check API responses.
- **Vitest** — a few tests for the optimistic create only (see step 6).

## Active user (the Jotai state)

The user you're "working as", picked once in the header. Not a login; just a UI choice.

- Pre-fills the assignee when creating a todo.
- Default list on /todos when the URL has no assigneeId.
- The URL decides what you're looking at; the active user is only a default.
  Order: page context > URL > active user > nothing.
- Stores only the user ID, kept across reloads (localStorage). If the saved ID no
  longer exists in the user list, clear it.

## Decisions after the AI review

- Monorepo inside senior-frontend-engineer/. Package scope: @todo-app/\*.
- Routes are code-based, page components lazy-loaded. queryClient is in the router context;
  loaders call ensureQueryData; routes have pending/error/notFound components.
- Feature packages don't import the router; they navigate through callbacks (e.g. onCreated).
- The todo form gets `assigneeOptions: { id, label }[]` from apps/web (instead of a render slot).
- /todos without assigneeId shows the active user's list without changing the URL.
- Server-generated IDs with a temp-ID swap (client UUIDs considered, not used).
- Validation: username 3–20, (letters/numbers, trimmed, unique (case-insensitive))
  title 1–120, trimmed. Mock rejects duplicates and unknown assignees with field errors.
- QueryClient: staleTime 30s, no retries on 4xx, no retries for mutations.
- A11y is built into steps 1–5; step 8 is a keyboard-only check. Focus moves to the page
  <h1> after navigation.
- Tests mock the todos API module (vi.mock), not MSW.

## Steps

1. Scaffold monorepo → done when: `pnpm dev` shows a page that uses a component from packages/ui; lint + typecheck pass from the root.
2. Shared packages (core, ui, boundary lint rule) → done when: importing packages/users from packages/todos makes lint fail.
3. Mock API + routing skeleton → done when: /api/users shows in the Network tab, links between pages work, an unknown URL shows the 404 page.
4. Users feature → done when: create user with clear validation messages (incl. duplicate username), see detail, unknown user shows "not found".
5. Todos list + create (not optimistic yet) → done when: a new todo appears after saving; empty title / no assignee show clear messages; todos still doesn't import users.
6. Optimistic create → done when: item appears instantly; title with "fail" rolls back and the title comes back into the empty form; tests pass for: one failure, two quick creates where one fails (the other stays), and creating before the list has loaded.
7. Active user (Jotai) → done when: choosing a user in the header pre-fills the assignee and is the default list on /todos; on /users/$userId the page's user still wins; with nobody chosen, /todos shows an empty state; it survives a reload.
8. A11y pass → done when: whole flow works keyboard-only.
9. Docs → done when: fresh clone installs and runs from README; README and ai-journey cover what instructions.md asks for.

## How to work with me

- Work one step at a time; stop after each step for my review.
- Before coding a step, list the files you'll create or change.
- Don't edit plan.md or the ai-journey files; propose changes in chat.
- Check installed versions before relying on a library API.
- Run typecheck and lint before calling a step done.
- If something in this plan seems wrong, say so instead of working around it.

## Changes during the build

- Before coding: answered the AI's plan review. Decided the failed-create behaviour
  (title back into an empty form, no inline retry), to keep the active user and mock
  data across reloads, and to add a few rollback tests in step 6.

- Second AI review: switched from slot to assigneeOptions; kept temp-ID swap and code-based routes against its suggestions; AI’s version expectations were outdated.
- AI said "replace rather than refetch" — clarified: swap in place AND refetch
  when the last create settles.
