import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm 00-23:00-59

export const create_shift_schema = z.object({
  company_employee_id: z.number().int(),
  shift_date: z.string().min(1),
  start_time: z.string().regex(timeRegex, { message: 'start_time must be HH:mm' }),
  end_time: z.string().regex(timeRegex, { message: 'end_time must be HH:mm' }),
  notes: z.string().optional(),
});

export const update_shift_schema = z.object({
  company_employee_id: z.number().int().optional(),
  shift_date: z.string().optional(),
  start_time: z.string().regex(timeRegex, { message: 'start_time must be HH:mm' }).optional(),
  end_time: z.string().regex(timeRegex, { message: 'end_time must be HH:mm' }).optional(),
  notes: z.string().optional(),
});

export const get_shifts_schema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export type create_shift_body = z.infer<typeof create_shift_schema>;
export type update_shift_body = z.infer<typeof update_shift_schema>;
export type get_shifts_query = z.infer<typeof get_shifts_schema>;


