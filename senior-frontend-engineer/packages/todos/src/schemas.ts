import * as z from 'zod';

export const todoSchema = z.object({
  id: z.string(),
  title: z.string(),
  assigneeId: z.string(),
  createdAt: z.iso.datetime(),
});

export type Todo = z.infer<typeof todoSchema>;

// Whether the assignee exists is checked by the server (422 -> fieldErrors.assigneeId);
// this package only knows assignee IDs.
export const createTodoSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title.').max(120, 'Title must be 120 characters or fewer.'),
  assigneeId: z.string().min(1, 'Choose an assignee.'),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

/** What the app passes in to fill the assignee picker. */
export type AssigneeOption = { id: string; label: string };
