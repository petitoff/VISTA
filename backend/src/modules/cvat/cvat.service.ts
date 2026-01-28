import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import type { CvatConfig } from '../settings/dto';
import { CvatOccurrence, CvatTasksResponse, CvatVideoStatus } from './dto';

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
     * Find all tasks by exact name match (returns all occurrences)
     */
    async findTaskByName(taskName: string): Promise<CvatVideoStatus> {
        const config = await this.getConfig();
        if (!config) {
            return { exists: false, occurrences: [], hasDuplicateInSameProject: false };
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
                return { exists: false, occurrences: [], hasDuplicateInSameProject: false };
            }

            const data: CvatTasksResponse = await response.json();

            let status: CvatVideoStatus;

            if (data.count > 0 && data.results.length > 0) {
                // Find ALL exact name matches (API may return partial matches)
                const exactMatches = data.results.filter((t) => t.name === taskName);

                if (exactMatches.length > 0) {
                    // Build occurrences array with all matches
                    const occurrences: CvatOccurrence[] = await Promise.all(
                        exactMatches.map(async (task) => {
                            const projectName = task.project_id
                                ? await this.getProjectName(task.project_id)
                                : 'No Project';
                            const stage = await this.getTaskStage(task.id);

                            return {
                                taskId: task.id,
                                taskUrl: `${config.url}/tasks/${task.id}`,
                                projectId: task.project_id,
                                projectName,
                                stage,
                            };
                        }),
                    );

                    // Detect duplicates: group by projectId and find projects with >1 occurrence
                    const projectCounts = new Map<number | null, number>();
                    for (const occ of occurrences) {
                        const count = projectCounts.get(occ.projectId) || 0;
                        projectCounts.set(occ.projectId, count + 1);
                    }

                    const duplicateProjectIds: (number | null)[] = [];
                    for (const [projectId, count] of projectCounts) {
                        if (count > 1) {
                            duplicateProjectIds.push(projectId);
                        }
                    }

                    const hasDuplicateInSameProject = duplicateProjectIds.length > 0;
                    const duplicateProjectNames = hasDuplicateInSameProject
                        ? occurrences
                            .filter((occ) => duplicateProjectIds.includes(occ.projectId))
                            .map((occ) => occ.projectName)
                            .filter((name, idx, arr) => arr.indexOf(name) === idx) // unique
                        : undefined;

                    status = {
                        exists: true,
                        occurrences,
                        hasDuplicateInSameProject,
                        duplicateProjectNames,
                    };
                } else {
                    status = { exists: false, occurrences: [], hasDuplicateInSameProject: false };
                }
            } else {
                status = { exists: false, occurrences: [], hasDuplicateInSameProject: false };
            }

            // Cache the result
            this.taskCache.set(taskName, {
                status,
                expiry: Date.now() + config.cacheTimeoutMs,
            });

            return status;
        } catch (error) {
            this.logger.error(`Failed to query CVAT: ${error.message}`);
            return { exists: false, occurrences: [], hasDuplicateInSameProject: false };
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
                results.set(filename, { exists: false, occurrences: [], hasDuplicateInSameProject: false });
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
