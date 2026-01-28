import { Controller, Get, Put, Body, Logger } from '@nestjs/common';
import { SettingsService } from './settings.service';
import type { SettingsDto, UpdateSettingsDto } from './dto';

@Controller('settings')
export class SettingsController {
    private readonly logger = new Logger(SettingsController.name);

    constructor(private readonly settingsService: SettingsService) { }

    @Get()
    async getSettings(): Promise<SettingsDto> {
        const settings = await this.settingsService.getSettings();

        // Mask sensitive fields for display
        return {
            ...settings,
            cvatPassword: settings.cvatPassword ? '••••••••' : null,
            jenkinsApiToken: settings.jenkinsApiToken ? '••••••••' : null,
        };
    }

    @Put()
    async updateSettings(@Body() dto: UpdateSettingsDto): Promise<SettingsDto> {
        this.logger.log('Updating settings');
        const settings = await this.settingsService.updateSettings(dto);

        // Mask sensitive fields in response
        return {
            ...settings,
            cvatPassword: settings.cvatPassword ? '••••••••' : null,
            jenkinsApiToken: settings.jenkinsApiToken ? '••••••••' : null,
        };
    }

    @Get('status')
    async getStatus(): Promise<{ cvat: boolean; jenkins: boolean }> {
        const settings = await this.settingsService.getSettings();
        return {
            cvat: Boolean(settings.cvatUrl && settings.cvatUsername && settings.cvatPassword),
            jenkins: Boolean(settings.jenkinsUrl && settings.jenkinsUsername && settings.jenkinsApiToken),
        };
    }
}
