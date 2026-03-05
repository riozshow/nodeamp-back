import { forwardRef, Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { FeederController } from './feeder.controller';
import { NodeModule } from '../node/node.module';
import { FeederPermissions } from './feeder.permissions';
import { FeederRepository } from './feeder.repository';
import { FeederProcesses } from './feeder.processes';
import { ShareModule } from '../share/share.module';
import { ContentModule } from '../content/content.module';
import { GroupsModule } from '../groups/groups.module';
import { FeederNotifications } from './feeder.notifications';

@Module({
  imports: [
    DbModule,
    NodeModule,
    ShareModule,
    forwardRef(() => ContentModule),
    GroupsModule,
  ],
  exports: [FeederRepository, FeederPermissions, FeederProcesses],
  providers: [
    FeederPermissions,
    FeederRepository,
    FeederProcesses,
    FeederNotifications,
  ],
  controllers: [FeederController],
})
export class FeederModule {}
