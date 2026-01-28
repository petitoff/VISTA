import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import type { JenkinsConfig } from '../settings/dto';

export interface TriggerBuildResult {
    success: boolean;
    queueUrl?: string;
    error?: string;
}

@Injectable()
export class JenkinsService {
    private readonly logger = new Logger(JenkinsService.name);

    constructor(private settingsService: SettingsService) { }

    /**
     * Get current Jenkins config from database
     */
    private async getConfig(): Promise<JenkinsConfig | null> {
        return this.settingsService.getJenkinsConfig();
    }

    async isConfigured(): Promise<boolean> {
        const config = await this.getConfig();
        return config !== null;
    }

    private getAuthHeader(config: JenkinsConfig): string {
        const credentials = Buffer.from(`${config.username}:${config.apiToken}`).toString('base64');
        return `Basic ${credentials}`;
    }

    /**
     * Get CSRF crumb for Jenkins (required for POST requests)
     */
    private async getCrumb(config: JenkinsConfig): Promise<{ crumbField: string; crumb: string } | null> {
        try {
            const response = await fetch(`${config.url}/crumbIssuer/api/json`, {
                method: 'GET',
                headers: {
                    'Authorization': this.getAuthHeader(config),
                },
            });

            if (!response.ok) {
                // CSRF might be disabled
                return null;
            }

            const data = await response.json();
            return {
                crumbField: data.crumbRequestField,
                crumb: data.crumb,
            };
        } catch (error) {
            this.logger.warn(`Failed to get CSRF crumb: ${error.message}`);
            return null;
        }
    }

    /**
     * Trigger a Jenkins job with parameters
     */
    async triggerBuild(
        jobName: string,
        parameters: Record<string, string>,
    ): Promise<TriggerBuildResult> {
        const config = await this.getConfig();

        if (!config) {
            return {
                success: false,
                error: 'Jenkins not configured. Go to Settings to configure Jenkins credentials.',
            };
        }

        try {
            // Get CSRF crumb
            const crumb = await this.getCrumb(config);

            // Build form data for parameters
            const formParams = new URLSearchParams();
            for (const [key, value] of Object.entries(parameters)) {
                formParams.append(key, value);
            }

            // Encode job name for URL (handle folders like "folder/job")
            const encodedJobName = jobName.split('/').map(encodeURIComponent).join('/job/');
            const url = `${config.url}/job/${encodedJobName}/buildWithParameters`;

            const headers: Record<string, string> = {
                'Authorization': this.getAuthHeader(config),
                'Content-Type': 'application/x-www-form-urlencoded',
            };

            // Add CSRF crumb if available
            if (crumb) {
                headers[crumb.crumbField] = crumb.crumb;
            }

            this.logger.log(`Triggering build: ${jobName} with params: ${JSON.stringify(parameters)}`);

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formParams.toString(),
            });

            if (response.status === 201) {
                // Build queued successfully
                const queueUrl = response.headers.get('Location');
                this.logger.log(`Build queued: ${queueUrl}`);
                return {
                    success: true,
                    queueUrl: queueUrl || undefined,
                };
            } else {
                const errorText = await response.text();
                this.logger.error(`Failed to trigger build: ${response.status} - ${errorText}`);
                return {
                    success: false,
                    error: `Jenkins returned ${response.status}: ${errorText.slice(0, 200)}`,
                };
            }
        } catch (error) {
            this.logger.error(`Error triggering build: ${error.message}`);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}
