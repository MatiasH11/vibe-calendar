-- =====================================================
-- MIGRATION: Remove Deprecated Scheduling System
-- =====================================================
-- Removes deprecated entities:
--   - scheduling_batch (deprecated batch system)
--   - scheduling_template (deprecated template system)
--   - shift_requirement (deprecated requirements system)
--   - shift_requirement_position (deprecated position tracking)
--   - shift_template (old template system, replaced by template_shift)
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Drop foreign key constraints
-- =====================================================

-- Drop shift.position_id constraint (references shift_requirement_position)
ALTER TABLE "shift" DROP CONSTRAINT IF EXISTS "shift_position_id_fkey";
ALTER TABLE "shift" DROP COLUMN IF EXISTS "position_id";

-- Drop shift_requirement foreign keys
ALTER TABLE "shift_requirement" DROP CONSTRAINT IF EXISTS "shift_requirement_batch_id_fkey";
ALTER TABLE "shift_requirement" DROP CONSTRAINT IF EXISTS "shift_requirement_company_id_fkey";
ALTER TABLE "shift_requirement" DROP CONSTRAINT IF EXISTS "shift_requirement_location_id_fkey";
ALTER TABLE "shift_requirement" DROP CONSTRAINT IF EXISTS "shift_requirement_department_id_fkey";

-- Drop shift_requirement_position foreign keys
ALTER TABLE "shift_requirement_position" DROP CONSTRAINT IF EXISTS "shift_requirement_position_requirement_id_fkey";
ALTER TABLE "shift_requirement_position" DROP CONSTRAINT IF EXISTS "shift_requirement_position_job_position_id_fkey";

-- Drop scheduling_batch foreign keys
ALTER TABLE "scheduling_batch" DROP CONSTRAINT IF EXISTS "scheduling_batch_company_id_fkey";
ALTER TABLE "scheduling_batch" DROP CONSTRAINT IF EXISTS "scheduling_batch_location_id_fkey";
ALTER TABLE "scheduling_batch" DROP CONSTRAINT IF EXISTS "scheduling_batch_template_id_fkey";
ALTER TABLE "scheduling_batch" DROP CONSTRAINT IF EXISTS "scheduling_batch_created_by_fkey";

-- Drop scheduling_template foreign keys
ALTER TABLE "scheduling_template" DROP CONSTRAINT IF EXISTS "scheduling_template_company_id_fkey";
ALTER TABLE "scheduling_template" DROP CONSTRAINT IF EXISTS "scheduling_template_location_id_fkey";
ALTER TABLE "scheduling_template" DROP CONSTRAINT IF EXISTS "scheduling_template_created_by_fkey";

-- Drop shift_template foreign keys
ALTER TABLE "shift_template" DROP CONSTRAINT IF EXISTS "shift_template_company_id_fkey";
ALTER TABLE "shift_template" DROP CONSTRAINT IF EXISTS "shift_template_created_by_fkey";

-- =====================================================
-- STEP 2: Drop indexes
-- =====================================================

-- Drop shift indexes related to position_id
DROP INDEX IF EXISTS "idx_shift_position_status";

-- Drop shift_requirement indexes
DROP INDEX IF EXISTS "idx_shift_requirement_batch";
DROP INDEX IF EXISTS "idx_shift_requirement_company_date";
DROP INDEX IF EXISTS "idx_shift_requirement_location_date";

-- Drop shift_requirement_position indexes
DROP INDEX IF EXISTS "idx_shift_requirement_position_requirement";
DROP INDEX IF EXISTS "shift_requirement_position_requirement_id_job_position_id_key";

-- Drop scheduling_batch indexes
DROP INDEX IF EXISTS "idx_scheduling_batch_company_date";
DROP INDEX IF EXISTS "idx_scheduling_batch_status_location";

-- Drop scheduling_template indexes
DROP INDEX IF EXISTS "idx_scheduling_template_company";
DROP INDEX IF EXISTS "idx_scheduling_template_location";
DROP INDEX IF EXISTS "scheduling_template_company_id_name_key";

-- Drop shift_template indexes
DROP INDEX IF EXISTS "idx_shift_template_company_deleted";
DROP INDEX IF EXISTS "idx_shift_template_usage";
DROP INDEX IF EXISTS "idx_shift_template_name_search";
DROP INDEX IF EXISTS "shift_template_company_id_name_key";

-- =====================================================
-- STEP 3: Drop tables
-- =====================================================

DROP TABLE IF EXISTS "shift_requirement_position" CASCADE;
DROP TABLE IF EXISTS "shift_requirement" CASCADE;
DROP TABLE IF EXISTS "scheduling_batch" CASCADE;
DROP TABLE IF EXISTS "scheduling_template" CASCADE;
DROP TABLE IF EXISTS "shift_template" CASCADE;

-- =====================================================
-- STEP 4: Drop enums
-- =====================================================

DROP TYPE IF EXISTS "requirement_status";
DROP TYPE IF EXISTS "batch_status";

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Deprecated scheduling system removal completed!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Removed tables:';
    RAISE NOTICE '  - shift_template (old)';
    RAISE NOTICE '  - scheduling_template';
    RAISE NOTICE '  - scheduling_batch';
    RAISE NOTICE '  - shift_requirement';
    RAISE NOTICE '  - shift_requirement_position';
    RAISE NOTICE '';
    RAISE NOTICE 'Removed enums:';
    RAISE NOTICE '  - requirement_status';
    RAISE NOTICE '  - batch_status';
    RAISE NOTICE '';
    RAISE NOTICE 'Active system (Phase 4):';
    RAISE NOTICE '  ✅ day_template';
    RAISE NOTICE '  ✅ template_shift';
    RAISE NOTICE '  ✅ template_shift_position';
    RAISE NOTICE '  ✅ shift_assignment';
    RAISE NOTICE '';
    RAISE NOTICE 'Legacy system (still in use):';
    RAISE NOTICE '  ✅ shift (current system used by frontend)';
    RAISE NOTICE '==============================================';
END $$;

COMMIT;

