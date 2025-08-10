import { z } from 'zod';

export const register_schema = z.object({
  company_name: z.string().min(2),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const login_schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type register_body = z.infer<typeof register_schema>;
export type login_body = z.infer<typeof login_schema>;


