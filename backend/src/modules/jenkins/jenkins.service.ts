import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import type { JenkinsConfig } from '../settings/dto';

export interface TriggerBuildResult {
    success: boolean;
    queueUrl?: string;
    buildUrl?: string;
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

                // Wait for build to start and get buildUrl
                let buildUrl: string | undefined;
                if (queueUrl) {
                    buildUrl = await this.waitForBuildUrl(queueUrl, config);
                    if (buildUrl) {
                        this.logger.log(`Build started: ${buildUrl}`);
                    } else {
                        this.logger.warn(`Could not get buildUrl in time, will track via queue`);
                    }
                }

                return {
                    success: true,
                    queueUrl: queueUrl || undefined,
                    buildUrl,
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

    /**
     * Poll queue until build starts and return buildUrl.
     * Returns undefined if timeout (15 seconds) is reached.
     */
    private async waitForBuildUrl(queueUrl: string, config: JenkinsConfig): Promise<string | undefined> {
        const maxWaitMs = 15000;
        const pollIntervalMs = 1000;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitMs) {
            try {
                const response = await fetch(`${queueUrl}api/json`, {
                    method: 'GET',
                    headers: {
                        'Authorization': this.getAuthHeader(config),
                    },
                });

                if (!response.ok) {
                    // Queue item might have been removed - build may have started
                    // We won't get buildUrl this way, return undefined
                    return undefined;
                }

                const data = await response.json();

                if (data.cancelled) {
                    return undefined;
                }

                if (data.executable?.url) {
                    return data.executable.url;
                }

                // Not ready yet, wait and try again
                await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
            } catch (error) {
                this.logger.warn(`Error polling queue: ${error.message}`);
                return undefined;
            }
        }

        return undefined;
    }

    /**
     * Get queue item info to check if build has started
     */
    async getQueueItem(queueUrl: string): Promise<{
        waiting: boolean;
        buildUrl?: string;
        cancelled: boolean;
    }> {
        const config = await this.getConfig();
        if (!config) {
            return { waiting: false, cancelled: true };
        }

        try {
            const response = await fetch(`${queueUrl}api/json`, {
                method: 'GET',
                headers: {
                    'Authorization': this.getAuthHeader(config),
                },
            });

            if (!response.ok) {
                // Queue item might have been removed (build started or cancelled)
                return { waiting: false, cancelled: false };
            }

            const data = await response.json();

            if (data.cancelled) {
                return { waiting: false, cancelled: true };
            }

            if (data.executable?.url) {
                return {
                    waiting: false,
                    buildUrl: data.executable.url,
                    cancelled: false,
                };
            }

            return { waiting: true, cancelled: false };
        } catch (error) {
            this.logger.warn(`Failed to get queue item: ${error.message}`);
            return { waiting: false, cancelled: false };
        }
    }

    /**
     * Get build status to check if build has finished
     */
    async getBuildStatus(buildUrl: string): Promise<{
        building: boolean;
        finished: boolean;
        result?: string; // SUCCESS, FAILURE, ABORTED, etc.
    }> {
        const config = await this.getConfig();
        if (!config) {
            return { building: false, finished: true, result: 'UNKNOWN' };
        }

        try {
            const response = await fetch(`${buildUrl}api/json`, {
                method: 'GET',
                headers: {
                    'Authorization': this.getAuthHeader(config),
                },
            });

            if (!response.ok) {
                return { building: false, finished: true, result: 'UNKNOWN' };
            }

            const data = await response.json();

            return {
                building: data.building === true,
                finished: data.building === false && data.result !== null,
                result: data.result || undefined,
            };
        } catch (error) {
            this.logger.warn(`Failed to get build status: ${error.message}`);
            return { building: false, finished: false };
        }
    }

    /**
     * Get the last build URL for a given job name.
     * Useful when queue item disappears before we can extract buildUrl.
     */
    async getLastBuildUrl(jobName: string): Promise<string | undefined> {
        const config = await this.getConfig();
        if (!config) {
            return undefined;
        }

        try {
            // Encode job name for URL (handle folders like "folder/job")
            const encodedJobName = jobName.split('/').map(encodeURIComponent).join('/job/');
            const url = `${config.url}/job/${encodedJobName}/lastBuild/api/json`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': this.getAuthHeader(config),
                },
            });

            if (!response.ok) {
                this.logger.warn(`Failed to get last build for ${jobName}: ${response.status}`);
                return undefined;
            }

            const data = await response.json();
            return data.url || undefined;
        } catch (error) {
            this.logger.warn(`Error getting last build for ${jobName}: ${error.message}`);
            return undefined;
        }
    }
}
