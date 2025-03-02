import { Module } from '@nestjs/common';
import { WaveformsService } from './waveforms.service';
import { DbModule } from 'src/db/db.module';
import { WaveformsController } from './waveforms.controller';

@Module({
  providers: [WaveformsService],
  imports: [DbModule],
  controllers: [WaveformsController],
})
export class WaveformsModule {}
