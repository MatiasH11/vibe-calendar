-- =====================================================
-- MIGRATION: Add Scheduling System
-- =====================================================
-- Creates new entities for shift requirement management:
--   job_position: Defines work positions (Cocinero, Mesero, Bachero)
--   scheduling_template: Reusable templates for requirements
--   scheduling_batch: Groups of shift requirements for a period
--   shift_requirement: Defines what positions are needed for a shift
--   shift_requirement_position: Links requirements to positions with counts
-- =====================================================

-- =====================================================
-- Create new enums (must be outside transaction)
-- =====================================================

CREATE TYPE "requirement_status" AS ENUM ('open', 'partial', 'filled', 'cancelled');
CREATE TYPE "batch_status" AS ENUM ('draft', 'approved', 'published', 'finalized');

BEGIN;

-- =====================================================
-- STEP 1: Create job_position table
-- =====================================================

CREATE TABLE "job_position" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "department_id" INTEGER NOT NULL,
    "color" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "job_position_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_job_position_company" ON "job_position"("company_id", "deleted_at");
CREATE INDEX "idx_job_position_department" ON "job_position"("department_id", "deleted_at");
CREATE UNIQUE INDEX "job_position_company_id_department_id_name_key" ON "job_position"("company_id", "department_id", "name");

ALTER TABLE "job_position" ADD CONSTRAINT "job_position_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_position" ADD CONSTRAINT "job_position_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- STEP 2: Add job_position_id to employee table
-- =====================================================

ALTER TABLE "employee" ADD COLUMN "job_position_id" INTEGER;
ALTER TABLE "employee" ADD CONSTRAINT "employee_job_position_id_fkey"
  FOREIGN KEY ("job_position_id") REFERENCES "job_position"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "idx_employee_job_position" ON "employee"("job_position_id");

-- =====================================================
-- STEP 3: Update shift table
-- =====================================================

-- Add position_id (reference to shift_requirement_position)
ALTER TABLE "shift" ADD COLUMN "position_id" INTEGER;

-- Add confirmation tracking
ALTER TABLE "shift" ADD COLUMN "confirmed_by" INTEGER;
ALTER TABLE "shift" ADD COLUMN "confirmed_at" TIMESTAMP(3);

-- Add assigned_by to shift
ALTER TABLE "shift" ADD COLUMN "assigned_by" INTEGER;

CREATE INDEX "idx_shift_position_status" ON "shift"("position_id", "status");

-- =====================================================
-- STEP 4: Create scheduling_template table
-- =====================================================

CREATE TABLE "scheduling_template" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "location_id" INTEGER,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "days_pattern" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "scheduling_template_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_scheduling_template_company" ON "scheduling_template"("company_id", "deleted_at");
CREATE INDEX "idx_scheduling_template_location" ON "scheduling_template"("location_id", "deleted_at");
CREATE UNIQUE INDEX "scheduling_template_company_id_name_key" ON "scheduling_template"("company_id", "name");

ALTER TABLE "scheduling_template" ADD CONSTRAINT "scheduling_template_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scheduling_template" ADD CONSTRAINT "scheduling_template_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "scheduling_template" ADD CONSTRAINT "scheduling_template_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================
-- STEP 5: Create scheduling_batch table
-- =====================================================

CREATE TABLE "scheduling_batch" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "template_id" INTEGER NOT NULL,
    "period_type" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "status" "batch_status" NOT NULL DEFAULT 'draft',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "scheduling_batch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_scheduling_batch_company_date" ON "scheduling_batch"("company_id", "start_date");
CREATE INDEX "idx_scheduling_batch_status_location" ON "scheduling_batch"("status", "location_id");

ALTER TABLE "scheduling_batch" ADD CONSTRAINT "scheduling_batch_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scheduling_batch" ADD CONSTRAINT "scheduling_batch_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scheduling_batch" ADD CONSTRAINT "scheduling_batch_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "scheduling_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scheduling_batch" ADD CONSTRAINT "scheduling_batch_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================
-- STEP 6: Create shift_requirement table
-- =====================================================

CREATE TABLE "shift_requirement" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "department_id" INTEGER NOT NULL,
    "batch_id" INTEGER,
    "shift_date" DATE NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "status" "requirement_status" NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shift_requirement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_shift_requirement_batch" ON "shift_requirement"("batch_id");
CREATE INDEX "idx_shift_requirement_company_date" ON "shift_requirement"("company_id", "shift_date");
CREATE INDEX "idx_shift_requirement_location_date" ON "shift_requirement"("location_id", "shift_date", "deleted_at");

ALTER TABLE "shift_requirement" ADD CONSTRAINT "shift_requirement_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shift_requirement" ADD CONSTRAINT "shift_requirement_location_id_fkey"
  FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shift_requirement" ADD CONSTRAINT "shift_requirement_department_id_fkey"
  FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shift_requirement" ADD CONSTRAINT "shift_requirement_batch_id_fkey"
  FOREIGN KEY ("batch_id") REFERENCES "scheduling_batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================
-- STEP 7: Create shift_requirement_position table
-- =====================================================

CREATE TABLE "shift_requirement_position" (
    "id" SERIAL NOT NULL,
    "requirement_id" INTEGER NOT NULL,
    "job_position_id" INTEGER NOT NULL,
    "required_count" INTEGER NOT NULL,
    "filled_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_requirement_position_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_shift_requirement_position_requirement" ON "shift_requirement_position"("requirement_id");
CREATE UNIQUE INDEX "shift_requirement_position_requirement_id_job_position_id_key"
  ON "shift_requirement_position"("requirement_id", "job_position_id");

ALTER TABLE "shift_requirement_position" ADD CONSTRAINT "shift_requirement_position_requirement_id_fkey"
  FOREIGN KEY ("requirement_id") REFERENCES "shift_requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shift_requirement_position" ADD CONSTRAINT "shift_requirement_position_job_position_id_fkey"
  FOREIGN KEY ("job_position_id") REFERENCES "job_position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- STEP 8: Update shift table with foreign keys
-- =====================================================

ALTER TABLE "shift" ADD CONSTRAINT "shift_position_id_fkey"
  FOREIGN KEY ("position_id") REFERENCES "shift_requirement_position"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "shift" ADD CONSTRAINT "shift_assigned_by_fkey"
  FOREIGN KEY ("assigned_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "shift" ADD CONSTRAINT "shift_confirmed_by_fkey"
  FOREIGN KEY ("confirmed_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Scheduling system migration completed!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'New tables created:';
    RAISE NOTICE '  - job_position';
    RAISE NOTICE '  - scheduling_template';
    RAISE NOTICE '  - scheduling_batch';
    RAISE NOTICE '  - shift_requirement';
    RAISE NOTICE '  - shift_requirement_position';
    RAISE NOTICE '==============================================';
END $$;

COMMIT;
