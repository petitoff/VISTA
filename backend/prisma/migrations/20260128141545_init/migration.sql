-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "cvatUrl" TEXT,
    "cvatUsername" TEXT,
    "cvatPassword" TEXT,
    "cvatCacheTimeoutMs" INTEGER NOT NULL DEFAULT 5000,
    "jenkinsUrl" TEXT,
    "jenkinsUsername" TEXT,
    "jenkinsApiToken" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
