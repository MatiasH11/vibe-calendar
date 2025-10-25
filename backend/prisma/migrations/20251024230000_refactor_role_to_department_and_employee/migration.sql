-- =====================================================
-- MIGRATION: Refactor Role to Department + Employee
-- =====================================================
-- This migration transforms the schema from:
--   role -> department (work areas)
--   company_employee -> employee (with permissions)
--   user_type: admin/employee -> SUPER_ADMIN/USER
--
-- IMPORTANT: This script preserves all existing data
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Create new enums
-- =====================================================

-- Create company_role enum for permission levels
CREATE TYPE "company_role" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE');

-- =====================================================
-- STEP 2: Migrate user_type enum
-- =====================================================

-- Create new user_type enum
CREATE TYPE "user_type_new" AS ENUM ('SUPER_ADMIN', 'USER');

-- Migrate existing values
ALTER TABLE "user" ALTER COLUMN "user_type" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "user_type" TYPE "user_type_new"
  USING (CASE
    WHEN "user_type"::text = 'admin' THEN 'USER'::user_type_new
    WHEN "user_type"::text = 'employee' THEN 'USER'::user_type_new
    ELSE 'USER'::user_type_new
  END);

-- Replace old enum with new one
ALTER TYPE "user_type" RENAME TO "user_type_old";
ALTER TYPE "user_type_new" RENAME TO "user_type";
DROP TYPE "user_type_old";

-- Set new default
ALTER TABLE "user" ALTER COLUMN "user_type" SET DEFAULT 'USER';

-- =====================================================
-- STEP 3: Add is_active to user table
-- =====================================================

ALTER TABLE "user" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- Create indexes for user
CREATE INDEX "idx_user_email_deleted" ON "user"("email", "deleted_at");
CREATE INDEX "idx_user_type_active" ON "user"("user_type", "is_active", "deleted_at");

-- =====================================================
-- STEP 4: Create department table (from role)
-- =====================================================

CREATE TABLE "department" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- Migrate data from role to department
INSERT INTO "department" (id, company_id, name, description, color, is_active, created_at, updated_at, deleted_at)
SELECT
    id,
    company_id,
    name,
    description,
    color,
    true as is_active,
    created_at,
    updated_at,
    NULL as deleted_at
FROM "role";

-- Update sequence
SELECT setval('department_id_seq', COALESCE((SELECT MAX(id) FROM "department"), 1), true);

-- Create indexes
CREATE INDEX "idx_department_company_deleted" ON "department"("company_id", "deleted_at");
CREATE INDEX "idx_department_name_search" ON "department"("company_id", "name", "deleted_at");
CREATE UNIQUE INDEX "department_company_id_name_key" ON "department"("company_id", "name");

-- Add foreign key
ALTER TABLE "department" ADD CONSTRAINT "department_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- STEP 5: Create employee table (from company_employee)
-- =====================================================

CREATE TABLE "employee" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "department_id" INTEGER NOT NULL,
    "company_role" "company_role" NOT NULL DEFAULT 'EMPLOYEE',
    "position" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- Migrate data from company_employee to employee
-- Map role_id to department_id and assign company_role based on user_type
INSERT INTO "employee" (id, company_id, user_id, department_id, company_role, position, is_active, created_at, updated_at, deleted_at)
SELECT
    ce.id,
    ce.company_id,
    ce.user_id,
    ce.role_id as department_id,
    CASE
        WHEN u.user_type = 'USER' THEN 'EMPLOYEE'::company_role
        ELSE 'EMPLOYEE'::company_role
    END as company_role,
    ce.position,
    ce.is_active,
    ce.created_at,
    ce.updated_at,
    ce.deleted_at
FROM "company_employee" ce
INNER JOIN "user" u ON u.id = ce.user_id;

-- Update sequence
SELECT setval('employee_id_seq', COALESCE((SELECT MAX(id) FROM "employee"), 1), true);

-- Create indexes
CREATE INDEX "idx_employee_company_active" ON "employee"("company_id", "deleted_at", "is_active");
CREATE INDEX "idx_employee_department" ON "employee"("company_id", "department_id", "deleted_at");
CREATE INDEX "idx_employee_role" ON "employee"("company_id", "company_role", "deleted_at");
CREATE INDEX "idx_employee_user" ON "employee"("user_id", "deleted_at");
CREATE INDEX "idx_employee_lookup" ON "employee"("company_id", "user_id", "deleted_at");
CREATE UNIQUE INDEX "employee_company_id_user_id_key" ON "employee"("company_id", "user_id");

