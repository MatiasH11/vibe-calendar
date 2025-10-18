/**
 * Audit Validation Schemas
 * Reference: PLAN.md Section 2.3
 *
 * Zod schemas for validating audit query endpoints
 */

import { z } from 'zod';
import { audit_action } from '@prisma/client';

/**
 * Schema for querying audit logs with filters
 * GET /api/v1/audit
 */
export const audit_query_schema = z.object({
  user_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),

  action: z
    .enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT'])
    .optional(),

  entity_type: z
    .string()
    .min(1)
    .max(50)
    .optional(),

  entity_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),

  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
    .optional(),

  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
    .optional(),

  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10)),

  limit: z
    .string()
    .optional()
    .default('50')
    .transform((val) => Math.min(parseInt(val, 10), 100)), // Max 100 per page
});

export type AuditQueryParams = z.infer<typeof audit_query_schema>;

/**
 * Schema for entity history endpoint
 * GET /api/v1/audit/entity/:type/:id
 */
export const entity_history_params_schema = z.object({
  type: z
    .string()
    .min(1)
    .max(50)
    .refine((val) => /^[a-z_]+$/.test(val), {
      message: 'Entity type must be lowercase with underscores only',
    }),

  id: z
    .string()
    .regex(/^\d+$/, 'ID must be a number')
    .transform((val) => parseInt(val, 10)),
});

export type EntityHistoryParams = z.infer<typeof entity_history_params_schema>;

/**
 * Schema for audit statistics query
 * GET /api/v1/audit/statistics
 */
export const audit_statistics_query_schema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
    .optional(),

  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
    .optional(),
});

export type AuditStatisticsQuery = z.infer<typeof audit_statistics_query_schema>;
