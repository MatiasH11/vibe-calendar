/**
 * Repository Pattern Tests
 * Reference: PLAN.md Section 6
 *
 * Tests for base repository and specific repositories (role, employee, shift)
 * These are unit tests with mocked Prisma client
 */

import { roleRepository } from '../repositories/role.repository';
import { employeeRepository } from '../repositories/employee.repository';
import { shiftRepository } from '../repositories/shift.repository';
import { prisma } from '../config/prisma_client';

// Mock Prisma client
jest.mock('../config/prisma_client', () => ({
  prisma: {
    role: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    company_employee: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    shift: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Repository Pattern (PLAN.md 6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RoleRepository', () => {
    const mockRole = {
      id: 1,
      company_id: 1,
      name: 'Admin',
      description: 'Administrator role',
      color: '#FF0000',
      created_at: new Date(),
      updated_at: new Date(),
    };

    describe('findByCompany', () => {
      it('should find roles by company ID', async () => {
        (prisma.role.findMany as jest.Mock).mockResolvedValue([mockRole]);

        const result = await roleRepository.findByCompany(1);

        expect(result).toEqual([mockRole]);
        expect(prisma.role.findMany).toHaveBeenCalledWith({
          where: { company_id: 1 },
          orderBy: { name: 'asc' },
        });
      });

      it('should filter by search term', async () => {
        (prisma.role.findMany as jest.Mock).mockResolvedValue([mockRole]);

        await roleRepository.findByCompany(1, { search: 'admin' });

        expect(prisma.role.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              OR: expect.arrayContaining([
                { name: { contains: 'admin', mode: 'insensitive' } },
                { description: { contains: 'admin', mode: 'insensitive' } },
              ]),
            }),
          })
        );
      });

      it('should include employee count when requested', async () => {
        (prisma.role.findMany as jest.Mock).mockResolvedValue([
          { ...mockRole, _count: { employees: 5 } },
        ]);

        const result = await roleRepository.findByCompany(1, {
          include_employee_count: true,
        });

        expect(prisma.role.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            include: expect.objectContaining({
              _count: expect.any(Object),
            }),
          })
        );
      });
    });

    describe('findByName', () => {
      it('should find role by exact name', async () => {
        (prisma.role.findFirst as jest.Mock).mockResolvedValue(mockRole);

        const result = await roleRepository.findByName(1, 'Admin');

        expect(result).toEqual(mockRole);
        expect(prisma.role.findFirst).toHaveBeenCalledWith({
          where: {
            company_id: 1,
            name: 'Admin',
          },
        });
      });

      it('should return null if role not found', async () => {
        (prisma.role.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await roleRepository.findByName(1, 'NonExistent');

        expect(result).toBeNull();
      });
    });

    describe('isNameTaken', () => {
      it('should return true if name exists', async () => {
        (prisma.role.findFirst as jest.Mock).mockResolvedValue(mockRole);

        const result = await roleRepository.isNameTaken(1, 'Admin');

        expect(result).toBe(true);
      });

      it('should return false if name does not exist', async () => {
        (prisma.role.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await roleRepository.isNameTaken(1, 'NewRole');

        expect(result).toBe(false);
      });

      it('should exclude specific role ID when checking', async () => {
        (prisma.role.findFirst as jest.Mock).mockResolvedValue(null);

        await roleRepository.isNameTaken(1, 'Admin', 1);

        expect(prisma.role.findFirst).toHaveBeenCalledWith({
          where: {
            company_id: 1,
            name: 'Admin',
            id: { not: 1 },
          },
        });
      });
    });

    describe('createRole', () => {
      it('should create a new role', async () => {
        (prisma.role.create as jest.Mock).mockResolvedValue(mockRole);

        const result = await roleRepository.createRole({
          company: { connect: { id: 1 } },
          name: 'Admin',
          description: 'Administrator role',
          color: '#FF0000',
        });

        expect(result).toEqual(mockRole);
        expect(prisma.role.create).toHaveBeenCalled();
      });
    });

    describe('deleteRole', () => {
      it('should delete role if no employees assigned', async () => {
        (prisma.company_employee.count as jest.Mock).mockResolvedValue(0);
        (prisma.role.delete as jest.Mock).mockResolvedValue(mockRole);

        const result = await roleRepository.deleteRole(1, 1);

        expect(result).toEqual(mockRole);
      });

      it('should throw error if role has employees', async () => {
        (prisma.company_employee.count as jest.Mock).mockResolvedValue(3);

        await expect(roleRepository.deleteRole(1, 1)).rejects.toThrow('ROLE_HAS_EMPLOYEES');
      });
    });
  });

  describe('EmployeeRepository', () => {
    const mockEmployee = {
      id: 1,
      company_id: 1,
      user_id: 1,
      role_id: 1,
      position: 'Developer',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    };

    describe('findByCompany', () => {
      it('should find employees by company ID', async () => {
        (prisma.company_employee.findMany as jest.Mock).mockResolvedValue([mockEmployee]);

        const result = await employeeRepository.findByCompany(1);

        expect(result).toEqual([mockEmployee]);
        expect(prisma.company_employee.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              company_id: 1,
              deleted_at: null,
            },
          })
        );
      });

      it('should filter by active status', async () => {
        (prisma.company_employee.findMany as jest.Mock).mockResolvedValue([mockEmployee]);

        await employeeRepository.findByCompany(1, { is_active: true });

        expect(prisma.company_employee.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              is_active: true,
            }),
          })
        );
      });

      it('should filter by role', async () => {
        (prisma.company_employee.findMany as jest.Mock).mockResolvedValue([mockEmployee]);

        await employeeRepository.findByCompany(1, { role_id: 2 });

        expect(prisma.company_employee.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              role_id: 2,
            }),
          })
        );
      });

      it('should search by user name or email', async () => {
        (prisma.company_employee.findMany as jest.Mock).mockResolvedValue([mockEmployee]);

        await employeeRepository.findByCompany(1, { search: 'john' });

        expect(prisma.company_employee.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              user: {
                OR: expect.arrayContaining([
                  { first_name: { contains: 'john', mode: 'insensitive' } },
                  { last_name: { contains: 'john', mode: 'insensitive' } },
                  { email: { contains: 'john', mode: 'insensitive' } },
                ]),
              },
            }),
          })
        );
      });
    });

    describe('findByUserAndCompany', () => {
      it('should find employee by user and company', async () => {
        (prisma.company_employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);

        const result = await employeeRepository.findByUserAndCompany(1, 1);

        expect(result).toEqual(mockEmployee);
        expect(prisma.company_employee.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              user_id: 1,
              company_id: 1,
              deleted_at: null,
            },
          })
        );
      });
    });

    describe('isEmployeeOfCompany', () => {
      it('should return true if user is employee', async () => {
        (prisma.company_employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);

        const result = await employeeRepository.isEmployeeOfCompany(1, 1);

        expect(result).toBe(true);
      });

      it('should return false if user is not employee', async () => {
        (prisma.company_employee.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await employeeRepository.isEmployeeOfCompany(1, 1);

        expect(result).toBe(false);
      });
    });

    describe('bulkUpdateActiveStatus', () => {
      it('should update active status for multiple employees', async () => {
        (prisma.company_employee.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

        const result = await employeeRepository.bulkUpdateActiveStatus([1, 2, 3], false, 1);

        expect(result.count).toBe(3);
        expect(prisma.company_employee.updateMany).toHaveBeenCalledWith({
          where: {
            id: { in: [1, 2, 3] },
            company_id: 1,
            deleted_at: null,
          },
          data: { is_active: false },
        });
      });
    });
  });

  describe('ShiftRepository', () => {
    const mockShift = {
      id: 1,
      company_employee_id: 1,
      shift_date: new Date('2025-01-15'),
      start_time: new Date('1970-01-01T09:00:00Z'),
      end_time: new Date('1970-01-01T17:00:00Z'),
      notes: 'Test shift',
      status: 'confirmed' as const,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    };

    describe('findByCompany', () => {
      it('should find shifts by company ID', async () => {
        (prisma.shift.findMany as jest.Mock).mockResolvedValue([mockShift]);

        const result = await shiftRepository.findByCompany(1);

        expect(result).toBeDefined();
        expect(prisma.shift.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              company_employee: {
                company_id: 1,
                deleted_at: null,
              },
              deleted_at: null,
            }),
          })
        );
      });

      it('should filter by date range', async () => {
        (prisma.shift.findMany as jest.Mock).mockResolvedValue([mockShift]);

        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-31');

        await shiftRepository.findByCompany(1, { start_date: startDate, end_date: endDate });

        expect(prisma.shift.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              shift_date: {
                gte: startDate,
                lte: endDate,
              },
            }),
          })
        );
      });

      it('should filter by employee IDs', async () => {
        (prisma.shift.findMany as jest.Mock).mockResolvedValue([mockShift]);

        await shiftRepository.findByCompany(1, { employee_ids: [1, 2, 3] });

        expect(prisma.shift.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              company_employee_id: { in: [1, 2, 3] },
            }),
          })
        );
      });

      it('should filter by status', async () => {
        (prisma.shift.findMany as jest.Mock).mockResolvedValue([mockShift]);

        await shiftRepository.findByCompany(1, { status: 'confirmed' });

        expect(prisma.shift.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: 'confirmed',
            }),
          })
        );
      });
    });

    describe('findByEmployee', () => {
      it('should find shifts for specific employee', async () => {
        (prisma.shift.findMany as jest.Mock).mockResolvedValue([mockShift]);

        const result = await shiftRepository.findByEmployee(1);

        expect(result).toEqual([mockShift]);
        expect(prisma.shift.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              company_employee_id: 1,
              deleted_at: null,
            },
          })
        );
      });
    });

    describe('isDuplicate', () => {
      it('should return true if duplicate exists', async () => {
        (prisma.shift.findFirst as jest.Mock).mockResolvedValue(mockShift);

        const result = await shiftRepository.isDuplicate(
          1,
          new Date('2025-01-15'),
          new Date('1970-01-01T09:00:00Z'),
          new Date('1970-01-01T17:00:00Z')
        );

        expect(result).toBe(true);
      });

      it('should return false if no duplicate', async () => {
        (prisma.shift.findFirst as jest.Mock).mockResolvedValue(null);

        const result = await shiftRepository.isDuplicate(
          1,
          new Date('2025-01-15'),
          new Date('1970-01-01T09:00:00Z'),
          new Date('1970-01-01T17:00:00Z')
        );

        expect(result).toBe(false);
      });
    });

    describe('getStatistics', () => {
      it('should return shift statistics', async () => {
        (prisma.shift.count as jest.Mock)
          .mockResolvedValueOnce(100) // total
          .mockResolvedValueOnce(80) // confirmed
          .mockResolvedValueOnce(10) // draft
          .mockResolvedValueOnce(10); // cancelled

        const result = await shiftRepository.getStatistics(1);

        expect(result).toEqual({
          total: 100,
          confirmed: 80,
          draft: 10,
          cancelled: 10,
        });
        expect(prisma.shift.count).toHaveBeenCalledTimes(4);
      });
    });
  });
});
