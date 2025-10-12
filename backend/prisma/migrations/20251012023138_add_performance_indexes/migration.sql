-- DropIndex
DROP INDEX "employee_shift_pattern_company_employee_id_idx";

-- DropIndex
DROP INDEX "employee_shift_pattern_frequency_count_idx";

-- CreateIndex
CREATE INDEX "company_employee_company_id_deleted_at_is_active_idx" ON "company_employee"("company_id", "deleted_at", "is_active");

-- CreateIndex
CREATE INDEX "company_employee_company_id_role_id_deleted_at_idx" ON "company_employee"("company_id", "role_id", "deleted_at");

-- CreateIndex
CREATE INDEX "company_employee_user_id_deleted_at_idx" ON "company_employee"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "employee_shift_pattern_company_employee_id_frequency_count_idx" ON "employee_shift_pattern"("company_employee_id", "frequency_count" DESC);

-- CreateIndex
CREATE INDEX "employee_shift_pattern_company_employee_id_last_used_idx" ON "employee_shift_pattern"("company_employee_id", "last_used" DESC);

-- CreateIndex
CREATE INDEX "shift_company_employee_id_shift_date_deleted_at_idx" ON "shift"("company_employee_id", "shift_date", "deleted_at");

-- CreateIndex
CREATE INDEX "shift_shift_date_deleted_at_idx" ON "shift"("shift_date", "deleted_at");
