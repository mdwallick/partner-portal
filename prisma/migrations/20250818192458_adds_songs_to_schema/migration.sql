-- CreateTable
CREATE TABLE "public"."Song" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genre" TEXT,
    "duration_s" INTEGER,
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Song_partner_id_idx" ON "public"."Song"("partner_id");

-- CreateIndex
CREATE UNIQUE INDEX "Song_partner_id_name_key" ON "public"."Song"("partner_id", "name");

-- AddForeignKey
ALTER TABLE "public"."Song" ADD CONSTRAINT "Song_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
