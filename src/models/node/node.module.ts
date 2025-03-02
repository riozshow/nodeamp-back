import { forwardRef, Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { NodeEvents } from 'src/events/node.events';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { NodeRepository } from './node.repository';
import { UsersModule } from 'src/models/user/users.module';
import { NodePermmissions } from './node.permissions';
import { NodeProcesses } from './node.processes';
import { ShareModule } from '../share/share.module';

@Module({
  providers: [NodeEvents, NodeProcesses, NodeRepository, NodePermmissions],
  exports: [NodeProcesses, NodeRepository],
  imports: [
    DbModule,
    WebsocketModule,
    forwardRef(() => UsersModule),
    ShareModule,
  ],
})
export class NodeModule {}
