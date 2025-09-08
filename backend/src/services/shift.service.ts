import { prisma } from '../config/prisma_client';
import { create_shift_body, get_shifts_query, update_shift_body } from '../validations/shift.validation';

// Función para convertir tiempo UTC a DateTime (para almacenar en BD)
const utcTimeToDateTime = (utcTime: string): Date => {
  // Crear un DateTime con fecha fija (1970-01-01) y la hora UTC
  return new Date(`1970-01-01T${utcTime}:00.000Z`);
};

// Función para convertir DateTime a tiempo UTC (para devolver al frontend)
const dateTimeToUtcTime = (dateTime: Date): string => {
  return dateTime.toISOString().substring(11, 16);
};

const validateTimeFormat = (time: string): boolean => {
  return /^\d{2}:\d{2}$/.test(time);
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

    // 2) Validaciones de formato y hora (no overnight)
    if (!validateTimeFormat(data.start_time) || !validateTimeFormat(data.end_time)) {
      throw new Error('INVALID_TIME_FORMAT');
    }
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

      // El frontend ya envía tiempos UTC, solo validar formato
      if (!validateTimeFormat(data.start_time) || !validateTimeFormat(data.end_time)) {
        throw new Error('INVALID_TIME_FORMAT');
      }
      
      // Validar solapamiento con tiempos UTC
      for (const s of existing) {
        const sStart = dateTimeToUtcTime(s.start_time as Date);
        const sEnd = dateTimeToUtcTime(s.end_time as Date);
        if (overlap(data.start_time, data.end_time, sStart, sEnd)) {
          throw new Error('SHIFT_OVERLAP');
        }
      }

      // 4) Crear el turno con tiempos UTC (convertir a DateTime para BD)
      const created = await tx.shift.create({
        data: {
          company_employee_id: data.company_employee_id,
          shift_date: new Date(data.shift_date),
          start_time: utcTimeToDateTime(data.start_time),
          end_time: utcTimeToDateTime(data.end_time),
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
    
    const shifts = await prisma.shift.findMany({
      where,
      include: { company_employee: { include: { user: true } } },
    });
    
    // Devolver tiempos UTC al frontend (el frontend se encarga de la conversión)
    return shifts.map(shift => ({
      ...shift,
      start_time: dateTimeToUtcTime(shift.start_time as Date),
      end_time: dateTimeToUtcTime(shift.end_time as Date),
    }));
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
    
    // Convertir tiempos locales a UTC si se proporcionan
    let nextStart: string;
    let nextEnd: string;
    
    if (data.start_time) {
      if (!validateTimeFormat(data.start_time)) {
        throw new Error('INVALID_START_TIME_FORMAT');
      }
      nextStart = data.start_time;
    } else {
      nextStart = utcTimeToLocal(target.start_time as Date, target.shift_date);
    }
    
    if (data.end_time) {
      if (!validateTimeFormat(data.end_time)) {
        throw new Error('INVALID_END_TIME_FORMAT');
      }
      nextEnd = data.end_time;
    } else {
      nextEnd = utcTimeToLocal(target.end_time as Date, target.shift_date);
    }
    
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
          const sStart = utcTimeToLocal(s.start_time as Date, s.shift_date);
          const sEnd = utcTimeToLocal(s.end_time as Date, s.shift_date);
          if (overlap(nextStart, nextEnd, sStart, sEnd)) {
            throw new Error('SHIFT_OVERLAP');
          }
        }
      }

      // Convertir tiempos locales a UTC para almacenar
      const utcStart = data.start_time ? localTimeToUTC(data.start_time, nextDate) : undefined;
      const utcEnd = data.end_time ? localTimeToUTC(data.end_time, nextDate) : undefined;
      
      const updated = await tx.shift.update({
        where: { id: shift_id },
        data: {
          shift_date: nextDate,
          start_time: utcStart,
          end_time: utcEnd,
          notes: data.notes ?? undefined,
        },
      });
      
      // Convertir tiempos UTC a local para devolver
      return {
        ...updated,
        start_time: utcTimeToLocal(updated.start_time as Date, updated.shift_date),
        end_time: utcTimeToLocal(updated.end_time as Date, updated.shift_date),
      };
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


