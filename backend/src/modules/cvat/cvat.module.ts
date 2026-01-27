import { Module } from '@nestjs/common';
import { CvatService } from './cvat.service';

@Module({
    providers: [CvatService],
    exports: [CvatService],
})
export class CvatModule { }
