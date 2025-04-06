import { forwardRef, Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { NodeRepository } from './node.repository';
import { UsersModule } from 'src/models/user/users.module';
import { NodeProcesses } from './node.processes';
import { ShareModule } from '../share/share.module';
import { NodesController } from './node.controller';
import { NodeFilter } from './node.filter';
import { NodeDisplay } from './node.display';
import { NodeCreator } from './node.creator';

@Module({
  controllers: [NodesController],
  providers: [
    NodeProcesses,
    NodeRepository,
    NodeFilter,
    NodeDisplay,
    NodeCreator,
  ],
  exports: [NodeProcesses, NodeRepository, NodeDisplay, NodeCreator],
  imports: [
    DbModule,
    WebsocketModule,
    ShareModule,
    forwardRef(() => UsersModule),
  ],
})
export class NodeModule {}
