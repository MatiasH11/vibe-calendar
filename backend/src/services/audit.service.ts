/**
 * Audit Service - System-wide audit logging
 * Reference: PLAN.md Section 2.2
 *
 * Provides centralized audit logging for compliance and debugging.
 * Tracks CREATE, UPDATE, DELETE operations on critical entities.
 */

import { prisma } from '../config/prisma_client';
import { audit_action } from '@prisma/client';

// Type definitions for audit logging
export interface AuditLogData {
  user_id: number;
  company_id: number;
  action: audit_action;
  entity_type: string;
  entity_id?: number;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditQueryFilters {
  company_id?: number;
  user_id?: number;
  action?: audit_action;
  entity_type?: string;
  entity_id?: number;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export const audit_service = {
  /**
   * Create an audit log entry
   *
   * @param data - Audit log data including user, action, and changes
   * @returns Created audit log entry
   */
  async log(data: AuditLogData) {
    try {
      return await prisma.audit_log.create({
        data: {
          user_id: data.user_id,
          company_id: data.company_id,
          action: data.action,
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          old_values: data.old_values || null,
          new_values: data.new_values || null,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
        },
      });
    } catch (error) {
      // Log error but don't throw - audit logging should never break business logic
      console.error('[Audit Service] Failed to create audit log:', error);
      return null;
    }
  },

  /**
   * Log CREATE action
   *
   * @param user_id - User who performed the action
   * @param company_id - Company context
   * @param entity_type - Type of entity created (e.g., "shift", "employee")
   * @param entity_id - ID of created entity
   * @param new_values - Created entity data
   * @param ip_address - Optional IP address
   * @param user_agent - Optional user agent string
   */
  async logCreate(
    user_id: number,
    company_id: number,
    entity_type: string,
    entity_id: number,
    new_values: Record<string, any>,
    ip_address?: string,
    user_agent?: string
  ) {
    return this.log({
      user_id,
      company_id,
      action: 'CREATE',
      entity_type,
      entity_id,
      new_values,
      ip_address,
      user_agent,
    });
  },

  /**
   * Log UPDATE action
   *
   * @param user_id - User who performed the action
   * @param company_id - Company context
   * @param entity_type - Type of entity updated
   * @param entity_id - ID of updated entity
   * @param old_values - Previous state
   * @param new_values - New state
   * @param ip_address - Optional IP address
   * @param user_agent - Optional user agent string
   */
  async logUpdate(
    user_id: number,
    company_id: number,
    entity_type: string,
    entity_id: number,
    old_values: Record<string, any>,
    new_values: Record<string, any>,
    ip_address?: string,
    user_agent?: string
  ) {
    return this.log({
      user_id,
      company_id,
      action: 'UPDATE',
      entity_type,
      entity_id,
      old_values,
      new_values,
      ip_address,
      user_agent,
    });
  },

  /**
   * Log DELETE action (soft or hard delete)
   *
   * @param user_id - User who performed the action
   * @param company_id - Company context
   * @param entity_type - Type of entity deleted
   * @param entity_id - ID of deleted entity
   * @param old_values - Entity state before deletion
   * @param ip_address - Optional IP address
   * @param user_agent - Optional user agent string
   */
  async logDelete(
    user_id: number,
    company_id: number,
    entity_type: string,
    entity_id: number,
    old_values: Record<string, any>,
    ip_address?: string,
    user_agent?: string
  ) {
    return this.log({
      user_id,
      company_id,
      action: 'DELETE',
      entity_type,
      entity_id,
      old_values,
      ip_address,
      user_agent,
    });
  },

  /**
   * Log LOGIN action
   *
   * @param user_id - User who logged in
   * @param company_id - Company context
   * @param ip_address - IP address of login
   * @param user_agent - User agent string
   */
  async logLogin(
    user_id: number,
    company_id: number,
    ip_address?: string,
    user_agent?: string
  ) {
    return this.log({
      user_id,
      company_id,
      action: 'LOGIN',
      entity_type: 'auth',
      ip_address,
      user_agent,
    });
  },

  /**
   * Log LOGOUT action
   *
   * @param user_id - User who logged out
   * @param company_id - Company context
   * @param ip_address - IP address
   * @param user_agent - User agent string
   */
  async logLogout(
    user_id: number,
    company_id: number,
    ip_address?: string,
    user_agent?: string
  ) {
    return this.log({
      user_id,
      company_id,
      action: 'LOGOUT',
      entity_type: 'auth',
      ip_address,
      user_agent,
    });
  },

  /**
   * Query audit logs with filters and pagination
   *
   * @param filters - Query filters (company, user, date range, etc.)
   * @returns Paginated audit logs
   */
  async query(filters: AuditQueryFilters) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    // Build WHERE clause dynamically
    const where: any = {};

    if (filters.company_id) {
      where.company_id = filters.company_id;
    }

    if (filters.user_id) {
      where.user_id = filters.user_id;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.entity_type) {
      where.entity_type = filters.entity_type;
    }

    if (filters.entity_id) {
      where.entity_id = filters.entity_id;
    }

    // Date range filter
    if (filters.start_date || filters.end_date) {
      where.created_at = {};
      if (filters.start_date) {
        where.created_at.gte = new Date(filters.start_date);
      }
      if (filters.end_date) {
        where.created_at.lte = new Date(filters.end_date);
      }
    }

    // Execute query with pagination
    const [logs, total] = await Promise.all([
      prisma.audit_log.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.audit_log.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * Get audit trail for a specific entity
   *
   * @param entity_type - Type of entity (e.g., "shift")
   * @param entity_id - ID of entity
   * @param company_id - Company context for security
   * @returns Chronological audit trail
   */
  async getEntityHistory(
    entity_type: string,
    entity_id: number,
    company_id: number
  ) {
    return prisma.audit_log.findMany({
      where: {
        entity_type,
        entity_id,
        company_id, // Security: only return logs for entities in this company
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'asc' }, // Chronological order
    });
  },

  /**
   * Get recent audit logs for a company (dashboard widget)
   *
   * @param company_id - Company ID
   * @param limit - Number of recent logs to fetch (default: 10)
   * @returns Recent audit logs
   */
  async getRecentLogs(company_id: number, limit: number = 10) {
    return prisma.audit_log.findMany({
      where: { company_id },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  },

  /**
   * Get audit statistics for a company
   *
   * @param company_id - Company ID
   * @param start_date - Optional start date filter
   * @param end_date - Optional end date filter
   * @returns Audit statistics grouped by action type
   */
  async getStatistics(
    company_id: number,
    start_date?: string,
    end_date?: string
  ) {
    const where: any = { company_id };

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.gte = new Date(start_date);
      if (end_date) where.created_at.lte = new Date(end_date);
    }

    const stats = await prisma.audit_log.groupBy({
      by: ['action'],
      where,
      _count: {
        id: true,
      },
    });

    return stats.map((stat) => ({
      action: stat.action,
      count: stat._count.id,
    }));
  },
};
