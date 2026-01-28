import { Module } from '@nestjs/common';
import { JenkinsService } from './jenkins.service';
import { JenkinsController } from './jenkins.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [SettingsModule],
    providers: [JenkinsService],
    controllers: [JenkinsController],
    exports: [JenkinsService],
})
export class JenkinsModule { }
