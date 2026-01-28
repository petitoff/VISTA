import { Module, forwardRef } from '@nestjs/common';
import { ProcessingService } from './processing.service';
import { ProcessingController } from './processing.controller';
import { JenkinsModule } from '../jenkins/jenkins.module';

@Module({
    imports: [forwardRef(() => JenkinsModule)],
    providers: [ProcessingService],
    controllers: [ProcessingController],
    exports: [ProcessingService],
})
export class ProcessingModule { }
