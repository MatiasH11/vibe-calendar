import { prisma } from '../config/prisma_client';
import {
  ResourceNotFoundError,
  UnauthorizedCompanyAccessError,
  TransactionFailedError,
} from '../errors';

export const shift_requirement_position_service = {
  /**
   * Get all positions for a specific requirement
   */
  async getByRequirementId(requirement_id: number, company_id: number) {
    // Verify requirement belongs to company
    const requirement = await prisma.shift_requirement.findFirst({
      where: { id: requirement_id, company_id, deleted_at: null },
    });

    if (!requirement) {
      throw new ResourceNotFoundError('Shift Requirement', requirement_id);
    }

    const positions = await prisma.shift_requirement_position.findMany({
      where: { requirement_id },
      include: {
        job_position: {
          select: {
            id: true,
            name: true,
            description: true,
            department_id: true,
            color: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return { success: true, data: positions };
  },

  /**
   * Add position requirement to a shift requirement
   */
  async addPosition(
    requirement_id: number,
    job_position_id: number,
    required_count: number,
    company_id: number,
    user_id: number
  ) {
    try {
      // Verify requirement exists and belongs to company
      const requirement = await prisma.shift_requirement.findFirst({
        where: { id: requirement_id, company_id, deleted_at: null },
      });

      if (!requirement) {
        throw new ResourceNotFoundError('Shift Requirement', requirement_id);
      }

      // Verify job_position exists and belongs to company
      const jobPosition = await prisma.job_position.findFirst({
        where: { id: job_position_id, company_id, deleted_at: null },
      });

      if (!jobPosition) {
        throw new ResourceNotFoundError('Job Position', job_position_id);
      }

      // Check if position already exists for this requirement
      const existing = await prisma.shift_requirement_position.findFirst({
        where: {
          requirement_id,
          job_position_id,
        },
      });

      if (existing) {
        throw new Error('This position is already assigned to this requirement');
      }

      const result = await prisma.$transaction(async (tx) => {
        // Create position requirement
        const position = await tx.shift_requirement_position.create({
          data: {
            requirement_id,
            job_position_id,
            required_count,
            filled_count: 0,
          },
          include: {
            job_position: true,
          },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'CREATE',
            entity_type: 'shift_requirement_position',
            entity_id: position.id,
            new_values: {
              requirement_id,
              job_position_id,
              required_count,
            },
          },
        });

        return position;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Add position transaction failed:', e);
      if (e instanceof Error && e.message.includes('already assigned')) {
        throw e;
      }
      throw new TransactionFailedError('Position requirement creation');
    }
  },

  /**
   * Update position requirement
   */
  async updatePosition(
    position_id: number,
    required_count: number,
    company_id: number,
    user_id: number
  ) {
    try {
      // Verify position exists by checking requirement belongs to company
      const position = await prisma.shift_requirement_position.findFirst({
        where: {
          id: position_id,
          requirement: {
            company_id,
            deleted_at: null,
          },
        },
        include: {
          requirement: true,
        },
      });

      if (!position) {
        throw new ResourceNotFoundError('Shift Requirement Position', position_id);
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update position
        const updated = await tx.shift_requirement_position.update({
          where: { id: position_id },
          data: { required_count },
          include: {
            job_position: true,
          },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'UPDATE',
            entity_type: 'shift_requirement_position',
            entity_id: position_id,
            old_values: {
              required_count: position.required_count,
            },
            new_values: {
              required_count,
            },
          },
        });

        return updated;
      });

      return { success: true, data: result };
    } catch (e) {
      console.error('Update position transaction failed:', e);
      throw new TransactionFailedError('Position requirement update');
    }
  },

  /**
   * Remove position requirement from a shift requirement
   */
  async removePosition(position_id: number, company_id: number, user_id: number) {
    try {
      // Verify position exists by checking requirement belongs to company
      const position = await prisma.shift_requirement_position.findFirst({
        where: {
          id: position_id,
          requirement: {
            company_id,
            deleted_at: null,
          },
        },
        include: {
          requirement: true,
        },
      });

      if (!position) {
        throw new ResourceNotFoundError('Shift Requirement Position', position_id);
      }

      // Check if there are assigned shifts for this position
      const assignedShifts = await prisma.shift.findMany({
        where: {
          position_id,
          deleted_at: null,
        },
      });

      if (assignedShifts.length > 0) {
        throw new Error(
          `Cannot remove position with ${assignedShifts.length} assigned shift(s). Delete shifts first.`
        );
      }

      await prisma.$transaction(async (tx) => {
        // Delete position requirement
        await tx.shift_requirement_position.delete({
          where: { id: position_id },
        });

        // Create audit log
        await tx.audit_log.create({
          data: {
            user_id,
            company_id,
            action: 'DELETE',
            entity_type: 'shift_requirement_position',
            entity_id: position_id,
            old_values: {
              requirement_id: position.requirement_id,
              job_position_id: position.job_position_id,
              required_count: position.required_count,
              filled_count: position.filled_count,
            },
          },
        });
      });

      return { success: true, message: 'Position requirement removed successfully' };
    } catch (e) {
      console.error('Remove position transaction failed:', e);
      if (e instanceof Error && e.message.includes('Cannot remove')) {
        throw e;
      }
      throw new TransactionFailedError('Position requirement removal');
    }
  },

  /**
   * Increment filled count when a shift is assigned
   */
  async incrementFilledCount(position_id: number, company_id: number) {
    try {
      // Verify position exists by checking requirement belongs to company
      const position = await prisma.shift_requirement_position.findFirst({
        where: {
          id: position_id,
          requirement: {
            company_id,
            deleted_at: null,
          },
        },
      });

      if (!position) {
        throw new ResourceNotFoundError('Shift Requirement Position', position_id);
      }

      const updated = await prisma.shift_requirement_position.update({
        where: { id: position_id },
        data: {
          filled_count: {
            increment: 1,
          },
        },
      });

      return { success: true, data: updated };
    } catch (e) {
      console.error('Increment filled count failed:', e);
      throw new TransactionFailedError('Filled count increment');
    }
  },

  /**
   * Decrement filled count when a shift is removed
   */
  async decrementFilledCount(position_id: number, company_id: number) {
    try {
      // Verify position exists by checking requirement belongs to company
      const position = await prisma.shift_requirement_position.findFirst({
        where: {
          id: position_id,
          requirement: {
            company_id,
            deleted_at: null,
          },
        },
      });

      if (!position) {
        throw new ResourceNotFoundError('Shift Requirement Position', position_id);
      }

      // Prevent going below 0
      if (position.filled_count === 0) {
        console.warn(
          `Attempt to decrement filled_count below 0 for position ${position_id}`
        );
        return { success: true, data: position };
      }

      const updated = await prisma.shift_requirement_position.update({
        where: { id: position_id },
        data: {
          filled_count: {
            decrement: 1,
          },
        },
      });

      return { success: true, data: updated };
    } catch (e) {
      console.error('Decrement filled count failed:', e);
      throw new TransactionFailedError('Filled count decrement');
    }
  },

  /**
   * Get requirement status based on position fill status
   */
  async getRequirementStatus(requirement_id: number) {
    try {
      const positions = await prisma.shift_requirement_position.findMany({
        where: { requirement_id },
      });

      if (positions.length === 0) {
        return { status: 'open', message: 'No positions defined' };
      }

      let allFilled = true;
      let someFilled = false;

      for (const pos of positions) {
        if (pos.filled_count >= pos.required_count) {
          someFilled = true;
        } else {
          allFilled = false;
        }
      }

      const status = allFilled ? 'filled' : someFilled ? 'partial' : 'open';
      return { status, message: `Requirement is ${status}` };
    } catch (e) {
      console.error('Get requirement status failed:', e);
      throw new TransactionFailedError('Requirement status calculation');
    }
  },

  /**
   * Update requirement status in database
   */
  async updateRequirementStatus(requirement_id: number, company_id: number) {
    try {
      // Get current status
      const statusResult = await this.getRequirementStatus(requirement_id);
      const newStatus = statusResult.status as
        | 'open'
        | 'partial'
        | 'filled'
        | 'cancelled';

      // Update requirement status
      const updated = await prisma.shift_requirement.update({
        where: { id: requirement_id },
        data: {
          status: newStatus,
        },
      });

      return { success: true, data: updated };
    } catch (e) {
      console.error('Update requirement status failed:', e);
      throw new TransactionFailedError('Requirement status update');
    }
  },
};
