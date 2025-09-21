-- CreateTable
CREATE TABLE "shift_template" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shift_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_shift_pattern" (
    "id" SERIAL NOT NULL,
    "company_employee_id" INTEGER NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "frequency_count" INTEGER NOT NULL DEFAULT 1,
    "last_used" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_shift_pattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shift_template_company_id_deleted_at_idx" ON "shift_template"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "shift_template_company_id_usage_count_idx" ON "shift_template"("company_id", "usage_count" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "shift_template_company_id_name_key" ON "shift_template"("company_id", "name");

-- CreateIndex
CREATE INDEX "employee_shift_pattern_company_employee_id_idx" ON "employee_shift_pattern"("company_employee_id");

-- CreateIndex
CREATE INDEX "employee_shift_pattern_frequency_count_idx" ON "employee_shift_pattern"("frequency_count" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "employee_shift_pattern_company_employee_id_start_time_end_t_key" ON "employee_shift_pattern"("company_employee_id", "start_time", "end_time");

-- AddForeignKey
ALTER TABLE "shift_template" ADD CONSTRAINT "shift_template_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_template" ADD CONSTRAINT "shift_template_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_shift_pattern" ADD CONSTRAINT "employee_shift_pattern_company_employee_id_fkey" FOREIGN KEY ("company_employee_id") REFERENCES "company_employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