-- Add foreign keys
ALTER TABLE "employee" ADD CONSTRAINT "employee_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee" ADD CONSTRAINT "employee_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee" ADD CONSTRAINT "employee_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =====================================================
-- STEP 6: Migrate shift table references
-- =====================================================

-- Drop old foreign key
ALTER TABLE "shift" DROP CONSTRAINT "shift_company_employee_id_fkey";

-- Drop old indexes
DROP INDEX IF EXISTS "shift_company_employee_id_shift_date_idx";
DROP INDEX IF EXISTS "shift_company_employee_id_shift_date_deleted_at_idx";
DROP INDEX IF EXISTS "shift_company_employee_id_shift_date_start_time_end_time_de_key";
DROP INDEX IF EXISTS "idx_shift_employee_status_deleted";

-- Rename column
ALTER TABLE "shift" RENAME COLUMN "company_employee_id" TO "employee_id";

-- Create new indexes
CREATE INDEX "idx_shift_employee_date" ON "shift"("employee_id", "shift_date");
CREATE INDEX "idx_shift_employee_date_deleted" ON "shift"("employee_id", "shift_date", "deleted_at");
CREATE INDEX "idx_shift_employee_status_deleted" ON "shift"("employee_id", "status", "deleted_at");

-- Add new foreign key
ALTER TABLE "shift" ADD CONSTRAINT "shift_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- STEP 7: Migrate employee_shift_pattern table references
-- =====================================================

-- Drop old foreign key
ALTER TABLE "employee_shift_pattern" DROP CONSTRAINT "employee_shift_pattern_company_employee_id_fkey";

-- Drop old indexes
DROP INDEX IF EXISTS "employee_shift_pattern_company_employee_id_frequency_count_idx";
DROP INDEX IF EXISTS "employee_shift_pattern_company_employee_id_last_used_idx";
DROP INDEX IF EXISTS "employee_shift_pattern_company_employee_id_start_time_end_t_key";

-- Rename column
ALTER TABLE "employee_shift_pattern" RENAME COLUMN "company_employee_id" TO "employee_id";

-- Create new indexes
CREATE INDEX "idx_pattern_frequency" ON "employee_shift_pattern"("employee_id", "frequency_count" DESC);
CREATE INDEX "idx_pattern_last_used" ON "employee_shift_pattern"("employee_id", "last_used" DESC);
CREATE UNIQUE INDEX "employee_shift_pattern_employee_id_start_time_end_time_key"
  ON "employee_shift_pattern"("employee_id", "start_time", "end_time");

-- Add new foreign key
ALTER TABLE "employee_shift_pattern" ADD CONSTRAINT "employee_shift_pattern_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- STEP 8: Update shift_template
-- =====================================================

-- Drop old foreign key
ALTER TABLE "shift_template" DROP CONSTRAINT "shift_template_created_by_fkey";

-- Make created_by nullable
ALTER TABLE "shift_template" ALTER COLUMN "created_by" DROP NOT NULL;

-- Add new foreign key with SET NULL
ALTER TABLE "shift_template" ADD CONSTRAINT "shift_template_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rename indexes to match new naming convention
ALTER INDEX "shift_template_company_id_deleted_at_idx" RENAME TO "idx_shift_template_company_deleted";
ALTER INDEX "shift_template_company_id_usage_count_idx" RENAME TO "idx_shift_template_usage";

-- =====================================================
-- STEP 9: Drop old tables
-- =====================================================

-- Drop old company_employee table (data already migrated)
DROP TABLE "company_employee" CASCADE;

-- Drop old role table (data already migrated)
DROP TABLE "role" CASCADE;

-- =====================================================
-- STEP 10: Rename remaining shift index
-- =====================================================

ALTER INDEX "shift_shift_date_deleted_at_idx" RENAME TO "idx_shift_date_deleted";

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
    dept_count INT;
    emp_count INT;
    shift_count INT;
    pattern_count INT;
BEGIN
    SELECT COUNT(*) INTO dept_count FROM "department";
    SELECT COUNT(*) INTO emp_count FROM "employee";
    SELECT COUNT(*) INTO shift_count FROM "shift";
    SELECT COUNT(*) INTO pattern_count FROM "employee_shift_pattern";

    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Departments: %', dept_count;
    RAISE NOTICE 'Employees: %', emp_count;
    RAISE NOTICE 'Shifts: %', shift_count;
    RAISE NOTICE 'Shift patterns: %', pattern_count;
    RAISE NOTICE '==============================================';
END $$;

COMMIT;
