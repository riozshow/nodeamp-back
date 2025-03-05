import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { FeederController } from './feeder.controller';
import { NodeModule } from '../node/node.module';
import { FeederPermissions } from './feeder.permissions';
import { FeederRepository } from './feeder.repository';
import { FeederProcesses } from './feeder.processes';
import { ShareModule } from '../share/share.module';

@Module({
  imports: [DbModule, NodeModule, ShareModule],
  exports: [FeederRepository, FeederPermissions, FeederProcesses],
  providers: [FeederPermissions, FeederRepository, FeederProcesses],
  controllers: [FeederController],
})
export class FeederModule {}
