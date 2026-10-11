import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createQueryClient } from '@todo-app/core';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTodo, listTodos } from './api';
import { isOptimisticTodo } from './optimistic';
import { todosQueries } from './queries';
import type { Todo } from './schemas';
import { useCreateTodo } from './use-create-todo';

// The tests are about cache logic, so the API module is mocked and every request is
// resolved or rejected by hand to control the order of events.
vi.mock('./api', () => ({ listTodos: vi.fn(), createTodo: vi.fn() }));
const listTodosMock = vi.mocked(listTodos);
const createTodoMock = vi.mocked(createTodo);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const todo = (id: string, title: string, assigneeId = 'ada'): Todo => ({
  id,
  title,
  assigneeId,
  createdAt: '2026-10-12T10:00:00.000Z',
});
const A = todo('a', 'A');
const G = todo('g', 'G', 'grace');

/** Renders the list(s) being watched (as the page would) plus the create hook. */
function setup(assigneeIds: string[] = ['ada']) {
  const queryClient = createQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => ({
      lists: Object.fromEntries(assigneeIds.map((id) => [id, useQuery(todosQueries.list(id))])),
      create: useCreateTodo(),
    }),
    { wrapper },
  );
  const create = (title: string, assigneeId = 'ada') => {
    // The form catches the rejection; do the same so a failure isn't unhandled.
    act(() => void result.current.create.mutateAsync({ title, assigneeId }).catch(() => undefined));
  };
  const items = (assigneeId = 'ada') =>
    (result.current.lists[assigneeId]?.data ?? []).map((t) => (isOptimisticTodo(t) ? `${t.title} (pending)` : t.title));
  const listCalls = (assigneeId = 'ada') => listTodosMock.mock.calls.filter(([id]) => id === assigneeId).length;
  return { result, create, items, listCalls };
}

/** Lets pending promise callbacks run, to prove something did NOT happen. */
const flush = () => act(async () => await new Promise((r) => setTimeout(r, 20)));

beforeEach(() => {
  listTodosMock.mockReset();
  createTodoMock.mockReset();
});

