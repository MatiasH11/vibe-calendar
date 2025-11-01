import { prisma } from '../config/prisma_client';
import { register_body, login_body } from '../validations/auth.validation';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AUTH_CONSTANTS } from '../constants/auth';
import { env } from '../config/environment';
import {
  EmailAlreadyExistsError,
  CompanyNameAlreadyExistsError,
  InvalidCredentialsError,
  UserNotAssociatedWithCompanyError,
  TransactionFailedError,
} from '../errors';

export const auth_service = {
  /**
   * Register a new user and company
   * Creates: company -> user -> department -> employee
   */
  async register(data: register_body) {
    // Verify email doesn't exist
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new EmailAlreadyExistsError(data.email);
    }

    // Verify company name doesn't exist
    const existingCompany = await prisma.company.findFirst({
      where: { name: data.company_name },
    });
    if (existingCompany) {
      throw new CompanyNameAlreadyExistsError(data.company_name);
    }

    // Hash password
    const password_hash = await bcrypt.hash(
      data.password,
      AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS
    );

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create company
        const company = await tx.company.create({
          data: {
            name: data.company_name,
            email: data.email,
          },
        });

        // 2. Create default location for the company
        const defaultLocation = await tx.location.create({
          data: {
            company_id: company.id,
            name: 'Main',
            address: '',
            city: '',
            is_active: true,
          },
        });

        // 3. Create user (platform level - type: USER)
        const user = await tx.user.create({
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            password_hash,
            user_type: 'USER', // Platform-level permission (USER or SUPER_ADMIN)
            is_active: true,
          },
        });

        // 4. Create default "Management" department for the company
        const managementDepartment = await tx.department.create({
          data: {
            company_id: company.id,
            location_id: defaultLocation.id,
            name: 'Management',
            description: 'Company management and administration',
            color: '#3B82F6', // Blue for management
            is_active: true,
          },
        });

        // 5. Create employee record with OWNER role (company-level permission)
        const employee = await tx.employee.create({
          data: {
            company_id: company.id,
            location_id: defaultLocation.id,
            user_id: user.id,
            department_id: managementDepartment.id,
            company_role: 'OWNER', // Company-level permission (OWNER, ADMIN, MANAGER, EMPLOYEE)
            position: 'Owner',
            is_active: true,
          },
        });

        // 5. Create audit logs for registration
        await tx.audit_log.createMany({
          data: [
            {
              user_id: user.id,
              company_id: company.id,
              action: 'CREATE',
              entity_type: 'company',
              entity_id: company.id,
              new_values: { name: company.name, email: company.email },
            },
            {
              user_id: user.id,
              company_id: company.id,
              action: 'CREATE',
              entity_type: 'user',
              entity_id: user.id,
              new_values: { email: user.email, first_name: user.first_name, last_name: user.last_name },
            },
            {
              user_id: user.id,
              company_id: company.id,
              action: 'CREATE',
              entity_type: 'department',
              entity_id: managementDepartment.id,
              new_values: { name: managementDepartment.name },
            },
            {
              user_id: user.id,
              company_id: company.id,
              action: 'CREATE',
              entity_type: 'employee',
              entity_id: employee.id,
              new_values: { company_role: employee.company_role, position: employee.position },
            },
          ],
        });

        return { company, user, department: managementDepartment, employee };
      });

      return {
        success: true,
        data: {
          company_id: result.company.id,
          user_id: result.user.id,
          employee_id: result.employee.id,
        },
      };
    } catch (e) {
      console.error('Registration transaction failed:', e);
      throw new TransactionFailedError('User registration');
    }
  },

  /**
   * Login user
   * Returns JWT token with user and employee info
   */
  async login(data: login_body) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Verify password
    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      throw new InvalidCredentialsError();
    }

    // Find employee record (company membership)
    const employee = await prisma.employee.findFirst({
      where: {
        user_id: user.id,
        deleted_at: null,
        is_active: true,
      },
      include: {
        department: true,
        company: true,
      },
    });

    if (!employee) {
      throw new UserNotAssociatedWithCompanyError(user.id);
    }

    // Create JWT payload
    const payload = {
      user_id: user.id,
      employee_id: employee.id,
      admin_company_id: employee.company_id,
      user_type: user.user_type, // Platform-level: SUPER_ADMIN or USER
      company_role: employee.company_role, // Company-level: OWNER, ADMIN, MANAGER, EMPLOYEE
      email: user.email,
    };

    // Generate JWT token
    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: AUTH_CONSTANTS.JWT_EXPIRATION,
    });

    // Create audit log for login
    await prisma.audit_log.create({
      data: {
        user_id: user.id,
        company_id: employee.company_id,
        action: 'LOGIN',
        entity_type: 'user',
        entity_id: user.id,
        new_values: { email: user.email },
      },
    });

    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          user_type: user.user_type,
        },
        employee: {
          id: employee.id,
          company_id: employee.company_id,
          company_name: employee.company.name,
          department: employee.department.name,
          company_role: employee.company_role,
          position: employee.position,
        },
      },
    };
  },
};


