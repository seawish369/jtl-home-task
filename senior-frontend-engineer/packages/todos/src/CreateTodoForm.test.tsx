import { QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApiError, createQueryClient } from '@todo-app/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTodo } from './api';
import { CreateTodoForm } from './CreateTodoForm';
import type { Todo } from './schemas';

vi.mock('./api', () => ({ listTodos: vi.fn(), createTodo: vi.fn() }));
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

const serverError = () => new ApiError({ kind: 'http', status: 500, message: 'The server failed to save the todo.' });
const saved = (title: string): Todo => ({ id: `id-${title}`, title, assigneeId: 'ada', createdAt: '2026-10-12T10:00:00.000Z' });

function renderForm() {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <CreateTodoForm assigneeOptions={[{ id: 'ada', label: 'ada' }]} defaultAssigneeId="ada" />
    </QueryClientProvider>,
  );
  const title = screen.getByLabelText('Title') as HTMLInputElement;
  const submit = (value: string) => {
    fireEvent.change(title, { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Add todo' }));
  };
  const alertItems = () => {
    const alert = screen.queryByRole('alert');
    return alert ? [...alert.querySelectorAll('li')].map((li) => li.textContent) : null;
  };
  return { title, submit, alertItems };
}

beforeEach(() => createTodoMock.mockReset());

describe('CreateTodoForm failure list', () => {
  it('keeps a failure that arrives while a later submission is still in flight', async () => {
    const first = deferred<Todo>();
    const second = deferred<Todo>();
    createTodoMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { title, submit, alertItems } = renderForm();

    submit('please fail');
    submit('Second ok'); // submitted before the first failure is on screen

    await act(async () => first.reject(serverError()));
    await waitFor(() => expect(alertItems()).toEqual(['“please fail”: The server failed to save the todo.']));
    expect(title.value).toBe('please fail'); // the form was empty, so the title came back

    await act(async () => second.resolve(saved('Second ok')));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Added “Second ok” for ada.'));
    // "Second ok" was submitted before the failure appeared, so it must not clear it.
    expect(alertItems()).toEqual(['“please fail”: The server failed to save the todo.']);
    expect(title.value).toBe('please fail');
  });

  it('clears failures that were on screen when a later submission succeeds', async () => {
    createTodoMock.mockRejectedValueOnce(serverError());
    const { submit, alertItems } = renderForm();

    submit('please fail');
    await waitFor(() => expect(alertItems()).toEqual(['“please fail”: The server failed to save the todo.']));

    const next = deferred<Todo>();
    createTodoMock.mockReturnValueOnce(next.promise);
    submit('Fixed it');
    expect(alertItems()).not.toBeNull(); // still shown while saving
    await act(async () => next.resolve(saved('Fixed it')));
    await waitFor(() => expect(alertItems()).toBeNull());
  });
});

describe('CreateTodoForm assignee preselection', () => {
  it('does not preselect an assignee that is not an option (e.g. ?assigneeId=bogus)', async () => {
    render(
      <QueryClientProvider client={createQueryClient()}>
        <CreateTodoForm assigneeOptions={[{ id: 'ada', label: 'ada' }]} defaultAssigneeId="bogus" />
      </QueryClientProvider>,
    );
    const assignee = screen.getByLabelText('Assignee') as HTMLSelectElement;
    expect(assignee.value).toBe('');

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Something' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add todo' }));
    await waitFor(() => expect(screen.getByText('Choose an assignee.')).toBeTruthy());
    expect(createTodoMock).not.toHaveBeenCalled();
  });
});
