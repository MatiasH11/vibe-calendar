import { z } from 'zod';

export const create_role_schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
});

export type CreateRoleBody = z.infer<typeof create_role_schema>;


