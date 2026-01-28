-- CreateTable
CREATE TABLE "VideoProcessing" (
    "id" TEXT NOT NULL,
    "videoPath" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "queueUrl" TEXT,
    "buildUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoProcessing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoProcessing_videoPath_key" ON "VideoProcessing"("videoPath");
