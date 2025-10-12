import { prisma } from '../config/prisma_client';
import { backendTemplateCache } from '../cache/template-cache';
import {
  CreateShiftTemplateBody,
  UpdateShiftTemplateBody,
  GetShiftTemplatesQuery
} from '../validations/shift-template.validation';
import { utcTimeToDateTime, dateTimeToUtcTime } from '../utils/time-conversion.utils';

export const shift_template_service = {
  async create(data: CreateShiftTemplateBody, company_id: number, created_by: number) {
    return prisma.$transaction(async (tx) => {
      // Check for name uniqueness within the company
      const existingTemplate = await tx.shift_template.findFirst({
        where: {
          company_id,
          name: data.name,
          deleted_at: null,
        },
      });

      if (existingTemplate) {
        throw new Error('DUPLICATE_TEMPLATE_NAME');
      }

      // Create the template
      const template = await tx.shift_template.create({
        data: {
          company_id,
          name: data.name,
          description: data.description,
          start_time: utcTimeToDateTime(data.start_time),
          end_time: utcTimeToDateTime(data.end_time),
          created_by,
        },
      });

      // Invalidate cache
      backendTemplateCache.invalidateTemplates(company_id);

      return {
        ...template,
        start_time: dateTimeToUtcTime(template.start_time as Date),
        end_time: dateTimeToUtcTime(template.end_time as Date),
      };
    });
  },

  async findByCompany(query: GetShiftTemplatesQuery, company_id: number) {
    // Try cache first
    const cacheKey = { query, company_id };
    const cached = backendTemplateCache.getTemplates(company_id, cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = {
      company_id,
      deleted_at: null,
    };

    // Add search filter if provided
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const skip = (query.page - 1) * query.limit;

    // Build order by clause
    const orderBy: any = {};
    orderBy[query.sort_by] = query.sort_order;

    const [templates, total] = await Promise.all([
      prisma.shift_template.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
        include: {
          created_by_user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      }),
      prisma.shift_template.count({ where }),
    ]);

    // Convert time fields to UTC format for frontend
    const formattedTemplates = templates.map(template => ({
      ...template,
      start_time: dateTimeToUtcTime(template.start_time as Date),
      end_time: dateTimeToUtcTime(template.end_time as Date),
    }));

    const result = {
      templates: formattedTemplates,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };

    // Cache the result
    backendTemplateCache.setTemplates(company_id, result, cacheKey);

    return result;
  },

  async findById(template_id: number, company_id: number) {
    const template = await prisma.shift_template.findFirst({
      where: {
        id: template_id,
        company_id,
        deleted_at: null,
      },
      include: {
        created_by_user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!template) {
      throw new Error('TEMPLATE_NOT_FOUND');
    }

    return {
      ...template,
      start_time: dateTimeToUtcTime(template.start_time as Date),
      end_time: dateTimeToUtcTime(template.end_time as Date),
    };
  },

  async update(template_id: number, data: UpdateShiftTemplateBody, company_id: number) {
    return prisma.$transaction(async (tx) => {
      // Verify template exists and belongs to company
      const existingTemplate = await tx.shift_template.findFirst({
        where: {
          id: template_id,
          company_id,
          deleted_at: null,
        },
      });

      if (!existingTemplate) {
        throw new Error('TEMPLATE_NOT_FOUND');
      }

      // Check for name uniqueness if name is being updated
      if (data.name && data.name !== existingTemplate.name) {
        const duplicateTemplate = await tx.shift_template.findFirst({
          where: {
            company_id,
            name: data.name,
            deleted_at: null,
            NOT: { id: template_id },
          },
        });

        if (duplicateTemplate) {
          throw new Error('DUPLICATE_TEMPLATE_NAME');
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.start_time !== undefined) updateData.start_time = utcTimeToDateTime(data.start_time);
      if (data.end_time !== undefined) updateData.end_time = utcTimeToDateTime(data.end_time);

      const updatedTemplate = await tx.shift_template.update({
        where: { id: template_id },
        data: updateData,
        include: {
          created_by_user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      // Invalidate cache
      backendTemplateCache.invalidateTemplates(company_id);

      return {
        ...updatedTemplate,
        start_time: dateTimeToUtcTime(updatedTemplate.start_time as Date),
        end_time: dateTimeToUtcTime(updatedTemplate.end_time as Date),
      };
    });
  },

  async delete(template_id: number, company_id: number) {
    return prisma.$transaction(async (tx) => {
      // Verify template exists and belongs to company
      const existingTemplate = await tx.shift_template.findFirst({
        where: {
          id: template_id,
          company_id,
          deleted_at: null,
        },
      });

      if (!existingTemplate) {
        throw new Error('TEMPLATE_NOT_FOUND');
      }

      // Soft delete the template
      await tx.shift_template.update({
        where: { id: template_id },
        data: { deleted_at: new Date() },
      });

      // Invalidate cache
      backendTemplateCache.invalidateTemplates(company_id);

      return { success: true };
    });
  },

  async incrementUsageCount(template_id: number, company_id: number) {
    return prisma.$transaction(async (tx) => {
      // Verify template exists and belongs to company
      const existingTemplate = await tx.shift_template.findFirst({
        where: {
          id: template_id,
          company_id,
          deleted_at: null,
        },
      });

      if (!existingTemplate) {
        throw new Error('TEMPLATE_NOT_FOUND');
      }

      // Increment usage count
      const updatedTemplate = await tx.shift_template.update({
        where: { id: template_id },
        data: { usage_count: { increment: 1 } },
      });

      // Invalidate cache to refresh usage counts
      backendTemplateCache.invalidateTemplates(company_id);

      return {
        ...updatedTemplate,
        start_time: dateTimeToUtcTime(updatedTemplate.start_time as Date),
        end_time: dateTimeToUtcTime(updatedTemplate.end_time as Date),
      };
    });
  },

  async getUsageStatistics(company_id: number) {
    const stats = await prisma.shift_template.aggregate({
      where: {
        company_id,
        deleted_at: null,
      },
      _count: {
        id: true,
      },
      _sum: {
        usage_count: true,
      },
      _avg: {
        usage_count: true,
      },
    });

    const mostUsedTemplates = await prisma.shift_template.findMany({
      where: {
        company_id,
        deleted_at: null,
        usage_count: { gt: 0 },
      },
      orderBy: {
        usage_count: 'desc',
      },
      take: 5,
      select: {
        id: true,
        name: true,
        usage_count: true,
        start_time: true,
        end_time: true,
      },
    });

    return {
      total_templates: stats._count.id || 0,
      total_usage: stats._sum.usage_count || 0,
      average_usage: stats._avg.usage_count || 0,
      most_used: mostUsedTemplates.map(template => ({
        ...template,
        start_time: dateTimeToUtcTime(template.start_time as Date),
        end_time: dateTimeToUtcTime(template.end_time as Date),
      })),
    };
  },
};