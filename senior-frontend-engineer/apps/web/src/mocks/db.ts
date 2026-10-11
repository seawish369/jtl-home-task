// In-memory database for the mock API, persisted to localStorage so data survives
// a reload. Clear the key below (or site data) to get the seed data back.
const STORAGE_KEY = 'todo-app:mock-db:v1';

export type DbUser = { id: string; username: string; createdAt: string };
export type DbTodo = { id: string; title: string; assigneeId: string; createdAt: string };
type Db = { users: DbUser[]; todos: DbTodo[] };

function seed(): Db {
  const now = Date.now();
  const at = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();
  const users: DbUser[] = [
    { id: crypto.randomUUID(), username: 'ada', createdAt: at(300) },
    { id: crypto.randomUUID(), username: 'grace', createdAt: at(200) },
    { id: crypto.randomUUID(), username: 'linus', createdAt: at(100) },
  ];
  const [ada, grace] = users as [DbUser, DbUser, DbUser];
  const todos: DbTodo[] = [
    { id: crypto.randomUUID(), title: 'Write the analytical engine notes', assigneeId: ada.id, createdAt: at(90) },
    { id: crypto.randomUUID(), title: 'Review the compiler draft', assigneeId: ada.id, createdAt: at(60) },
    { id: crypto.randomUUID(), title: 'Find the moth in the relay', assigneeId: grace.id, createdAt: at(30) },
  ];
  return { users, todos };
}

function load(): Db {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Db>;
      if (Array.isArray(parsed.users) && Array.isArray(parsed.todos)) {
        return { users: parsed.users, todos: parsed.todos };
      }
    }
  } catch {
    // Unreadable or blocked storage: fall back to the seed data.
  }
  // Save the seed right away: its IDs are random, so without this every reload
  // before the first write would invent new IDs and break bookmarked URLs.
  const seeded = seed();
  save(seeded);
  return seeded;
}

function save(data: Db): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked: keep working in memory.
  }
}

export const db = load();

export function persist(): void {
  save(db);
}
