import { forwardRef, Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { NodeRepository } from './node.repository';
import { UsersModule } from 'src/models/user/users.module';
import { NodePermmissions } from './node.permissions';
import { NodeProcesses } from './node.processes';
import { ShareModule } from '../share/share.module';
import { NodeController } from './node.controller';

@Module({
  controllers: [NodeController],
  providers: [NodePermmissions, NodeProcesses, NodeRepository],
  exports: [NodeProcesses, NodeRepository, NodePermmissions],
  imports: [
    DbModule,
    WebsocketModule,
    ShareModule,
    forwardRef(() => UsersModule),
  ],
})
export class NodeModule {}
