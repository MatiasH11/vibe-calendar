import { prisma } from '../config/prisma_client';
import { CreateRoleBody } from '../validations/role.validation';

export const role_service = {
  async create(data: CreateRoleBody, company_id: number) {
    const existing = await prisma.role.findFirst({ where: { company_id, name: data.name } });
    if (existing) {
      throw new Error('DUPLICATE_ROLE');
    }
    const role = await prisma.role.create({
      data: {
        company_id,
        name: data.name,
        description: data.description,
        color: data.color,
      },
    });
    return role;
  },

  async find_by_company(company_id: number) {
    return prisma.role.findMany({ where: { company_id } });
  },
};


