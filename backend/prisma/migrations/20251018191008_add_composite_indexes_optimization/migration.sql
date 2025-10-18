-- Migration: Add Composite Indexes for Performance Optimization
-- Reference: PLAN.md Section 1.1 - Database Indexes and Optimization
-- Impact: 60-80% performance improvement on filtered queries
-- Created: 2025-10-18

-- ============================================================================
-- SHIFT TABLE: Composite indexes for status filtering and temporal searches
-- ============================================================================

-- Index for filtering shifts by employee + status + soft delete
-- Use case: GET /shifts?status=confirmed (filtered by active status)
CREATE INDEX "idx_shift_employee_status_deleted" ON "shift"("company_employee_id", "status", "deleted_at");

-- Index for temporal searches with start_time
-- Use case: Finding shifts by date range with time sorting
CREATE INDEX "idx_shift_date_time_deleted" ON "shift"("shift_date", "start_time", "deleted_at");

-- ============================================================================
-- COMPANY_EMPLOYEE TABLE: Composite index for fast lookups
-- ============================================================================

-- Index for fast company+user lookups (common in authentication/authorization)
-- Use case: Verifying employee belongs to company
CREATE INDEX "idx_company_employee_lookup" ON "company_employee"("company_id", "user_id", "deleted_at");

-- ============================================================================
-- SHIFT_TEMPLATE TABLE: Composite index for name searches
-- ============================================================================

-- Index for template search by name within company
-- Use case: GET /shift-templates?search=morning
CREATE INDEX "idx_shift_template_name_search" ON "shift_template"("company_id", "name", "deleted_at");

-- ============================================================================
-- NOTES:
-- - All indexes include 'deleted_at' for soft delete filtering
-- - Indexes are named explicitly for clarity and maintainability
-- - These complement existing indexes (not replacements)
-- ============================================================================
