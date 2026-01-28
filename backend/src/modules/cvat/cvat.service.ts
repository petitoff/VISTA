import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import type { CvatConfig } from '../settings/dto';
import { CvatTasksResponse, CvatVideoStatus } from './dto';

@Injectable()
export class CvatService {
    private readonly logger = new Logger(CvatService.name);

    private authToken: string | null = null;
    private tokenExpiry: number = 0;
    private currentConfig: CvatConfig | null = null;

    // Cache for task lookups: Map<taskName, { status: CvatVideoStatus, expiry: number }>
    private taskCache = new Map<string, { status: CvatVideoStatus; expiry: number }>();

    // Cache for project names: Map<projectId, projectName>
    private projectCache = new Map<number, string>();

    constructor(private settingsService: SettingsService) { }

    /**
     * Get current CVAT config from database
     */
    private async getConfig(): Promise<CvatConfig | null> {
        return this.settingsService.getCvatConfig();
    }

    async isConfigured(): Promise<boolean> {
        const config = await this.getConfig();
        return config !== null;
    }

    private async authenticate(config: CvatConfig): Promise<void> {
        const response = await fetch(`${config.url}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: config.username,
                password: config.password,
            }),
        });

        if (!response.ok) {
            throw new Error(`Authentication failed: ${response.status}`);
        }

        const data = await response.json();
        this.authToken = data.key;
        this.currentConfig = config;
        // Token valid for 1 hour
        this.tokenExpiry = Date.now() + 3600000;
    }

    private async ensureAuthenticated(): Promise<CvatConfig> {
        const config = await this.getConfig();
        if (!config) {
            throw new Error('CVAT not configured');
        }

        // Re-authenticate if token expired or config changed
        const configChanged =
            !this.currentConfig ||
            this.currentConfig.url !== config.url ||
            this.currentConfig.username !== config.username;

        if (!this.authToken || Date.now() >= this.tokenExpiry || configChanged) {
            await this.authenticate(config);
        }

        return config;
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (this.authToken) {
            headers['Authorization'] = `Token ${this.authToken}`;
        }
        return headers;
    }

    /**
     * Get project name by ID (with caching)
     */
    private async getProjectName(projectId: number): Promise<string> {
        // Check cache first
        const cached = this.projectCache.get(projectId);
        if (cached) {
            return cached;
        }

        try {
            const config = await this.ensureAuthenticated();

            const response = await fetch(`${config.url}/api/projects/${projectId}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                return `Project #${projectId}`;
            }

            const data = await response.json();
            const projectName = data.name || `Project #${projectId}`;

            // Cache the result (projects don't change often, cache indefinitely)
            this.projectCache.set(projectId, projectName);

            return projectName;
        } catch (error) {
            this.logger.warn(`Failed to get project name: ${error.message}`);
            return `Project #${projectId}`;
        }
    }

    /**
     * Get task stage from first job (stage is at job level, not task level)
     */
    private async getTaskStage(taskId: number): Promise<string | undefined> {
        try {
            const config = await this.ensureAuthenticated();

            const response = await fetch(`${config.url}/api/jobs?task_id=${taskId}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                return undefined;
            }

            const data = await response.json();
            if (data.results && data.results.length > 0) {
                // Return stage from first job
                return data.results[0].stage;
            }
            return undefined;
        } catch (error) {
            this.logger.warn(`Failed to get task stage: ${error.message}`);
            return undefined;
        }
    }

    /**
     * Find a task by exact name match
     */
    async findTaskByName(taskName: string): Promise<CvatVideoStatus> {
        const config = await this.getConfig();
        if (!config) {
            return { exists: false };
        }

        // Check cache first
        const cached = this.taskCache.get(taskName);
        if (cached && Date.now() < cached.expiry) {
            return cached.status;
        }

        try {
            await this.ensureAuthenticated();

            const url = new URL(`${config.url}/api/tasks`);
            url.searchParams.set('name', taskName);

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                this.logger.warn(`CVAT API error: ${response.status}`);
                return { exists: false };
            }

            const data: CvatTasksResponse = await response.json();

            let status: CvatVideoStatus;

            if (data.count > 0 && data.results.length > 0) {
                // Find exact name match (API may return partial matches)
                const exactMatch = data.results.find((t) => t.name === taskName);

                if (exactMatch) {
                    // Fetch project name if task has a project
                    let projectName: string | undefined;
                    if (exactMatch.project_id) {
                        projectName = await this.getProjectName(exactMatch.project_id);
                    }

                    // Fetch stage from first job (stage is at job level)
                    const stage = await this.getTaskStage(exactMatch.id);

                    status = {
                        exists: true,
                        taskId: exactMatch.id,
                        taskUrl: `${config.url}/tasks/${exactMatch.id}`,
                        projectName,
                        stage,
                    };
                } else {
                    status = { exists: false };
                }
            } else {
                status = { exists: false };
            }

            // Cache the result
            this.taskCache.set(taskName, {
                status,
                expiry: Date.now() + config.cacheTimeoutMs,
            });

            return status;
        } catch (error) {
            this.logger.error(`Failed to query CVAT: ${error.message}`);
            return { exists: false };
        }
    }

    /**
     * Check video status - extracts filename without extension as task name
     */
    async checkVideoStatus(filename: string): Promise<CvatVideoStatus> {
        // Remove extension to get task name
        const taskName = filename.replace(/\.[^/.]+$/, '');
        return this.findTaskByName(taskName);
    }

    /**
     * Batch check multiple videos at once (for performance)
     */
    async checkVideosStatus(
        filenames: string[],
    ): Promise<Map<string, CvatVideoStatus>> {
        const results = new Map<string, CvatVideoStatus>();

        // Check if configured first
        const isConfigured = await this.isConfigured();
        if (!isConfigured) {
            // Return empty statuses if not configured
            for (const filename of filenames) {
                results.set(filename, { exists: false });
            }
            return results;
        }

        // Process in parallel with concurrency limit
        const BATCH_SIZE = 10;
        for (let i = 0; i < filenames.length; i += BATCH_SIZE) {
            const batch = filenames.slice(i, i + BATCH_SIZE);
            const promises = batch.map(async (filename) => {
                const status = await this.checkVideoStatus(filename);
                results.set(filename, status);
            });
            await Promise.all(promises);
        }

        return results;
    }
}
