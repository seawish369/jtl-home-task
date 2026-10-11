import * as z from 'zod';

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  createdAt: z.iso.datetime(),
});

export type User = z.infer<typeof userSchema>;
