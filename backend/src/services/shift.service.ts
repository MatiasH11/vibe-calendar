import { prisma } from '../config/prisma_client';
import { create_shift_body, get_shifts_query, update_shift_body } from '../validations/shift.validation';

const toTime = (hhmm: string): Date => {
  // Para PostgreSQL TIME con Prisma, necesitamos crear un DateTime completo
  // Prisma extraerá la parte de tiempo automáticamente
  if (hhmm.match(/^\d{2}:\d{2}$/)) {
    // Crear un DateTime con fecha fija (1970-01-01) y la hora específica
    return new Date(`1970-01-01T${hhmm}:00.000Z`);
  }
  // Si ya es un formato de tiempo completo, intentar parsearlo
  return new Date(`1970-01-01T${hhmm}.000Z`);
};

const timeLess = (a: string, b: string) => a < b;
const overlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) => {
  // medio-abiertos [start, end)
  return aStart < bEnd && bStart < aEnd;
};

export const shift_service = {
  async create(data: create_shift_body, admin_company_id: number) {
    // 1) Pertenencia de empleado a la misma company
    const employee = await prisma.company_employee.findFirst({
      where: { id: data.company_employee_id, company_id: admin_company_id, deleted_at: null },
    });
    if (!employee) {
      throw new Error('UNAUTHORIZED_COMPANY_ACCESS');
    }

    // 2) Validaciones de hora (no overnight)
    if (!timeLess(data.start_time, data.end_time)) {
      throw new Error('OVERNIGHT_NOT_ALLOWED');
    }

    return prisma.$transaction(async (tx) => {
      // 3) Validación de no solapamiento [start, end) para el mismo día
      const existing = await tx.shift.findMany({
        where: {
          company_employee_id: data.company_employee_id,
          shift_date: new Date(data.shift_date),
          deleted_at: null,
        },
      });

      const newStart = toTime(data.start_time);
      const newEnd = toTime(data.end_time);
      for (const s of existing) {
        const sStart = s.start_time as unknown as string;
        const sEnd = s.end_time as unknown as string;
        if (overlap(data.start_time, data.end_time, sStart, sEnd)) {
          throw new Error('SHIFT_OVERLAP');
        }
      }

      const created = await tx.shift.create({
        data: {
          company_employee_id: data.company_employee_id,
          shift_date: new Date(data.shift_date),
          start_time: newStart,
          end_time: newEnd,
          notes: data.notes,
        },
      });
      return created;
    });
  },

  async find_by_company(query: get_shifts_query, company_id: number) {
    const where: any = {
      company_employee: { company_id },
      deleted_at: null,
    };
    if (query.start_date && query.end_date) {
      where.shift_date = {
        gte: new Date(query.start_date),
        lte: new Date(query.end_date),
      };
    }
    return prisma.shift.findMany({
      where,
      include: { company_employee: { include: { user: true } } },
    });
  },

  async update(shift_id: number, data: update_shift_body, admin_company_id: number) {
    // 1) Verificar pertenencia
    const target = await prisma.shift.findUnique({
      where: { id: shift_id },
      include: { company_employee: true },
    });
    if (!target || target.company_employee.company_id !== admin_company_id) {
      throw new Error('UNAUTHORIZED_COMPANY_ACCESS');
    }

    const nextDate = data.shift_date ? new Date(data.shift_date) : target.shift_date;
    const nextStart = data.start_time ?? (target.start_time as unknown as string);
    const nextEnd = data.end_time ?? (target.end_time as unknown as string);
    if (!timeLess(nextStart, nextEnd)) {
      throw new Error('OVERNIGHT_NOT_ALLOWED');
    }

    return prisma.$transaction(async (tx) => {
      // Validar solapamiento si cambian fecha u horas
      if (data.shift_date || data.start_time || data.end_time) {
        const existing = await tx.shift.findMany({
          where: {
            company_employee_id: target.company_employee_id,
            shift_date: nextDate,
            deleted_at: null,
            NOT: { id: shift_id },
          },
        });
        for (const s of existing) {
          const sStart = s.start_time as unknown as string;
          const sEnd = s.end_time as unknown as string;
          if (overlap(nextStart, nextEnd, sStart, sEnd)) {
            throw new Error('SHIFT_OVERLAP');
          }
        }
      }

      const updated = await tx.shift.update({
        where: { id: shift_id },
        data: {
          shift_date: nextDate,
          start_time: data.start_time ? toTime(data.start_time) : undefined,
          end_time: data.end_time ? toTime(data.end_time) : undefined,
          notes: data.notes ?? undefined,
        },
      });
      return updated;
    });
  },

  async delete(shift_id: number, admin_company_id: number) {
    const target = await prisma.shift.findUnique({
      where: { id: shift_id },
      include: { company_employee: true },
    });
    if (!target || target.company_employee.company_id !== admin_company_id) {
      throw new Error('UNAUTHORIZED_COMPANY_ACCESS');
    }
    await prisma.shift.update({ where: { id: shift_id }, data: { deleted_at: new Date() } });
  },
};


