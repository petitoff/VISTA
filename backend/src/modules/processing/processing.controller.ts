import { Controller, Get, Delete, Param, Logger } from '@nestjs/common';
import { ProcessingService } from './processing.service';

@Controller('processing')
export class ProcessingController {
    private readonly logger = new Logger(ProcessingController.name);

    constructor(private readonly processingService: ProcessingService) { }

    @Get()
    async getActive() {
        return this.processingService.getAllActive();
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.processingService.remove(id);
        return { success: true };
    }
}
