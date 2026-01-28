import { Module } from '@nestjs/common';
import { CvatService } from './cvat.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
    imports: [SettingsModule],
    providers: [CvatService],
    exports: [CvatService],
})
export class CvatModule { }
