import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  notFound,
  type AnyRouter,
} from '@tanstack/react-router';
import { isNotFoundError } from '@todo-app/core';
import { todosQueries } from '@todo-app/todos';
import { usersQueries } from '@todo-app/users';
import type { createStore } from 'jotai';
import * as z from 'zod';
import { NotFound } from './components/NotFound';
import { RootLayout } from './components/RootLayout';
import { RouteError } from './components/RouteError';
import { RoutePending } from './components/RoutePending';
import { UserNotFound } from './components/UserNotFound';
import { activeUserIdAtom } from './state/active-user';

// The whole route tree lives here so it reads top to bottom in one place.
// Only page components are split out, and each is lazy-loaded (one chunk per page).

type RouterContext = { queryClient: QueryClient; store: ReturnType<typeof createStore> };

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: lazyRouteComponent(() => import('./pages/HomePage'), 'HomePage'),
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  loader: ({ context }) => context.queryClient.ensureQueryData(usersQueries.list()),
  component: lazyRouteComponent(() => import('./pages/UsersPage'), 'UsersPage'),
});

const userDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId',
  loader: async ({ context: { queryClient }, params: { userId } }) => {
    // Start the todos now but don't wait: the list shows its own loading state.
    void queryClient.prefetchQuery(todosQueries.list(userId));
    try {
      // The user and the users list (for the assignee picker) load in parallel.
      await Promise.all([
        queryClient.ensureQueryData(usersQueries.detail(userId)),
        queryClient.ensureQueryData(usersQueries.list()),
      ]);
    } catch (error) {
      // A missing user is a "not found" page, not a crash; anything else goes to RouteError.
      if (isNotFoundError(error)) throw notFound();
      throw error;
    }
  },
  notFoundComponent: UserNotFound,
  component: lazyRouteComponent(() => import('./pages/UserDetailPage'), 'UserDetailPage'),
});

const todosSearchSchema = z.object({
  // A malformed value is dropped rather than failing the route.
  assigneeId: z.string().min(1).optional().catch(undefined),
});

const todosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/todos',
  validateSearch: todosSearchSchema,
  loaderDeps: ({ search }) => ({ assigneeId: search.assigneeId }),
  loader: async ({ context: { queryClient, store }, deps: { assigneeId } }) => {
    // Optimisation only: start the list the page will most likely show (URL, else the
    // active user). The page's own query owns the data; this loader doesn't re-run
    // when the active user changes.
    const likelyAssigneeId = assigneeId ?? store.get(activeUserIdAtom);
    if (likelyAssigneeId) void queryClient.prefetchQuery(todosQueries.list(likelyAssigneeId));
    await queryClient.ensureQueryData(usersQueries.list());
  },
  component: lazyRouteComponent(() => import('./pages/TodosPage'), 'TodosPage'),
});

const routeTree = rootRoute.addChildren([indexRoute, usersRoute, userDetailRoute, todosRoute]);

export function createAppRouter(context: RouterContext) {
  const router = createRouter({
    routeTree,
    context,
    defaultPreload: 'intent',
    // TanStack Query owns caching; let the router call loaders every time.
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: RoutePending,
    defaultErrorComponent: RouteError,
    scrollRestoration: true,
  });
  focusHeadingOnNavigate(router);
  return router;
}

// After a client-side navigation to a new page, move focus to its <h1> so screen
// reader and keyboard users start at the new content. Search-only changes (e.g. a
// filter) keep focus where it is, unless the focused element disappeared in the
// re-render (e.g. Back from ?assigneeId=… remounts the form): then the <h1> too,
// never <body>. The first page load keeps focus where it is.
function focusHeadingOnNavigate(router: AnyRouter) {
  router.subscribe('onRendered', ({ fromLocation, pathChanged }) => {
    if (!fromLocation) return;
    const focusLost = !document.activeElement || document.activeElement === document.body;
    if (!pathChanged && !focusLost) return;
    document.querySelector<HTMLElement>('main h1')?.focus();
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
