import { delay, http, HttpResponse } from 'msw';
import { db, persist, type DbTodo, type DbUser } from './db';

// The mock is the "server": it applies its own validation rules instead of
// importing the client's schemas, so client-side validation can't hide gaps.
// Error bodies follow the contract in @todo-app/core: { message, fieldErrors? }.

const USERNAME_PATTERN = /^[A-Za-z0-9]+$/;
const TODO_CREATE_DELAY_MS = 1500; // long enough to see and test the optimistic state

function latency() {
  return delay(400 + Math.random() * 400);
}

function errorResponse(status: number, message: string, fieldErrors?: Record<string, string>) {
  return HttpResponse.json({ message, fieldErrors }, { status });
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const asTrimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

function validateUsername(username: string): string | undefined {
  if (username === '') return 'Enter a username.';
  if (username.length < 3 || username.length > 20) return 'Username must be 3–20 characters.';
  if (!USERNAME_PATTERN.test(username)) return 'Username can only contain letters and numbers.';
  return undefined;
}

function validateTitle(title: string): string | undefined {
  if (title === '') return 'Enter a title.';
  if (title.length > 120) return 'Title must be 120 characters or fewer.';
  return undefined;
}

const findUser = (id: string) => db.users.find((user) => user.id === id);

export const handlers = [
  http.get('/api/users', async () => {
    await latency();
    return HttpResponse.json(db.users);
  }),

  http.get('/api/users/:userId', async ({ params }) => {
    await latency();
    const user = findUser(String(params.userId));
    if (!user) return errorResponse(404, 'User not found.');
    return HttpResponse.json(user);
  }),

  http.post('/api/users', async ({ request }) => {
    await latency();
    const username = asTrimmedString((await readBody(request)).username);

    const invalid = validateUsername(username);
    if (invalid) return errorResponse(422, 'The user could not be created.', { username: invalid });

    const taken = db.users.some((user) => user.username.toLowerCase() === username.toLowerCase());
    if (taken) return errorResponse(409, 'The user could not be created.', { username: 'That username is already taken.' });

    const user: DbUser = { id: crypto.randomUUID(), username, createdAt: new Date().toISOString() };
    db.users.push(user);
    persist();
    return HttpResponse.json(user, { status: 201 });
  }),

  http.get('/api/todos', async ({ request }) => {
    await latency();
    const assigneeId = new URL(request.url).searchParams.get('assigneeId');
    if (!assigneeId) return errorResponse(400, 'The assigneeId query parameter is required.');
    if (!findUser(assigneeId)) return errorResponse(404, 'User not found.');
    return HttpResponse.json(db.todos.filter((todo) => todo.assigneeId === assigneeId));
  }),

  http.post('/api/todos', async ({ request }) => {
    await delay(TODO_CREATE_DELAY_MS);
    const body = await readBody(request);
    const title = asTrimmedString(body.title);
    const assigneeId = asTrimmedString(body.assigneeId);

    const fieldErrors: Record<string, string> = {};
    const invalidTitle = validateTitle(title);
    if (invalidTitle) fieldErrors.title = invalidTitle;
    if (!findUser(assigneeId)) fieldErrors.assigneeId = 'Choose an existing user.';
    if (Object.keys(fieldErrors).length > 0) {
      return errorResponse(422, 'The todo could not be created.', fieldErrors);
    }

    // Demo hook for the optimistic rollback (step 6).
    if (title.toLowerCase().includes('fail')) {
      return errorResponse(500, 'The server failed to save the todo. Please try again.');
    }

    const todo: DbTodo = { id: crypto.randomUUID(), title, assigneeId, createdAt: new Date().toISOString() };
    db.todos.push(todo);
    persist();
    return HttpResponse.json(todo, { status: 201 });
  }),
];
