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

// Duplication schemas
export const duplicate_shift_schema = z.object({
  source_shift_ids: z.array(z.number().int()).min(1).max(50),
  target_dates: z.array(z.string().min(1)).optional(),
  target_employee_ids: z.array(z.number().int()).optional(),
  preserve_employee: z.boolean().default(false),
  preserve_date: z.boolean().default(false),
  conflict_resolution: z.enum(['skip', 'overwrite', 'fail']).default('fail'),
  notes_suffix: z.string().optional(),
}).refine(
  (data) => data.target_dates || data.target_employee_ids,
  { message: "Either target_dates or target_employee_ids must be provided" }
).refine(
  (data) => !(data.preserve_employee && data.target_employee_ids),
  { message: "Cannot specify target_employee_ids when preserve_employee is true" }
).refine(
  (data) => !(data.preserve_date && data.target_dates),
  { message: "Cannot specify target_dates when preserve_date is true" }
);

// Bulk creation schemas
export const bulk_create_shifts_schema = z.object({
  employee_ids: z.array(z.number().int()).min(1).max(50),
  dates: z.array(z.string().min(1)).min(1).max(31),
  start_time: z.string().regex(timeRegex, { message: 'start_time must be HH:mm' }),
  end_time: z.string().regex(timeRegex, { message: 'end_time must be HH:mm' }),
  notes: z.string().optional(),
  template_id: z.number().int().optional(),
  conflict_resolution: z.enum(['skip', 'overwrite', 'fail']).default('fail'),
  preview_only: z.boolean().default(false),
});

// Conflict validation schema
export const validate_conflicts_schema = z.object({
  shifts: z.array(z.object({
    company_employee_id: z.number().int(),
    shift_date: z.string().min(1),
    start_time: z.string().regex(timeRegex, { message: 'start_time must be HH:mm' }),
    end_time: z.string().regex(timeRegex, { message: 'end_time must be HH:mm' }),
  })).min(1).max(100),
});

// Pattern and suggestions schemas
export const get_employee_patterns_schema = z.object({
  employee_id: z.string().transform(val => parseInt(val, 10)),
  limit: z.string().transform(val => parseInt(val, 10)).optional().default('10'),
});

export const get_suggestions_schema = z.object({
  employee_id: z.string().transform(val => parseInt(val, 10)),
  date: z.string().min(1).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).optional().default('5'),
});

export type create_shift_body = z.infer<typeof create_shift_schema>;
export type update_shift_body = z.infer<typeof update_shift_schema>;
export type get_shifts_query = z.infer<typeof get_shifts_schema>;
export type duplicate_shift_body = z.infer<typeof duplicate_shift_schema>;
export type bulk_create_shifts_body = z.infer<typeof bulk_create_shifts_schema>;
export type validate_conflicts_body = z.infer<typeof validate_conflicts_schema>;
export type get_employee_patterns_query = z.infer<typeof get_employee_patterns_schema>;
export type get_suggestions_query = z.infer<typeof get_suggestions_schema>;


