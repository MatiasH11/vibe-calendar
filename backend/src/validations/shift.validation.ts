import { z } from 'zod';

export const create_shift_schema = z.object({
  company_employee_id: z.number(),
  shift_date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  notes: z.string().optional(),
});

export type create_shift_body = z.infer<typeof create_shift_schema>;

export const get_shifts_schema = z.object({
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export type get_shifts_query = z.infer<typeof get_shifts_schema>;

export const update_shift_schema = z.object({
  shift_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  notes: z.string().optional(),
});

export type update_shift_body = z.infer<typeof update_shift_schema>;

export const duplicate_shift_schema = z.object({
  source_shift_ids: z.array(z.number()),
  target_employee_ids: z.array(z.number()).optional(),
  target_dates: z.array(z.string()).optional(),
  preserve_employee: z.boolean().optional(),
  preserve_date: z.boolean().optional(),
  notes_suffix: z.string().optional(),
  conflict_resolution: z.enum(['fail', 'skip', 'overwrite']).default('fail'),
});

export type duplicate_shift_body = z.infer<typeof duplicate_shift_schema>;

export const bulk_create_shifts_schema = z.object({
  employee_ids: z.array(z.number()),
  dates: z.array(z.string()),
  template_id: z.number().optional(),
  start_time: z.string(),
  end_time: z.string(),
  notes: z.string().optional(),
  conflict_resolution: z.enum(['fail', 'skip', 'overwrite']).default('fail'),
  preview_only: z.boolean().optional(),
});

export type bulk_create_shifts_body = z.infer<typeof bulk_create_shifts_schema>;

export const validate_conflicts_schema = z.object({
  shifts: z.array(z.object({
    company_employee_id: z.number(),
    shift_date: z.string(),
    start_time: z.string(),
    end_time: z.string(),
  })),
});

export type validate_conflicts_body = z.infer<typeof validate_conflicts_schema>;

export const get_employee_patterns_schema = z.object({
  employee_id: z.number(),
  limit: z.number().default(10),
});

export type get_employee_patterns_query = z.infer<typeof get_employee_patterns_schema>;

export const get_suggestions_schema = z.object({
  employee_id: z.number(),
  limit: z.number().default(5),
  date: z.string().optional(),
});

export type get_suggestions_query = z.infer<typeof get_suggestions_schema>;

export const bulk_delete_shifts_schema = z.object({
  shift_ids: z.array(z.number().int().positive({ message: "All shift IDs must be positive integers." }))
    .min(1, { message: "At least one shift ID is required." }),
});

export type BulkDeleteShiftsBody = z.infer<typeof bulk_delete_shifts_schema>;