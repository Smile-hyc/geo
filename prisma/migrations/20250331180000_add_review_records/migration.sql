-- CreateTable
CREATE TABLE "review_records" (
    "id" SERIAL NOT NULL,
    "annotation_record_id" INTEGER NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "review_status" TEXT NOT NULL,
    "review_score" INTEGER,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_records_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "review_records" ADD CONSTRAINT "review_records_annotation_record_id_fkey" FOREIGN KEY ("annotation_record_id") REFERENCES "annotation_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_records" ADD CONSTRAINT "review_records_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "review_records_annotation_record_id_idx" ON "review_records"("annotation_record_id");
