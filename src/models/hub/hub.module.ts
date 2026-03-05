import { Module } from '@nestjs/common';
import { HubController } from './hub.controller';
import { DbModule } from 'src/db/db.module';
import { HubRepository } from './hub.repository';
import { PostModule } from 'src/models/post/post.module';
import { FeederModule } from 'src/models/feeder/feeder.module';
import { GroupsModule } from 'src/models/groups/groups.module';
import { NodeModule } from '../node/node.module';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { HubRouter } from './hub.router';
import { HubPermissions } from './hub.permissions';
import { HubProcesses } from './hub.processes';
import { HubGateway } from './hub.gateway';
import { HubGroups } from './hub.groups';

@Module({
  providers: [
    HubRepository,
    HubRouter,
    HubPermissions,
    HubProcesses,
    HubGateway,
    HubGroups,
  ],
  controllers: [HubController],
  imports: [
    DbModule,
    PostModule,
    FeederModule,
    GroupsModule,
    NodeModule,
    WebsocketModule,
  ],
  exports: [HubRepository, HubProcesses],
})
export class HubModule {}
