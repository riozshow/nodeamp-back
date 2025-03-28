import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './models/user/users.module';
import { DbModule } from './db/db.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FeederModule } from './models/feeder/feeder.module';
import { PostModule } from './models/post/post.module';
import { StorageModule } from './models/storage/storage.module';
import { HubModule } from './models/hub/hub.module';
import { WaveformsModule } from './models/waveforms/waveforms.module';
import { ImagesModule } from './models/images/images.module';
import { ContentModule } from './models/content/content.module';
import { AudioModule } from './models/audio/audio.module';
import { GroupsModule } from './models/groups/groups.module';
import { WebsocketModule } from './websocket/websocket.module';
import { ShareModule } from './models/share/share.module';
import { EventsModule } from './events/events.module';
import { NodeModule } from './models/node/node.module';
import { NodesController } from './models/node/node.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    EventsModule,
    AuthModule,
    UsersModule,
    DbModule,
    FeederModule,
    PostModule,
    StorageModule,
    HubModule,
    WaveformsModule,
    ImagesModule,
    ContentModule,
    AudioModule,
    GroupsModule,
    WebsocketModule,
    ShareModule,
    NodeModule,
  ],
  controllers: [],
})
export class AppModule {}
