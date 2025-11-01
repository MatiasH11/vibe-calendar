import { prisma } from '../config/prisma_client';
import {
  create_shift_template_body,
  update_shift_template_body,
  shift_template_filters,
  bulk_create_shift_template_body,
  bulk_update_shift_template_body,
  bulk_delete_shift_template_body,
} from '../validations/shift_template.validation';
import {
  ResourceNotFoundError,
  UnauthorizedCompanyAccessError,
  TransactionFailedError,
} from '../errors';
import {
  parseUTCTime,
  formatTimeToUTC,
  isValidTimeRange,
} from '../utils/time.utils';

/**
 * Format shift template times from PostgreSQL Date objects to UTC strings
 *
 * Converts PostgreSQL Time fields (stored as Date) to HH:mm format for API responses.
 *
 * @param template - Shift template with Date time fields
 * @returns Template with formatted time strings
 */
function formatShiftTemplateTimes(template: any) {
  return {
    ...template,
    start_time: formatTimeToUTC(template.start_time),
    end_time: formatTimeToUTC(template.end_time),
  };
}

export const shift_template_service = {
  /**
   * Get all shift_templates with pagination and filters
   */
  async getAll(company_id: number, filters: shift_template_filters) {
    const page = parseInt(filters.page || '1');
    const limit = Math.min(parseInt(filters.limit || '50'), 100);
    const skip = (page - 1) * limit;

    const where: any = {
      company_id,
      deleted_at: null,
    };

    // Add search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Add is_active filter
    if (filters.is_active) {
      where.is_active = filters.is_active === 'true';
    }

    // Get total count and items
    const [total, items] = await Promise.all([
      prisma.shift_template.count({ where }),
      prisma.shift_template.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [filters.sort_by || 'created_at']: filters.sort_order || 'desc',
        },
      }),
    ]);

    // Format times from PostgreSQL Date objects to UTC strings
    const formattedItems = items.map(formatShiftTemplateTimes);

    return {
      success: true,
      data: {
        items: formattedItems,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
    };
  },

  /**
   * Get shift_template by ID
   */
  async getById(id: number, company_id: number) {
    const shift_template = await prisma.shift_template.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!shift_template) {
      throw new ResourceNotFoundError('shift_template', id);
    }

    // Format times from PostgreSQL Date objects to UTC strings
    const formattedTemplate = formatShiftTemplateTimes(shift_template);

    return { success: true, data: formattedTemplate };
  },

  /**
   * Create new shift_template
   */
  async create(data: create_shift_template_body, company_id: number, user_id: number) {
    // Validate time range
    if (!isValidTimeRange(data.start_time, data.end_time)) {
      throw new Error('Invalid time range: start_time and end_time must be different valid UTC times');
    }

    // Parse UTC time strings to Date objects for PostgreSQL Time storage
    const startTime = parseUTCTime(data.start_time);
    const endTime = parseUTCTime(data.end_time);

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create shift_template with parsed time Date objects
        const shift_template = await tx.shift_template.create({
          data: {
            ...data,
            start_time: startTime,
            end_time: endTime,
            company_id,
          },
        });

        // Create audit log (store times as UTC strings in audit)
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'CREATE',
            entity_type: 'shift_template',
            entity_id: shift_template.id,
            new_values: data, // Original data with UTC strings
          },
        });

        return shift_template;
      });

      // Format times from PostgreSQL Date objects back to UTC strings for response
      const formattedResult = formatShiftTemplateTimes(result);

      return { success: true, data: formattedResult };
    } catch (e) {
      console.error('Create shift_template transaction failed:', e);
      throw new TransactionFailedError('shift_template creation');
    }
  },

  /**
   * Update shift_template
   */
  async update(
    id: number,
    data: update_shift_template_body,
    company_id: number,
    user_id: number
  ) {
    // Verify shift_template exists and belongs to company
    const existing = await prisma.shift_template.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('shift_template', id);
    }

    // Validate time range if both times are provided
    if (data.start_time && data.end_time) {
      if (!isValidTimeRange(data.start_time, data.end_time)) {
        throw new Error('Invalid time range: start_time and end_time must be different valid UTC times');
      }
    }

    // Parse time strings to Date objects if provided
    const updateData: any = { ...data };
    if (data.start_time) {
      updateData.start_time = parseUTCTime(data.start_time);
    }
    if (data.end_time) {
      updateData.end_time = parseUTCTime(data.end_time);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update shift_template with parsed times
        const updated = await tx.shift_template.update({
          where: { id },
          data: updateData,
        });

        // Create audit log (store original times as UTC strings)
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'shift_template',
            entity_id: id,
            old_values: formatShiftTemplateTimes(existing), // Format for audit
            new_values: data, // Original data with UTC strings
          },
        });

        return updated;
      });

      // Format times from PostgreSQL Date objects back to UTC strings for response
      const formattedResult = formatShiftTemplateTimes(result);

      return { success: true, data: formattedResult };
    } catch (e) {
      console.error('Update shift_template transaction failed:', e);
      throw new TransactionFailedError('shift_template update');
    }
  },

  /**
   * Delete shift_template (soft delete)
   */
  async delete(id: number, company_id: number, user_id: number) {
    // Verify shift_template exists and belongs to company
    const existing = await prisma.shift_template.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('shift_template', id);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Soft delete shift_template
        await tx.shift_template.update({
          where: { id },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'DELETE',
            entity_type: 'shift_template',
            entity_id: id,
            old_values: existing,
          },
        });
      });

      return { success: true, message: 'shift_template deleted successfully' };
    } catch (e) {
      console.error('Delete shift_template transaction failed:', e);
      throw new TransactionFailedError('shift_template deletion');
    }
  },

  /**
   * Bulk create shift_templates
   */
  async bulkCreate(data: bulk_create_shift_template_body, company_id: number, user_id: number) {
    // Validate all time ranges
    for (const item of data.items) {
      if (!isValidTimeRange(item.start_time, item.end_time)) {
        throw new Error(`Invalid time range in item: start_time="${item.start_time}", end_time="${item.end_time}"`);
      }
    }

    try {
      const results = await prisma.$transaction(async (tx) => {
        // Parse time strings to Date objects for each item
        const parsedItems = data.items.map((item) => ({
          ...item,
          start_time: parseUTCTime(item.start_time),
          end_time: parseUTCTime(item.end_time),
          company_id,
        }));

        const created = await tx.shift_template.createMany({
          data: parsedItems,
        });

        // Create audit logs
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_CREATE',
            entity_type: 'shift_template',
            entity_id: 0, // Bulk operation
            new_values: { count: created.count, items: data.items }, // Store original with UTC strings
          },
        });

        return created;
      });

      return {
        success: true,
        data: {
          created: results.count,
          total: data.items.length,
        },
      };
    } catch (e) {
      console.error('Bulk create shift_template transaction failed:', e);
      throw new TransactionFailedError('Bulk shift_template creation');
    }
  },

  /**
   * Bulk update shift_templates
   */
  async bulkUpdate(
    data: bulk_update_shift_template_body,
    company_id: number,
    user_id: number
  ) {
    // Validate time range if both times are provided
    if (data.data.start_time && data.data.end_time) {
      if (!isValidTimeRange(data.data.start_time, data.data.end_time)) {
        throw new Error('Invalid time range: start_time and end_time must be different valid UTC times');
      }
    }

    // Parse time strings to Date objects if provided
    const updateData: any = { ...data.data };
    if (data.data.start_time) {
      updateData.start_time = parseUTCTime(data.data.start_time);
    }
    if (data.data.end_time) {
      updateData.end_time = parseUTCTime(data.data.end_time);
    }

    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all shift_templates belong to company
        const existing = await tx.shift_template.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some shift_templates not found or do not belong to company');
        }

        // Update all shift_templates with parsed times
        const updated = await tx.shift_template.updateMany({
          where: { id: { in: data.ids } },
          data: updateData,
        });

        // Create audit log (store original times as UTC strings)
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_UPDATE',
            entity_type: 'shift_template',
            entity_id: 0, // Bulk operation
            new_values: { ids: data.ids, count: updated.count, data: data.data }, // Original with UTC strings
          },
        });

        return updated;
      });

      return {
        success: true,
        data: {
          updated: results.count,
          total: data.ids.length,
        },
      };
    } catch (e) {
      console.error('Bulk update shift_template transaction failed:', e);
      throw new TransactionFailedError('Bulk shift_template update');
    }
  },

  /**
   * Bulk delete shift_templates
   */
  async bulkDelete(
    data: bulk_delete_shift_template_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all shift_templates belong to company
        const existing = await tx.shift_template.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some shift_templates not found or do not belong to company');
        }

        // Soft delete all shift_templates
        const deleted = await tx.shift_template.updateMany({
          where: { id: { in: data.ids } },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_DELETE',
            entity_type: 'shift_template',
            entity_id: 0, // Bulk operation
            old_values: { ids: data.ids, count: deleted.count },
          },
        });

        return deleted;
      });

      return {
        success: true,
        data: {
          deleted: results.count,
          total: data.ids.length,
        },
      };
    } catch (e) {
      console.error('Bulk delete shift_template transaction failed:', e);
      throw new TransactionFailedError('Bulk shift_template deletion');
    }
  },


  /**
   * Apply scheduling_template to create shift requirements for a scheduling_batch
   */
  async applyToSchedulingBatch(
    batch_id: number,
    template_id: number,
    company_id: number,
    user_id: number
  ) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const batch = await tx.scheduling_batch.findFirst({
          where: { id: batch_id, company_id, deleted_at: null },
        });

        if (!batch) {
          throw new ResourceNotFoundError('Scheduling Batch', batch_id);
        }

        const template = await tx.scheduling_template.findFirst({
          where: { id: template_id, company_id, deleted_at: null },
        });

        if (!template) {
          throw new ResourceNotFoundError('Scheduling Template', template_id);
        }

        if (!template.days_pattern || typeof template.days_pattern !== 'object') {
          throw new Error('Invalid days_pattern in scheduling_template');
        }

        const startDate = new Date(batch.start_date);
        const endDate = new Date(batch.end_date);
        const dates: Date[] = [];

        for (let current = new Date(startDate); current <= endDate; current.setDate(current.getDate() + 1)) {
          dates.push(new Date(current));
        }

        if (dates.length === 0) {
          throw new Error('Invalid batch date range');
        }

        const createdRequirements: any[] = [];

        for (const date of dates) {
          const dayOfWeek = date.getDay().toString();
          const dayPattern = (template.days_pattern as Record<string, any>)[dayOfWeek];

          if (!dayPattern || !Array.isArray(dayPattern)) {
            continue;
          }

          for (const shiftDef of dayPattern) {
            const requirement = await tx.shift_requirement.create({
              data: {
                company_id,
                location_id: batch.location_id,
                department_id: shiftDef.department_id,
                batch_id,
                shift_date: date,
                start_time: parseUTCTime(shiftDef.start_time),
                end_time: parseUTCTime(shiftDef.end_time),
                status: 'open',
                notes: `Created from template: ${template.name}`,
              },
            });

            if (shiftDef.positions && Array.isArray(shiftDef.positions)) {
              for (const position of shiftDef.positions) {
                await tx.shift_requirement_position.create({
                  data: {
                    requirement_id: requirement.id,
                    job_position_id: position.id,
                    required_count: position.count || 1,
                    filled_count: 0,
                  },
                });
              }
            }

            createdRequirements.push(requirement);
          }
        }

        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'CREATE',
            entity_type: 'scheduling_batch_requirements',
            entity_id: batch_id,
            new_values: {
              batch_id,
              template_id,
              created_requirements: createdRequirements.length,
            },
          },
        });

        return {
          created_requirements: createdRequirements.length,
          requirements: createdRequirements,
        };
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Apply template to batch transaction failed:', e);
      if (e instanceof ResourceNotFoundError) {
        throw e;
      }
      throw new TransactionFailedError('Apply scheduling template to batch');
    }
  },
};
