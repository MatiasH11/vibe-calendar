import { z } from 'zod';

export const add_employee_schema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  role_id: z.number().int(),
  position: z.string().optional(),
});

export type AddEmployeeBody = z.infer<typeof add_employee_schema>;


