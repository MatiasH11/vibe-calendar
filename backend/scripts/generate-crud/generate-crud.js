#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Paths
const SCHEMA_PATH = path.join(__dirname, '..', '..', 'prisma', 'schema.prisma');
const SRC_PATH = path.join(__dirname, '..', '..', 'src');

// Parse Prisma schema to extract model names
function getPrismaModels() {
  const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  const modelRegex = /model\s+(\w+)\s*{/g;
  const models = [];
  let match;

  while ((match = modelRegex.exec(schemaContent)) !== null) {
    models.push(match[1]);
  }

  return models;
}

// Extract fields from a specific Prisma model
function extractFieldsFromPrismaModel(modelName) {
  const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');

  // Find the model definition
  const modelRegex = new RegExp(`model\\s+${modelName}\\s*{([^}]+)}`, 's');
  const modelMatch = schemaContent.match(modelRegex);

  if (!modelMatch) {
    throw new Error(`Model "${modelName}" not found in schema.prisma`);
  }

  const modelContent = modelMatch[1];

  // Fields to exclude (auto-generated or internal)
  const excludeFields = ['id', 'created_at', 'updated_at', 'deleted_at'];

  // Prisma scalar types (only include these)
  const scalarTypes = ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json', 'Decimal', 'BigInt', 'Bytes'];

  // Process line by line to avoid regex global state issues
  const lines = modelContent.split('\n');
  const fieldRegex = /^\s*(\w+)\s+(\w+)(\[\])?\s*(\?)?/;
  const fields = [];

  for (const line of lines) {
    const fieldMatch = line.match(fieldRegex);

    if (!fieldMatch) continue;

    const [, fieldName, fieldType, isArray, isOptional] = fieldMatch;

    // Skip excluded fields
    if (excludeFields.includes(fieldName)) {
      continue;
    }

    // Skip array fields (relations like audit_log[], department[])
    if (isArray) {
      continue;
    }

    // Skip relation fields (non-scalar types like company_settings?, employee)
    if (!scalarTypes.includes(fieldType)) {
      continue;
    }

    fields.push({
      name: fieldName,
      type: fieldType,
      isArray: false,
      isOptional: !!isOptional,
    });
  }

  return fields;
}

// Map Prisma type to Zod type
function mapPrismaTypeToZod(prismaType, isOptional) {
  const typeMap = {
    String: 'z.string()',
    Int: 'z.number().int()',
    Float: 'z.number()',
    Boolean: 'z.boolean()',
    DateTime: 'z.string().datetime()',
    Json: 'z.record(z.any())',
    Decimal: 'z.number()',
    BigInt: 'z.bigint()',
    Bytes: 'z.instanceof(Buffer)',
  };

  let zodType = typeMap[prismaType] || 'z.any()';

  if (isOptional) {
    zodType += '.optional()';
  }

  return zodType;
}

// Map Prisma type to TypeScript type
function mapPrismaTypeToTS(prismaType) {
  const typeMap = {
    String: 'string',
    Int: 'number',
    Float: 'number',
    Boolean: 'boolean',
    DateTime: 'Date',
    Json: 'Record<string, any>',
    Decimal: 'number',
    BigInt: 'bigint',
    Bytes: 'Buffer',
  };

  return typeMap[prismaType] || 'any';
}

// Generate validation file
function generateValidationFile(entityName, fields) {
  const entityLower = entityName.toLowerCase();
  const createFields = fields.filter(f => !f.name.includes('_id') || f.name === 'company_id');
  const updateFields = fields.filter(f => !f.name.includes('_id') || f.name === 'company_id');

  return `import { z } from 'zod';

// Create ${entityName} schema
export const create_${entityLower}_schema = z.object({
${createFields.map(f => `  ${f.name}: ${mapPrismaTypeToZod(f.type, f.isOptional)},`).join('\n')}
});

// Update ${entityName} schema (all fields optional)
export const update_${entityLower}_schema = z.object({
${updateFields.map(f => `  ${f.name}: ${mapPrismaTypeToZod(f.type, true)},`).join('\n')}
});

// Query filters schema
export const ${entityLower}_filters_schema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// Bulk create schema
export const bulk_create_${entityLower}_schema = z.object({
  items: z.array(create_${entityLower}_schema).min(1).max(100),
});

// Bulk update schema
export const bulk_update_${entityLower}_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  data: update_${entityLower}_schema,
});

// Bulk delete schema
export const bulk_delete_${entityLower}_schema = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
});

// Export types
export type create_${entityLower}_body = z.infer<typeof create_${entityLower}_schema>;
export type update_${entityLower}_body = z.infer<typeof update_${entityLower}_schema>;
export type ${entityLower}_filters = z.infer<typeof ${entityLower}_filters_schema>;
export type bulk_create_${entityLower}_body = z.infer<typeof bulk_create_${entityLower}_schema>;
export type bulk_update_${entityLower}_body = z.infer<typeof bulk_update_${entityLower}_schema>;
export type bulk_delete_${entityLower}_body = z.infer<typeof bulk_delete_${entityLower}_schema>;
`;
}

// Generate service file
function generateServiceFile(entityName, fields) {
  const entityLower = entityName.toLowerCase();

  return `import { prisma } from '../config/prisma_client';
import {
  create_${entityLower}_body,
  update_${entityLower}_body,
  ${entityLower}_filters,
  bulk_create_${entityLower}_body,
  bulk_update_${entityLower}_body,
  bulk_delete_${entityLower}_body,
} from '../validations/${entityLower}.validation';
import {
  ResourceNotFoundError,
  UnauthorizedCompanyAccessError,
  TransactionFailedError,
} from '../errors';

export const ${entityLower}_service = {
  /**
   * Get all ${entityName}s with pagination and filters
   */
  async getAll(company_id: number, filters: ${entityLower}_filters) {
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
      prisma.${entityLower}.count({ where }),
      prisma.${entityLower}.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [filters.sort_by || 'created_at']: filters.sort_order || 'desc',
        },
      }),
    ]);

    return {
      success: true,
      data: {
        items,
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
   * Get ${entityName} by ID
   */
  async getById(id: number, company_id: number) {
    const ${entityLower} = await prisma.${entityLower}.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!${entityLower}) {
      throw new ResourceNotFoundError('${entityName}', id);
    }

    return { success: true, data: ${entityLower} };
  },

  /**
   * Create new ${entityName}
   */
  async create(data: create_${entityLower}_body, company_id: number, user_id: number) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create ${entityLower}
        const ${entityLower} = await tx.${entityLower}.create({
          data: {
            ...data,
            company_id,
          },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'CREATE',
            entity_type: '${entityLower}',
            entity_id: ${entityLower}.id,
            new_values: data,
          },
        });

        return ${entityLower};
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Create ${entityLower} transaction failed:', e);
      throw new TransactionFailedError('${entityName} creation');
    }
  },

  /**
   * Update ${entityName}
   */
  async update(
    id: number,
    data: update_${entityLower}_body,
    company_id: number,
    user_id: number
  ) {
    // Verify ${entityLower} exists and belongs to company
    const existing = await prisma.${entityLower}.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('${entityName}', id);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update ${entityLower}
        const updated = await tx.${entityLower}.update({
          where: { id },
          data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: '${entityLower}',
            entity_id: id,
            old_values: existing,
            new_values: data,
          },
        });

        return updated;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Update ${entityLower} transaction failed:', e);
      throw new TransactionFailedError('${entityName} update');
    }
  },

  /**
   * Delete ${entityName} (soft delete)
   */
  async delete(id: number, company_id: number, user_id: number) {
    // Verify ${entityLower} exists and belongs to company
    const existing = await prisma.${entityLower}.findFirst({
      where: { id, company_id, deleted_at: null },
    });

    if (!existing) {
      throw new ResourceNotFoundError('${entityName}', id);
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Soft delete ${entityLower}
        await tx.${entityLower}.update({
          where: { id },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'DELETE',
            entity_type: '${entityLower}',
            entity_id: id,
            old_values: existing,
          },
        });
      });

      return { success: true, message: '${entityName} deleted successfully' };
    } catch (e) {
      console.error('Delete ${entityLower} transaction failed:', e);
      throw new TransactionFailedError('${entityName} deletion');
    }
  },

  /**
   * Bulk create ${entityName}s
   */
  async bulkCreate(data: bulk_create_${entityLower}_body, company_id: number, user_id: number) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        const created = await tx.${entityLower}.createMany({
          data: data.items.map((item) => ({
            ...item,
            company_id,
          })),
        });

        // Create audit logs
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_CREATE',
            entity_type: '${entityLower}',
            entity_id: 0, // Bulk operation
            new_values: { count: created.count },
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
      console.error('Bulk create ${entityLower} transaction failed:', e);
      throw new TransactionFailedError('Bulk ${entityName} creation');
    }
  },

  /**
   * Bulk update ${entityName}s
   */
  async bulkUpdate(
    data: bulk_update_${entityLower}_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all ${entityLower}s belong to company
        const existing = await tx.${entityLower}.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some ${entityName}s not found or do not belong to company');
        }

        // Update all ${entityLower}s
        const updated = await tx.${entityLower}.updateMany({
          where: { id: { in: data.ids } },
          data: data.data,
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_UPDATE',
            entity_type: '${entityLower}',
            entity_id: 0, // Bulk operation
            new_values: { ids: data.ids, count: updated.count },
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
      console.error('Bulk update ${entityLower} transaction failed:', e);
      throw new TransactionFailedError('Bulk ${entityName} update');
    }
  },

  /**
   * Bulk delete ${entityName}s
   */
  async bulkDelete(
    data: bulk_delete_${entityLower}_body,
    company_id: number,
    user_id: number
  ) {
    try {
      const results = await prisma.$transaction(async (tx) => {
        // Verify all ${entityLower}s belong to company
        const existing = await tx.${entityLower}.findMany({
          where: {
            id: { in: data.ids },
            company_id,
            deleted_at: null,
          },
        });

        if (existing.length !== data.ids.length) {
          throw new Error('Some ${entityName}s not found or do not belong to company');
        }

        // Soft delete all ${entityLower}s
        const deleted = await tx.${entityLower}.updateMany({
          where: { id: { in: data.ids } },
          data: { deleted_at: new Date() },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'BULK_DELETE',
            entity_type: '${entityLower}',
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
      console.error('Bulk delete ${entityLower} transaction failed:', e);
      throw new TransactionFailedError('Bulk ${entityName} deletion');
    }
  },
};
`;
}

// Generate controller file
function generateControllerFile(entityName) {
  const entityLower = entityName.toLowerCase();

  return `import { Request, Response, NextFunction } from 'express';
import { ${entityLower}_service } from '../services/${entityLower}.service';
import {
  create_${entityLower}_schema,
  update_${entityLower}_schema,
  ${entityLower}_filters_schema,
  bulk_create_${entityLower}_schema,
  bulk_update_${entityLower}_schema,
  bulk_delete_${entityLower}_schema,
} from '../validations/${entityLower}.validation';

export const ${entityLower}_controller = {
  /**
   * Get all ${entityName}s
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ${entityLower}_filters_schema.parse(req.query);
      const company_id = req.user!.admin_company_id;

      const result = await ${entityLower}_service.getAll(company_id, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get ${entityName} by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.admin_company_id;

      const result = await ${entityLower}_service.getById(id, company_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create ${entityName}
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = create_${entityLower}_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await ${entityLower}_service.create(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update ${entityName}
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const data = update_${entityLower}_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await ${entityLower}_service.update(id, data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete ${entityName}
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await ${entityLower}_service.delete(id, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk create ${entityName}s
   */
  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_create_${entityLower}_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await ${entityLower}_service.bulkCreate(data, company_id, user_id);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk update ${entityName}s
   */
  async bulkUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_update_${entityLower}_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await ${entityLower}_service.bulkUpdate(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk delete ${entityName}s
   */
  async bulkDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const data = bulk_delete_${entityLower}_schema.parse(req.body);
      const company_id = req.user!.admin_company_id;
      const user_id = req.user!.user_id;

      const result = await ${entityLower}_service.bulkDelete(data, company_id, user_id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
`;
}

// Generate routes file
function generateRoutesFile(entityName) {
  const entityLower = entityName.toLowerCase();

  return `import { Router } from 'express';
import { ${entityLower}_controller } from '../controllers/${entityLower}.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /${entityLower}:
 *   get:
 *     tags: [${entityName}]
 *     summary: Get all ${entityName}s
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of ${entityName}s with pagination
 */
router.get('/', ${entityLower}_controller.getAll);

/**
 * @openapi
 * /${entityLower}/{id}:
 *   get:
 *     tags: [${entityName}]
 *     summary: Get ${entityName} by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ${entityName} details
 *       404:
 *         description: ${entityName} not found
 */
router.get('/:id', ${entityLower}_controller.getById);

/**
 * @openapi
 * /${entityLower}:
 *   post:
 *     tags: [${entityName}]
 *     summary: Create new ${entityName}
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: ${entityName} created successfully
 */
router.post('/', ${entityLower}_controller.create);

/**
 * @openapi
 * /${entityLower}/{id}:
 *   put:
 *     tags: [${entityName}]
 *     summary: Update ${entityName}
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: ${entityName} updated successfully
 */
router.put('/:id', ${entityLower}_controller.update);

/**
 * @openapi
 * /${entityLower}/{id}:
 *   delete:
 *     tags: [${entityName}]
 *     summary: Delete ${entityName} (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ${entityName} deleted successfully
 */
router.delete('/:id', ${entityLower}_controller.delete);

/**
 * @openapi
 * /${entityLower}/bulk/create:
 *   post:
 *     tags: [${entityName}]
 *     summary: Bulk create ${entityName}s
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *     responses:
 *       201:
 *         description: ${entityName}s created successfully
 */
router.post('/bulk/create', ${entityLower}_controller.bulkCreate);

/**
 * @openapi
 * /${entityLower}/bulk/update:
 *   put:
 *     tags: [${entityName}]
 *     summary: Bulk update ${entityName}s
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 maxItems: 100
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: ${entityName}s updated successfully
 */
router.put('/bulk/update', ${entityLower}_controller.bulkUpdate);

/**
 * @openapi
 * /${entityLower}/bulk/delete:
 *   delete:
 *     tags: [${entityName}]
 *     summary: Bulk delete ${entityName}s
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 maxItems: 100
 *     responses:
 *       200:
 *         description: ${entityName}s deleted successfully
 */
router.delete('/bulk/delete', ${entityLower}_controller.bulkDelete);

export default router;
`;
}

// Create directory if it doesn't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Generate CRUD files for a given model
function generateCRUDFiles(selectedModel, fields) {
  console.log(`\n📝 Generating CRUD files for ${selectedModel}...\n`);

  // Generate files
  const entityLower = selectedModel.toLowerCase();

  // Validation file
  const validationPath = path.join(SRC_PATH, 'validations', `${entityLower}.validation.ts`);
  ensureDirectoryExists(path.dirname(validationPath));
  fs.writeFileSync(validationPath, generateValidationFile(selectedModel, fields));
  console.log(`✅ Created: src/validations/${entityLower}.validation.ts`);

  // Service file
  const servicePath = path.join(SRC_PATH, 'services', `${entityLower}.service.ts`);
  ensureDirectoryExists(path.dirname(servicePath));
  fs.writeFileSync(servicePath, generateServiceFile(selectedModel, fields));
  console.log(`✅ Created: src/services/${entityLower}.service.ts`);

  // Controller file
  const controllerPath = path.join(SRC_PATH, 'controllers', `${entityLower}.controller.ts`);
  ensureDirectoryExists(path.dirname(controllerPath));
  fs.writeFileSync(controllerPath, generateControllerFile(selectedModel));
  console.log(`✅ Created: src/controllers/${entityLower}.controller.ts`);

  // Routes file
  const routesPath = path.join(SRC_PATH, 'routes', `${entityLower}.routes.ts`);
  ensureDirectoryExists(path.dirname(routesPath));
  fs.writeFileSync(routesPath, generateRoutesFile(selectedModel));
  console.log(`✅ Created: src/routes/${entityLower}.routes.ts`);

  console.log('\n✨ CRUD generation completed!\n');
  console.log('Next steps:');
  console.log(`  1. Review generated files in src/`);
  console.log(`  2. Add route to app.ts: import ${entityLower}Router from './routes/${entityLower}.routes';`);
  console.log(`  3. Add route to app.ts: app.use('/api/v1/${entityLower}', ${entityLower}Router);`);
  console.log(`  4. Update Swagger tags in src/config/swagger.ts`);
  console.log(`  5. Test endpoints at /api/docs\n`);
}

// Main generator function
async function generateCRUD() {
  console.log('\n📦 CRUD Generator v1.0\n');

  // Get available models
  const models = getPrismaModels();

  if (models.length === 0) {
    console.error('❌ No models found in schema.prisma');
    process.exit(1);
  }

  // Check if model name was provided as command line argument
  const modelArgument = process.argv[2];

  if (modelArgument) {
    // Direct generation mode
    if (!models.includes(modelArgument)) {
      console.error(`❌ Invalid model: "${modelArgument}"`);
      console.log('\nAvailable models:');
      models.forEach((model, index) => {
        console.log(`  ${index + 1}. ${model}`);
      });
      process.exit(1);
    }

    console.log(`✅ Selected model: ${modelArgument}\n`);

    try {
      // Extract fields from model
      const fields = extractFieldsFromPrismaModel(modelArgument);

      console.log('Detected fields:');
      fields.forEach((field) => {
        const optional = field.isOptional ? '?' : '';
        console.log(`  - ${field.name}: ${field.type}${optional}`);
      });

      generateCRUDFiles(modelArgument, fields);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }

    return;
  }

  // Interactive mode
  console.log('Available models:');
  models.forEach((model, index) => {
    console.log(`  ${index + 1}. ${model}`);
  });

  // Prompt user for model selection
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('\nEnter model name or number: ', (answer) => {
    let selectedModel;

    // Check if answer is a number
    const modelIndex = parseInt(answer);
    if (!isNaN(modelIndex) && modelIndex > 0 && modelIndex <= models.length) {
      selectedModel = models[modelIndex - 1];
    } else if (models.includes(answer)) {
      selectedModel = answer;
    } else {
      console.error(`❌ Invalid selection: "${answer}"`);
      rl.close();
      process.exit(1);
    }

    console.log(`\n✅ Selected model: ${selectedModel}\n`);

    try {
      // Extract fields from model
      const fields = extractFieldsFromPrismaModel(selectedModel);

      console.log('Detected fields:');
      fields.forEach((field) => {
        const optional = field.isOptional ? '?' : '';
        console.log(`  - ${field.name}: ${field.type}${optional}`);
      });

      generateCRUDFiles(selectedModel, fields);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }

    rl.close();
  });
}

// Run generator
generateCRUD();
