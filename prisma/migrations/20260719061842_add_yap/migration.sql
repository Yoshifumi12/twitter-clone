-- CreateEnum
CREATE TYPE "YapStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "Yap" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "YapStatus" NOT NULL DEFAULT 'PUBLISHED',
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Yap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Yap_authorId_status_idx" ON "Yap"("authorId", "status");

-- CreateIndex
CREATE INDEX "Yap_parentId_idx" ON "Yap"("parentId");

-- AddForeignKey
ALTER TABLE "Yap" ADD CONSTRAINT "Yap_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Yap" ADD CONSTRAINT "Yap_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Yap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
