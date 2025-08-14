-- AlterTable
ALTER TABLE "signatures" ADD COLUMN     "fieldId" TEXT;

-- CreateTable
CREATE TABLE "signature_fields" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "signerEmail" TEXT,
    "signerName" TEXT,
    "label" TEXT NOT NULL DEFAULT '',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionY" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signature_fields_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "signature_fields" ADD CONSTRAINT "signature_fields_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
