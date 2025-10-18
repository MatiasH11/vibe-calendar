-- Migration: Add Unique Constraint to Prevent Duplicate Shifts
-- Reference: PLAN.md Section 1.2 - Database Uniqueness Constraint
-- Impact: Medium - Prevents duplicate shifts at database level
-- Created: 2025-10-18

-- ============================================================================
-- SHIFT TABLE: Add unique constraint for duplicate prevention
-- ============================================================================

-- Constraint prevents exact duplicates:
-- - Same employee (company_employee_id)
-- - Same date (shift_date)
-- - Same start time (start_time)
-- - Same end time (end_time)
-- - Same deleted state (deleted_at)
--
-- This allows:
-- ✓ Multiple shifts for same employee on same day (different times)
-- ✓ Same shift times for different employees
-- ✓ "Re-creating" a shift that was previously soft-deleted
--
-- This prevents:
-- ✗ Exact duplicate active shifts (accidental double-clicks)
-- ✗ Conflicting bulk operations creating duplicates

CREATE UNIQUE INDEX "unique_shift_constraint" ON "shift"(
  "company_employee_id",
  "shift_date",
  "start_time",
  "end_time",
  "deleted_at"
);

-- ============================================================================
-- NOTES:
-- - Using UNIQUE INDEX instead of UNIQUE CONSTRAINT for PostgreSQL compatibility
-- - Including deleted_at allows "re-creating" previously deleted shifts
-- - If deleted_at is NULL, two shifts with same values will violate constraint
-- - If one has deleted_at=NULL and other has deleted_at=timestamp, both allowed
-- ============================================================================
