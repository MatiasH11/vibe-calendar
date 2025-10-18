-- Migration: Add Audit Log System for Compliance and Debugging
-- Reference: PLAN.md Section 2.1
-- Impact: High - Full traceability of system changes
-- Created: 2025-10-18

-- ============================================================================
-- ENUM: audit_action
-- ============================================================================

-- Define audit action types
CREATE TYPE "audit_action" AS ENUM (
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
  'IMPORT'
);

-- ============================================================================
-- TABLE: audit_log
-- ============================================================================

-- Main audit log table for tracking all critical system changes
CREATE TABLE "audit_log" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "company_id" INTEGER NOT NULL,
  "action" "audit_action" NOT NULL,
  "entity_type" TEXT NOT NULL,              -- e.g., "shift", "employee", "role"
  "entity_id" INTEGER,                      -- ID of affected entity (nullable for actions like LOGIN)
  "old_values" JSONB,                       -- Previous state (for UPDATE/DELETE)
  "new_values" JSONB,                       -- New state (for CREATE/UPDATE)
  "ip_address" VARCHAR(45),                 -- IPv4 (15 chars) or IPv6 (45 chars)
  "user_agent" TEXT,                        -- Browser/client information
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraints
  CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "audit_log_company_id_fkey" FOREIGN KEY ("company_id")
    REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================================================
-- INDEXES: Optimized for common audit queries
-- ============================================================================

-- Index for queries filtered by company and sorted by date (most common)
-- Use case: GET /api/v1/audit?company_id=1&sort=created_at:desc
CREATE INDEX "idx_audit_company_date" ON "audit_log"("company_id", "created_at" DESC);

-- Index for queries filtered by user and sorted by date
-- Use case: GET /api/v1/audit?user_id=5&sort=created_at:desc
CREATE INDEX "idx_audit_user_date" ON "audit_log"("user_id", "created_at" DESC);

-- Index for querying audit trail of specific entities
-- Use case: GET /api/v1/audit/entity/shift/123
CREATE INDEX "idx_audit_entity" ON "audit_log"("entity_type", "entity_id");

-- Index for filtering by action type and date
-- Use case: GET /api/v1/audit?action=DELETE&sort=created_at:desc
CREATE INDEX "idx_audit_action_date" ON "audit_log"("action", "created_at" DESC);

-- ============================================================================
-- NOTES:
-- - JSONB used for old_values/new_values (efficient storage + queryable)
-- - created_at uses TIMESTAMP(3) for millisecond precision
-- - Indexes designed for most common query patterns
-- - CASCADE delete ensures orphaned audit logs are removed
-- - ip_address supports both IPv4 and IPv6
-- ============================================================================
