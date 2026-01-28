import { Module, forwardRef } from '@nestjs/common';
import { JenkinsService } from './jenkins.service';
import { JenkinsController } from './jenkins.controller';
import { SettingsModule } from '../settings/settings.module';
import { ProcessingModule } from '../processing/processing.module';

@Module({
    imports: [SettingsModule, forwardRef(() => ProcessingModule)],
    providers: [JenkinsService],
    controllers: [JenkinsController],
    exports: [JenkinsService],
})
export class JenkinsModule { }
