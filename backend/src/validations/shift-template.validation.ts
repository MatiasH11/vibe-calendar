import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm 00-23:00-59

// Helper function to validate that end_time is after start_time
const validateTimeRange = (data: { start_time: string; end_time: string }) => {
  const [startHour, startMin] = data.start_time.split(':').map(Number);
  const [endHour, endMin] = data.end_time.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes > startMinutes;
};

export const create_shift_template_schema = z.object({
  name: z.string()
    .min(1, { message: 'Template name is required' })
    .max(100, { message: 'Template name must be 100 characters or less' })
    .trim(),
  description: z.string()
    .max(500, { message: 'Description must be 500 characters or less' })
    .optional(),
  start_time: z.string()
    .regex(timeRegex, { message: 'start_time must be in HH:mm format' }),
  end_time: z.string()
    .regex(timeRegex, { message: 'end_time must be in HH:mm format' }),
}).refine(validateTimeRange, {
  message: 'End time must be after start time',
  path: ['end_time']
});

export const update_shift_template_schema = z.object({
  name: z.string()
    .min(1, { message: 'Template name is required' })
    .max(100, { message: 'Template name must be 100 characters or less' })
    .trim()
    .optional(),
  description: z.string()
    .max(500, { message: 'Description must be 500 characters or less' })
    .optional(),
  start_time: z.string()
    .regex(timeRegex, { message: 'start_time must be in HH:mm format' })
    .optional(),
  end_time: z.string()
    .regex(timeRegex, { message: 'end_time must be in HH:mm format' })
    .optional(),
}).refine((data) => {
  // Only validate time range if both times are provided
  if (data.start_time && data.end_time) {
    return validateTimeRange({ start_time: data.start_time, end_time: data.end_time });
  }
  return true;
}, {
  message: 'End time must be after start time',
  path: ['end_time']
});

export const get_shift_templates_schema = z.object({
  search: z.string().optional(),
  sort_by: z.enum(['name', 'usage_count', 'created_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
}).transform(data => ({
  search: data.search,
  sort_by: data.sort_by || 'name',
  sort_order: data.sort_order || 'asc',
  page: data.page ? parseInt(data.page) : 1,
  limit: data.limit ? parseInt(data.limit) : 20,
}));

export const shift_template_id_schema = z.object({
  id: z.string().transform(Number).pipe(z.number().int().positive()),
});

export type CreateShiftTemplateBody = z.infer<typeof create_shift_template_schema>;
export type UpdateShiftTemplateBody = z.infer<typeof update_shift_template_schema>;
export type GetShiftTemplatesQuery = z.infer<typeof get_shift_templates_schema>;
export type ShiftTemplateIdParams = z.infer<typeof shift_template_id_schema>;