-- CreateTable
CREATE TABLE "company_settings" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "max_daily_hours" DECIMAL(4,1) NOT NULL DEFAULT 12.0,
    "max_weekly_hours" DECIMAL(5,1) NOT NULL DEFAULT 40.0,
    "min_break_hours" DECIMAL(4,1) NOT NULL DEFAULT 11.0,
    "allow_overnight_shifts" BOOLEAN NOT NULL DEFAULT false,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_settings_company_id_key" ON "company_settings"("company_id");

-- CreateIndex
CREATE INDEX "idx_company_settings_company" ON "company_settings"("company_id");

-- AddForeignKey
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "unique_shift_constraint" RENAME TO "shift_company_employee_id_shift_date_start_time_end_time_de_key";
