import * as z from 'zod';

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  createdAt: z.iso.datetime(),
});

export type User = z.infer<typeof userSchema>;

// Checks run in order and the form shows the first failing message.
// Uniqueness can only be checked by the server (409 -> fieldErrors.username).
export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, 'Enter a username.')
    .min(3, 'Username must be 3–20 characters.')
    .max(20, 'Username must be 3–20 characters.')
    .regex(/^[A-Za-z0-9]+$/, 'Username can only contain letters and numbers.'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
