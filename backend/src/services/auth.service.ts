import { prisma } from '../config/prisma_client';
import { register_body, login_body } from '../validations/auth.validation';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AUTH_CONSTANTS, ADMIN_ROLE_NAME } from '../constants/auth';
import { env } from '../config/environment';

export const auth_service = {
  async register(data: register_body) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const existingCompany = await prisma.company.findFirst({ where: { name: data.company_name } });
    if (existingCompany) {
      throw new Error('COMPANY_NAME_ALREADY_EXISTS');
    }

    const password_hash = await bcrypt.hash(data.password, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);

    try {
      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            name: data.company_name,
            email: data.email,
          },
        });

        const user = await tx.user.create({
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            password_hash,
          },
        });

        const role = await tx.role.create({
          data: {
            company_id: company.id,
            name: ADMIN_ROLE_NAME,
            description: 'Default admin role',
          },
        });

        const employee = await tx.company_employee.create({
          data: {
            company_id: company.id,
            user_id: user.id,
            role_id: role.id,
            position: 'Admin',
            is_active: true,
          },
        });

        return { company, user, role, employee };
      });

      return { success: true, data: { company_id: result.company.id, user_id: result.user.id, role_id: result.role.id, employee_id: result.employee.id } };
    } catch (e) {
      throw new Error('TRANSACTION_FAILED');
    }
  },

  async login(data: login_body) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const employee = await prisma.company_employee.findFirst({
      where: { user_id: user.id, deleted_at: null },
      include: { role: true, company: true },
    });

    if (!employee) {
      throw new Error('USER_NOT_ASSOCIATED_WITH_COMPANY');
    }

    const payload = {
      user_id: user.id,
      company_id: employee.company_id,
      employee_id: employee.id,
      role_id: employee.role_id,
      role_name: employee.role?.name ?? '',
    } as const;

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: AUTH_CONSTANTS.JWT_EXPIRATION });

    return { success: true, data: { token } };
  },
};


