import { role } from '@prisma/client';

export interface RoleResponseDTO {
  id: number;
  company_id: number;
  name: string;
  description?: string;
  color: string;
  created_at: string;
}

export const RoleMapper = {
  fromPrisma(role: role): RoleResponseDTO {
    return {
      id: role.id,
      company_id: role.company_id,
      name: role.name,
      description: role.description || undefined,
      color: role.color,
      created_at: role.created_at.toISOString(),
    };
  },
};
