-- CreateTable
CREATE TABLE "NavigationLink" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NavigationLink_location_idx" ON "NavigationLink"("location");

-- CreateIndex
CREATE INDEX "NavigationLink_parentId_idx" ON "NavigationLink"("parentId");

-- AddForeignKey
ALTER TABLE "NavigationLink" ADD CONSTRAINT "NavigationLink_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NavigationLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;
