import { Controller, Post, Body, Get, Logger } from '@nestjs/common';
import { JenkinsService } from './jenkins.service';
import type { SendToCvatDto, TriggerResponseDto } from './dto';

@Controller('jenkins')
export class JenkinsController {
    private readonly logger = new Logger(JenkinsController.name);

    // Job names - format: 'folder/job-name' for nested jobs
    private readonly ROI_EXTRACTION_JOB = 'pt-models/yolo_roi_extractor';
    private readonly DIRECT_UPLOAD_JOB = 'pt-models/cvat-video-uploader';

    constructor(private readonly jenkinsService: JenkinsService) { }

    @Get('status')
    async getStatus(): Promise<{ configured: boolean }> {
        return { configured: await this.jenkinsService.isConfigured() };
    }

    @Post('trigger/send-to-cvat')
    async sendToCvat(@Body() dto: SendToCvatDto): Promise<TriggerResponseDto> {
        this.logger.log(`Send to CVAT request: ${dto.method} - ${dto.videoPath}`);

        const isConfigured = await this.jenkinsService.isConfigured();
        if (!isConfigured) {
            return {
                success: false,
                error: 'Jenkins not configured',
            };
        }

        let jobName: string;
        let parameters: Record<string, string>;

        if (dto.method === 'roi') {
            // YOLO ROI Extraction pipeline
            jobName = this.ROI_EXTRACTION_JOB;
            parameters = {
                VIDEO_PATH: dto.videoPath,
                CVAT_PROJECT: dto.cvatProject,
                CVAT_ORG: dto.cvatOrg,
                MODEL_NAME: dto.modelName || 'belt.pt',
                CONFIDENCE: String(dto.confidence ?? 0.5),
                PADDING: String(dto.padding ?? 30),
            };
            if (dto.assigneeId) {
                parameters.ASSIGNEE_ID = dto.assigneeId;
            }
        } else {
            // Direct video upload pipeline
            jobName = this.DIRECT_UPLOAD_JOB;

            // Extract folder path and filename from full video path
            const pathParts = dto.videoPath.split('/');
            const filename = pathParts.pop() || '';
            const folderPath = pathParts.join('/');

            parameters = {
                VIDEO_PATH: folderPath,
                SPECIFIC_VIDEO: filename,
                CVAT_PROJECT: dto.cvatProject,
                CVAT_ORG: dto.cvatOrg,
            };
            if (dto.assigneeId) {
                parameters.ASSIGNEE_ID = dto.assigneeId;
            }
        }

        const result = await this.jenkinsService.triggerBuild(jobName, parameters);

        return {
            ...result,
            jobName,
        };
    }
}
