import { company_employee, user, role } from '@prisma/client';
import { UserResponseDTO, UserMapper } from './user.dto';
import { RoleResponseDTO, RoleMapper } from './role.dto';

export interface EmployeeResponseDTO {
  id: number;
  company_id: number;
  user_id: number;
  role_id: number;
  position?: string;
  is_active: boolean;
  created_at: string;
  user?: UserResponseDTO;
  role?: RoleResponseDTO;
}

export const EmployeeMapper = {
  fromPrisma(
    employee: company_employee & {
      user?: user;
      role?: role;
    }
  ): EmployeeResponseDTO {
    return {
      id: employee.id,
      company_id: employee.company_id,
      user_id: employee.user_id,
      role_id: employee.role_id,
      position: employee.position || undefined,
      is_active: employee.is_active,
      created_at: employee.created_at.toISOString(),
      user: employee.user ? UserMapper.fromPrisma(employee.user) : undefined,
      role: employee.role ? RoleMapper.fromPrisma(employee.role) : undefined,
    };
  },

  fromPrismaList(
    employees: Array<company_employee & { user?: user; role?: role }>
  ): EmployeeResponseDTO[] {
    return employees.map(emp => EmployeeMapper.fromPrisma(emp));
  },
};