describe('useCreateTodo (optimistic create)', () => {
  it('shows the item immediately and rolls it back when the create fails', async () => {
    listTodosMock.mockResolvedValueOnce([A]);
    const { create, items, listCalls } = setup();
    await waitFor(() => expect(items()).toEqual(['A']));

    const request = deferred<Todo>();
    createTodoMock.mockReturnValueOnce(request.promise);
    create('X');
    await waitFor(() => expect(items()).toEqual(['A', 'X (pending)']));

    listTodosMock.mockResolvedValueOnce([A]);
    await act(async () => request.reject(new Error('boom')));
    await waitFor(() => expect(items()).toEqual(['A']));
    await waitFor(() => expect(listCalls()).toBe(2)); // re-synced once after settling
  });

  it('keeps the other item when one of two quick creates fails, and refetches only after the last', async () => {
    listTodosMock.mockResolvedValueOnce([A]);
    const { result, create, items, listCalls } = setup();
    await waitFor(() => expect(items()).toEqual(['A']));

    const first = deferred<Todo>();
    const second = deferred<Todo>();
    createTodoMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    create('X');
    create('Y');
    await waitFor(() => expect(items()).toEqual(['A', 'X (pending)', 'Y (pending)']));

    await act(async () => first.reject(new Error('boom')));
    await waitFor(() => expect(items()).toEqual(['A', 'Y (pending)']));
    await flush();
    expect(listCalls()).toBe(1); // no refetch while Y is still pending

    const refetch = deferred<Todo[]>();
    listTodosMock.mockReturnValueOnce(refetch.promise);
    const savedY = todo('y', 'Y');
    await act(async () => second.resolve(savedY));
    // Swapped in place before the refetch answers: same position, real ID.
    await waitFor(() => expect(result.current.lists.ada?.data?.map((t) => t.id)).toEqual(['a', 'y']));
    expect(listCalls()).toBe(2);

    await act(async () => refetch.resolve([A, savedY]));
    await waitFor(() => expect(items()).toEqual(['A', 'Y']));
    expect(listCalls()).toBe(2);
  });

  it('refetches each assignee when their own last create settles, even if another assignee has one pending', async () => {
    listTodosMock.mockImplementation(async (assigneeId) => (assigneeId === 'ada' ? [A] : [G]));
    const { create, items, listCalls } = setup(['ada', 'grace']);
    await waitFor(() => expect(items('ada')).toEqual(['A']));
    await waitFor(() => expect(items('grace')).toEqual(['G']));

    const forAda = deferred<Todo>();
    const forGrace = deferred<Todo>();
    createTodoMock.mockReturnValueOnce(forAda.promise).mockReturnValueOnce(forGrace.promise);
    create('X', 'ada');
    create('Y', 'grace');

    await act(async () => forAda.resolve(todo('x', 'X')));
    await waitFor(() => expect(listCalls('ada')).toBe(2)); // ada re-synced although grace's create is pending
    expect(listCalls('grace')).toBe(1);

    await act(async () => forGrace.resolve(todo('y', 'Y', 'grace')));
    await waitFor(() => expect(listCalls('grace')).toBe(2));
  });

  it('does not cancel or overwrite the first load when creating before the list has loaded', async () => {
    const firstLoad = deferred<Todo[]>();
    let firstLoadSignal: AbortSignal | undefined;
    listTodosMock.mockImplementationOnce((_id, signal) => {
      firstLoadSignal = signal;
      return firstLoad.promise;
    });
    const { result, create, items, listCalls } = setup();
    await waitFor(() => expect(result.current.lists.ada?.fetchStatus).toBe('fetching'));

    const request = deferred<Todo>();
    createTodoMock.mockReturnValueOnce(request.promise);
    create('X');
    await flush();
    expect(result.current.lists.ada?.data).toBeUndefined(); // nothing written to the unloaded list

    const savedX = todo('x', 'X');
    await act(async () => request.resolve(savedX));
    await flush();
    expect(listCalls()).toBe(1); // the re-sync joined the running first load
    expect(firstLoadSignal?.aborted).toBe(false);

    // The first load started before X was saved, so it doesn't include it; the re-sync does.
    listTodosMock.mockResolvedValueOnce([A, savedX]);
    await act(async () => firstLoad.resolve([A]));
    await waitFor(() => expect(items()).toEqual(['A', 'X']));
    expect(listCalls()).toBe(2);
    expect(firstLoadSignal?.aborted).toBe(false);
  });

  it('keeps a pending item when a refetch finishes during the create', async () => {
    listTodosMock.mockResolvedValueOnce([A]);
    const { result, create, items } = setup();
    await waitFor(() => expect(items()).toEqual(['A']));

    const request = deferred<Todo>();
    createTodoMock.mockReturnValueOnce(request.promise);
    create('X');
    await waitFor(() => expect(items()).toEqual(['A', 'X (pending)']));

    // e.g. window focus: the server doesn't have X yet.
    listTodosMock.mockResolvedValueOnce([A]);
    await act(async () => void (await result.current.lists.ada?.refetch()));
    await flush(); // query notifications arrive on a later tick; read the settled render
    expect(listTodosMock).toHaveBeenCalledTimes(2);
    expect(items()).toEqual(['A', 'X (pending)']);

    listTodosMock.mockResolvedValueOnce([A, todo('x', 'X')]);
    await act(async () => request.resolve(todo('x', 'X')));
    await waitFor(() => expect(items()).toEqual(['A', 'X']));
  });

  it('does not duplicate the item when a refetch already brought the saved one', async () => {
    listTodosMock.mockResolvedValueOnce([A]);
    const { result, create, items } = setup();
    await waitFor(() => expect(items()).toEqual(['A']));

    const request = deferred<Todo>();
    createTodoMock.mockReturnValueOnce(request.promise);
    create('X');
    await waitFor(() => expect(items()).toEqual(['A', 'X (pending)']));

    // The server saved X and a refetch returned it before the create response arrived.
    const savedX = todo('x', 'X');
    listTodosMock.mockResolvedValueOnce([A, savedX]);
    await act(async () => void (await result.current.lists.ada?.refetch()));
    await flush();

    // Hold the re-sync refetch, so we see the list right after the swap.
    const resync = deferred<Todo[]>();
    listTodosMock.mockReturnValueOnce(resync.promise);
    await act(async () => request.resolve(savedX));
    await waitFor(() => expect(result.current.lists.ada?.data?.map((t) => t.id)).toEqual(['a', 'x']));
    expect(listTodosMock).toHaveBeenCalledTimes(3); // the re-sync is in flight, not answered yet

    await act(async () => resync.resolve([A, savedX]));
    await flush();
    expect(result.current.lists.ada?.data?.map((t) => t.id)).toEqual(['a', 'x']);
  });
});
