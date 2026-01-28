import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { SettingsDto, UpdateSettingsDto, CvatConfig, JenkinsConfig } from './dto';

@Injectable()
export class SettingsService {
    private readonly logger = new Logger(SettingsService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Get current settings (creates default row if not exists)
     */
    async getSettings(): Promise<SettingsDto> {
        const settings = await this.prisma.settings.upsert({
            where: { id: 'default' },
            create: { id: 'default' },
            update: {},
        });

        return {
            cvatUrl: settings.cvatUrl,
            cvatUsername: settings.cvatUsername,
            cvatPassword: settings.cvatPassword,
            cvatCacheTimeoutMs: settings.cvatCacheTimeoutMs,
            jenkinsUrl: settings.jenkinsUrl,
            jenkinsUsername: settings.jenkinsUsername,
            jenkinsApiToken: settings.jenkinsApiToken,
        };
    }

    /**
     * Update settings
     */
    async updateSettings(dto: UpdateSettingsDto): Promise<SettingsDto> {
        const settings = await this.prisma.settings.upsert({
            where: { id: 'default' },
            create: {
                id: 'default',
                ...dto,
            },
            update: dto,
        });

        this.logger.log('Settings updated');

        return {
            cvatUrl: settings.cvatUrl,
            cvatUsername: settings.cvatUsername,
            cvatPassword: settings.cvatPassword,
            cvatCacheTimeoutMs: settings.cvatCacheTimeoutMs,
            jenkinsUrl: settings.jenkinsUrl,
            jenkinsUsername: settings.jenkinsUsername,
            jenkinsApiToken: settings.jenkinsApiToken,
        };
    }

    /**
     * Get CVAT configuration (for CvatService)
     */
    async getCvatConfig(): Promise<CvatConfig | null> {
        const settings = await this.prisma.settings.findUnique({
            where: { id: 'default' },
        });

        if (!settings?.cvatUrl || !settings?.cvatUsername || !settings?.cvatPassword) {
            return null;
        }

        return {
            url: settings.cvatUrl,
            username: settings.cvatUsername,
            password: settings.cvatPassword,
            cacheTimeoutMs: settings.cvatCacheTimeoutMs,
        };
    }

    /**
     * Get Jenkins configuration (for JenkinsService)
     */
    async getJenkinsConfig(): Promise<JenkinsConfig | null> {
        const settings = await this.prisma.settings.findUnique({
            where: { id: 'default' },
        });

        if (!settings?.jenkinsUrl || !settings?.jenkinsUsername || !settings?.jenkinsApiToken) {
            return null;
        }

        return {
            url: settings.jenkinsUrl,
            username: settings.jenkinsUsername,
            apiToken: settings.jenkinsApiToken,
        };
    }
}
