import {
  Controller,
  Param,
  Get,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { WaveformsService } from './waveforms.service';

@Controller('waveforms')
export class WaveformsController {
  constructor(private service: WaveformsService) {}

  @Get(':fileId')
  async getWaveform(@Param('fileId') fileId: string) {
    const waveform = await this.service.getByFileId(fileId);
    if (!waveform) throw new NotFoundException();
    return new StreamableFile(waveform.data);
  }
}
