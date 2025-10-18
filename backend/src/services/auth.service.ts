import { prisma } from '../config/prisma_client';
import { register_body, login_body } from '../validations/auth.validation';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AUTH_CONSTANTS, BUSINESS_ROLES, USER_TYPES } from '../constants/auth';
import { env } from '../config/environment';
import {
  EmailAlreadyExistsError,
  CompanyNameAlreadyExistsError,
  InvalidCredentialsError,
  UserNotAssociatedWithCompanyError,
  TransactionFailedError,
} from '../errors';

export const auth_service = {
  async register(data: register_body) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new EmailAlreadyExistsError(data.email);
    }

    const existingCompany = await prisma.company.findFirst({ where: { name: data.company_name } });
    if (existingCompany) {
      throw new CompanyNameAlreadyExistsError(data.company_name);
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
            user_type: 'admin', // El primer usuario de la empresa es siempre admin
          },
        });

        // Crear rol de administrador para la empresa
        const adminRole = await tx.role.create({
          data: {
            company_id: company.id,
            name: BUSINESS_ROLES.ADMIN,
            description: 'Administrador de la empresa',
            color: '#3B82F6', // Azul para admin
          },
        });

        // Asociar usuario como empleado con rol de admin
        const employee = await tx.company_employee.create({
          data: {
            company_id: company.id,
            user_id: user.id,
            role_id: adminRole.id,
            position: BUSINESS_ROLES.ADMIN,
            is_active: true,
          },
        });

        return { company, user, role: adminRole, employee };
      });

      return { success: true, data: { company_id: result.company.id, user_id: result.user.id, role_id: result.role.id, employee_id: result.employee.id } };
    } catch (e) {
      throw new TransactionFailedError('User registration');
    }
  },

  async login(data: login_body) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      throw new InvalidCredentialsError();
    }

    const employee = await prisma.company_employee.findFirst({
      where: { user_id: user.id, deleted_at: null },
      include: { role: true, company: true },
    });

    if (!employee) {
      throw new UserNotAssociatedWithCompanyError(user.id);
    }

    // Usar user_type directamente de la base de datos
    const payload = {
      user_id: user.id,
      company_id: employee.company_id,
      employee_id: employee.id,
      role_id: employee.role_id,
      role_name: employee.role.name,        // Rol de negocio: "Admin", "Vendedor", etc.
      user_type: user.user_type,            // Permisos del sistema desde BD: "admin" | "employee"
    } as const;

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: AUTH_CONSTANTS.JWT_EXPIRATION });

    return { success: true, data: { token } };
  },
};


