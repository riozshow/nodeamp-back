import { Module } from '@nestjs/common';
import { FeederEvents } from './feeder.events';
import { ContentEvents } from './content.events';
import { NodeEvents } from './node.events';
import { ShareEvents } from './share.events';
import { StorageEvents } from './storage.events';
import { DbModule } from 'src/db/db.module';
import { FeederModule } from 'src/models/feeder/feeder.module';
import { NodeModule } from 'src/models/node/node.module';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { PostEvents } from './post.events';

@Module({
  imports: [DbModule, FeederModule, NodeModule, WebsocketModule],
  providers: [
    FeederEvents,
    ContentEvents,
    NodeEvents,
    ShareEvents,
    StorageEvents,
    PostEvents,
  ],
})
export class EventsModule {}
