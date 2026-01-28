import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JenkinsService } from '../jenkins/jenkins.service';

export interface ProcessingInfo {
    jobName: string;
    status: string;
    startedAt: Date;
}

@Injectable()
export class ProcessingService {
    private readonly logger = new Logger(ProcessingService.name);

    constructor(
        private prisma: PrismaService,
        private jenkinsService: JenkinsService,
    ) { }

    /**
     * Start tracking a video processing job
     */
    async startProcessing(
        videoPath: string,
        jobName: string,
        method: string,
        queueUrl?: string,
    ): Promise<void> {
        await this.prisma.videoProcessing.upsert({
            where: { videoPath },
            create: {
                videoPath,
                jobName,
                method,
                queueUrl,
                status: 'queued',
            },
            update: {
                jobName,
                method,
                queueUrl,
                status: 'queued',
                startedAt: new Date(),
                buildUrl: null,
            },
        });
        this.logger.log(`Started tracking processing for ${videoPath}`);
    }

    /**
     * Get processing info for multiple video paths and refresh their statuses
     */
    async getForVideosAndRefresh(videoPaths: string[]): Promise<Map<string, ProcessingInfo>> {
        if (videoPaths.length === 0) {
            return new Map();
        }

        const records = await this.prisma.videoProcessing.findMany({
            where: {
                videoPath: { in: videoPaths },
            },
        });

        if (records.length === 0) {
            return new Map();
        }

        // Refresh statuses from Jenkins
        for (const record of records) {
            if (record.status === 'success' || record.status === 'failed') {
                // Already finished, remove from tracking
                await this.prisma.videoProcessing.delete({
                    where: { id: record.id },
                });
                continue;
            }

            try {
                await this.refreshRecordStatus(record);
            } catch (error) {
                this.logger.warn(`Failed to refresh status for ${record.videoPath}: ${error.message}`);
            }
        }

        // Re-fetch after refresh (some may have been deleted)
        const updatedRecords = await this.prisma.videoProcessing.findMany({
            where: {
                videoPath: { in: videoPaths },
                status: { in: ['queued', 'building'] },
            },
        });

        const result = new Map<string, ProcessingInfo>();
        for (const record of updatedRecords) {
            result.set(record.videoPath, {
                jobName: record.jobName,
                status: record.status,
                startedAt: record.startedAt,
            });
        }

        return result;
    }

    /**
     * Refresh status for a single record from Jenkins
     */
    private async refreshRecordStatus(record: {
        id: string;
        videoPath: string;
        queueUrl: string | null;
        buildUrl: string | null;
        status: string;
    }): Promise<void> {
        // If still in queue, check if build has started
        if (record.status === 'queued' && record.queueUrl) {
            const queueInfo = await this.jenkinsService.getQueueItem(record.queueUrl);

            if (queueInfo.cancelled) {
                // Job was cancelled
                await this.prisma.videoProcessing.delete({
                    where: { id: record.id },
                });
                this.logger.log(`Job cancelled for ${record.videoPath}`);
                return;
            }

            if (queueInfo.buildUrl) {
                // Job left the queue, now building
                await this.prisma.videoProcessing.update({
                    where: { id: record.id },
                    data: {
                        status: 'building',
                        buildUrl: queueInfo.buildUrl,
                    },
                });
                record.status = 'building';
                record.buildUrl = queueInfo.buildUrl;
                this.logger.log(`Job started building for ${record.videoPath}`);
            }
        }

        // If building, check build status
        if (record.status === 'building' && record.buildUrl) {
            const buildStatus = await this.jenkinsService.getBuildStatus(record.buildUrl);

            if (buildStatus.finished) {
                // Build finished, remove from tracking
                await this.prisma.videoProcessing.delete({
                    where: { id: record.id },
                });
                this.logger.log(`Build finished for ${record.videoPath}: ${buildStatus.result}`);
            }
        }
    }

    /**
     * Get all active processing records
     */
    async getAllActive(): Promise<Array<{
        id: string;
        videoPath: string;
        jobName: string;
        status: string;
        startedAt: Date;
    }>> {
        return this.prisma.videoProcessing.findMany({
            where: {
                status: { in: ['queued', 'building'] },
            },
            orderBy: { startedAt: 'desc' },
        });
    }

    /**
     * Manually remove a processing record
     */
    async remove(id: string): Promise<void> {
        await this.prisma.videoProcessing.delete({
            where: { id },
        });
        this.logger.log(`Manually removed processing record ${id}`);
    }
}
