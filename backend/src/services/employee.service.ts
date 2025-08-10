import { prisma } from '../config/prisma_client';
import { AddEmployeeBody } from '../validations/employee.validation';
import bcrypt from 'bcryptjs';
import { AUTH_CONSTANTS } from '../constants/auth';
import crypto from 'crypto';

export const employee_service = {
  async add(data: AddEmployeeBody, company_id: number) {
    // Ensure role belongs to company
    const role = await prisma.role.findFirst({ where: { id: data.role_id, company_id } });
    if (!role) {
      throw new Error('UNAUTHORIZED_COMPANY_ACCESS');
    }

    return prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email: data.email } });
      if (!user) {
        const tempPassword = crypto.randomBytes(16).toString('hex');
        const password_hash = await bcrypt.hash(tempPassword, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);
        user = await tx.user.create({
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            password_hash,
          },
        });
      }

      const existing = await tx.company_employee.findFirst({ where: { company_id, user_id: user.id, deleted_at: null } });
      if (existing) {
        throw new Error('EMPLOYEE_ALREADY_EXISTS');
      }

      const employee = await tx.company_employee.create({
        data: {
          company_id,
          user_id: user.id,
          role_id: data.role_id,
          position: data.position,
          is_active: true,
        },
        include: { user: true, role: true },
      });

      return employee;
    });
  },

  async findByCompany(company_id: number) {
    return prisma.company_employee.findMany({
      where: { company_id, deleted_at: null },
      include: { user: true, role: true },
    });
  },
};


