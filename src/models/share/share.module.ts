import { forwardRef, Module } from '@nestjs/common';
import { ShareController } from './share.controller';
import { ShareProcesses } from './share.processes';
import { ShareRepository } from './share.repository';
import { FeederModule } from 'src/models/feeder/feeder.module';
import { DbModule } from 'src/db/db.module';

@Module({
  controllers: [ShareController],
  providers: [ShareProcesses, ShareRepository],
  exports: [ShareRepository, ShareProcesses],
  imports: [forwardRef(() => FeederModule), DbModule],
})
export class ShareModule {}
