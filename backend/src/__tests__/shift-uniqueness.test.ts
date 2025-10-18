/**
 * Tests for Shift Uniqueness Constraint
 * Reference: PLAN.md Section 1.2
 *
 * Tests validate that:
 * 1. Duplicate shifts are prevented at database level
 * 2. Service layer handles uniqueness violations correctly
 * 3. Soft-deleted shifts can be "recreated"
 */

import { prisma } from '../config/prisma_client';
import { shift_service } from '../services/shift.service';

describe('Shift Uniqueness Constraint (PLAN.md 1.2)', () => {
  let testCompanyId: number;
  let testEmployeeId: number;
  let testRoleId: number;
  let testUserId: number;

  beforeAll(async () => {
    // Setup: Create test company, role, user, and employee
    const company = await prisma.company.create({
      data: {
        name: 'Test Company Uniqueness',
        email: `test-uniqueness-${Date.now()}@example.com`,
      },
    });
    testCompanyId = company.id;

    const role = await prisma.role.create({
      data: {
        company_id: testCompanyId,
        name: 'Test Role',
        description: 'Test role for uniqueness tests',
      },
    });
    testRoleId = role.id;

    const user = await prisma.user.create({
      data: {
        first_name: 'Test',
        last_name: 'User',
        email: `test-user-${Date.now()}@example.com`,
        password_hash: 'hashed_password',
      },
    });
    testUserId = user.id;

    const employee = await prisma.company_employee.create({
      data: {
        company_id: testCompanyId,
        user_id: testUserId,
        role_id: testRoleId,
      },
    });
    testEmployeeId = employee.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    await prisma.shift.deleteMany({ where: { company_employee_id: testEmployeeId } });
    await prisma.company_employee.deleteMany({ where: { company_id: testCompanyId } });
    await prisma.role.deleteMany({ where: { company_id: testCompanyId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.company.deleteMany({ where: { id: testCompanyId } });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up shifts after each test
    await prisma.shift.deleteMany({ where: { company_employee_id: testEmployeeId } });
  });

  describe('Duplicate Prevention', () => {
    it('should prevent creating exact duplicate shifts', async () => {
      // Create first shift
      const shiftData = {
        company_employee_id: testEmployeeId,
        shift_date: '2025-08-15',
        start_time: '09:00',
        end_time: '17:00',
      };

      const firstShift = await shift_service.create(shiftData, testCompanyId);
      expect(firstShift).toBeDefined();
      expect(firstShift.id).toBeGreaterThan(0);

      // Attempt to create duplicate shift (should throw)
      await expect(
        shift_service.create(shiftData, testCompanyId)
      ).rejects.toThrow('SHIFT_DUPLICATE_EXACT');
    });

    it('should allow shifts with different times on same day', async () => {
      // Create morning shift
      const morningShift = await shift_service.create({
        company_employee_id: testEmployeeId,
        shift_date: '2025-08-15',
        start_time: '09:00',
        end_time: '13:00',
      }, testCompanyId);
      expect(morningShift).toBeDefined();

      // Create afternoon shift (different times - should succeed)
      const afternoonShift = await shift_service.create({
        company_employee_id: testEmployeeId,
        shift_date: '2025-08-15',
        start_time: '14:00',
        end_time: '18:00',
      }, testCompanyId);
      expect(afternoonShift).toBeDefined();
      expect(afternoonShift.id).not.toBe(morningShift.id);
    });

    it('should allow same shift times for different employees', async () => {
      // Create second employee
      const user2 = await prisma.user.create({
        data: {
          first_name: 'Second',
          last_name: 'Employee',
          email: `test-user-2-${Date.now()}@example.com`,
          password_hash: 'hashed_password',
        },
      });

      const employee2 = await prisma.company_employee.create({
        data: {
          company_id: testCompanyId,
          user_id: user2.id,
          role_id: testRoleId,
        },
      });

      // Create shift for first employee
      const shift1 = await shift_service.create({
        company_employee_id: testEmployeeId,
        shift_date: '2025-08-15',
        start_time: '09:00',
        end_time: '17:00',
      }, testCompanyId);
      expect(shift1).toBeDefined();

      // Create same shift for second employee (should succeed)
      const shift2 = await shift_service.create({
        company_employee_id: employee2.id,
        shift_date: '2025-08-15',
        start_time: '09:00',
        end_time: '17:00',
      }, testCompanyId);
      expect(shift2).toBeDefined();
      expect(shift2.id).not.toBe(shift1.id);

      // Cleanup
      await prisma.shift.deleteMany({ where: { company_employee_id: employee2.id } });
      await prisma.company_employee.delete({ where: { id: employee2.id } });
      await prisma.user.delete({ where: { id: user2.id } });
    });
  });

  describe('Soft Delete Behavior', () => {
    it('should allow recreating a soft-deleted shift', async () => {
      // Create shift
      const shift = await shift_service.create({
        company_employee_id: testEmployeeId,
        shift_date: '2025-08-15',
        start_time: '09:00',
        end_time: '17:00',
      }, testCompanyId);
      expect(shift).toBeDefined();

      // Soft delete the shift
      await shift_service.delete(shift.id, testCompanyId);

      // Verify it's soft deleted
      const deletedShift = await prisma.shift.findUnique({
        where: { id: shift.id },
      });
      expect(deletedShift?.deleted_at).not.toBeNull();

      // Recreate the same shift (should succeed because deleted_at differs)
      const recreatedShift = await shift_service.create({
        company_employee_id: testEmployeeId,
        shift_date: '2025-08-15',
        start_time: '09:00',
        end_time: '17:00',
      }, testCompanyId);
      expect(recreatedShift).toBeDefined();
      expect(recreatedShift.id).not.toBe(shift.id);
      expect(recreatedShift.deleted_at).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should return proper error code for duplicate attempts', async () => {
      // Create first shift
      await shift_service.create({
        company_employee_id: testEmployeeId,
        shift_date: '2025-08-15',
        start_time: '09:00',
        end_time: '17:00',
      }, testCompanyId);

      // Attempt duplicate (catch error and verify code)
      try {
        await shift_service.create({
          company_employee_id: testEmployeeId,
          shift_date: '2025-08-15',
          start_time: '09:00',
          end_time: '17:00',
        }, testCompanyId);
        fail('Should have thrown SHIFT_DUPLICATE_EXACT error');
      } catch (error: any) {
        expect(error.message).toBe('SHIFT_DUPLICATE_EXACT');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should distinguish shifts with same times but different dates', async () => {
      // Create shift on day 1
      const shift1 = await shift_service.create({
        company_employee_id: testEmployeeId,
        shift_date: '2025-08-15',
        start_time: '09:00',
        end_time: '17:00',
      }, testCompanyId);
      expect(shift1).toBeDefined();

      // Create shift on day 2 (same times, different date - should succeed)
      const shift2 = await shift_service.create({
        company_employee_id: testEmployeeId,
        shift_date: '2025-08-16',
        start_time: '09:00',
        end_time: '17:00',
      }, testCompanyId);
      expect(shift2).toBeDefined();
      expect(shift2.id).not.toBe(shift1.id);
    });

    it('should distinguish shifts with different notes but same time', async () => {
      // First shift with note
      const shift1 = await shift_service.create({
        company_employee_id: testEmployeeId,
        shift_date: '2025-08-15',
        start_time: '09:00',
        end_time: '17:00',
        notes: 'Morning shift',
      }, testCompanyId);
      expect(shift1).toBeDefined();

      // Duplicate attempt even with different notes (should still fail)
      // Notes are NOT part of uniqueness constraint
      await expect(
        shift_service.create({
          company_employee_id: testEmployeeId,
          shift_date: '2025-08-15',
          start_time: '09:00',
          end_time: '17:00',
          notes: 'Different note',
        }, testCompanyId)
      ).rejects.toThrow('SHIFT_DUPLICATE_EXACT');
    });
  });
});
