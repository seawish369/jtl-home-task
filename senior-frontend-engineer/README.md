# Todo app — frontend take-home

React 19 + TypeScript + Vite in a pnpm/Turborepo monorepo, with TanStack Router and Query,
Jotai, Tailwind, Zod and an in-browser mock API (MSW).

## Run it

Needs Node ≥ 22.12 and pnpm 11.28.2 (pinned in `package.json`, installed via Corepack).

```bash
nvm use && corepack enable
pnpm install
pnpm dev    # http://localhost:5173 — also: pnpm build && pnpm preview, pnpm test, pnpm lint, pnpm typecheck
```

Seeded users: ada, grace, linus. A todo title containing "fail" makes the server return 500,
to show the rollback. Data is kept in localStorage (clear site data to reset). The mock API
runs in a service worker, so use a normal (non-private) browser window.

## Architecture

- `apps/web`: routes, pages, composition, mock API, Jotai state. The only package that knows both features.
- `packages/users`, `packages/todos`: one package per feature (schemas, API calls, query options, hooks, components).
- `packages/core` (http client, errors, QueryClient), `packages/ui` (accessible primitives), `packages/config` (tsconfig, ESLint).

**Why this split:** each feature owns its whole slice and exposes a small API through
`exports`, so it can be changed or tested on its own. Features never import each other;
apps/web connects them (users → the todo form's `assigneeOptions`, navigation through
`onCreated`). ESLint rules and pnpm dependencies enforce this, and only apps/web may use the
router or Jotai.

- **Routing:** the code-based route tree is in one file (`router.tsx`) and page components are
  lazy-loaded. Loaders prefetch with the features' `queryOptions`. `/users/$userId` is a path
  param (unknown ID → "User not found"); `/todos?assigneeId=` is a Zod-validated search param.
- **Data:** creating a todo is optimistic. It gets a temporary ID that is swapped in place on
  success, a failure removes only that item, and the list re-syncs when the last pending
  create for that assignee settles.
- **State:** Jotai holds only the active user, a default that never overrides the page or the
  URL (`resolveAssignee`, unit-tested).
- **Validation:** Zod, because one schema gives types, runtime checks and messages, and TanStack
  Router accepts it for search params. Server field errors come back in the same shape.

## Trade-offs and known gaps

- Changing the filter or the active user remounts the todo form, so a half-typed title is lost.
- No optimistic item while a list is still loading; the todo appears once it's saved.
- The mock repeats some validation rules on purpose, so it behaves like an independent server.
- Not done: a real screen-reader run, arrow keys on native selects, and committed e2e tests
  (the browser checks were scratch scripts).

## Reflection

**Performance**
- Server data stays in TanStack Query; Jotai holds one ID, read only where needed. The user
  page doesn't read it, so changing the active user doesn't re-render that page.
- Loaders start a page's queries in parallel, links preload on hover or focus, pages are lazy
  chunks, and staleTime is 30 s. Startup is still sequential (main chunk → mock API → service
  worker); a real backend removes that.
- With real data I'd measure first (React Profiler, Web Vitals), then paginate or virtualise.

**Testing strategy**
- Unit tests for the tricky logic (optimistic cache, assignee precedence) with hand-resolved
  promises, plus mutation testing to prove those tests can fail.
- Integration tests with `msw/node` and the real handlers: server field errors, loader 404.
- Playwright in CI for the main flows (one keyboard-only pass, axe on each state), contract
  tests against a real API, and a screen-reader pass before releases.

How AI was used: see [`ai-journey/`](./ai-journey/).
