-- CreateEnum
CREATE TYPE "user_type" AS ENUM ('admin', 'employee');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "user_type" "user_type" NOT NULL DEFAULT 'employee';
