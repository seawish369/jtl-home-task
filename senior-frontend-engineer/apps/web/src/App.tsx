import { Button } from '@todo-app/ui';

// Placeholder page for the scaffold step; replaced by the router in step 3.
export function App() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Todo app</h1>
      <p className="mt-2 text-slate-600">Monorepo scaffold: this button comes from @todo-app/ui.</p>
      <div className="mt-6">
        <Button>Button from @todo-app/ui</Button>
      </div>
    </main>
  );
}
