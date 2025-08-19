/*
  Warnings:

  - The values [game_studio] on the enum `PartnerType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `ClientId` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Game` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."PartnerType_new" AS ENUM ('artist', 'merch_supplier');
ALTER TABLE "public"."Partner" ALTER COLUMN "type" TYPE "public"."PartnerType_new" USING ("type"::text::"public"."PartnerType_new");
ALTER TYPE "public"."PartnerType" RENAME TO "PartnerType_old";
ALTER TYPE "public"."PartnerType_new" RENAME TO "PartnerType";
DROP TYPE "public"."PartnerType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."ClientId" DROP CONSTRAINT "ClientId_game_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Game" DROP CONSTRAINT "Game_partner_id_fkey";

-- DropTable
DROP TABLE "public"."ClientId";

-- DropTable
DROP TABLE "public"."Game";

-- DropEnum
DROP TYPE "public"."ClientType";
