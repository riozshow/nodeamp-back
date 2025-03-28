import { Module } from '@nestjs/common';
import { ShareController } from './share.controller';
import { ShareProcesses } from './share.processes';
import { ShareRepository } from './share.repository';
import { DbModule } from 'src/db/db.module';

@Module({
  controllers: [ShareController],
  providers: [ShareProcesses, ShareRepository],
  exports: [ShareRepository, ShareProcesses],
  imports: [DbModule],
})
export class ShareModule {}
