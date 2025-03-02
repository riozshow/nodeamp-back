import { Module } from '@nestjs/common';
import { FeederEvents } from './feeder.events';
import { ContentEvents } from './content.events';
import { NodeEvents } from './node.events';
import { ShareEvents } from './share.events';
import { StorageEvents } from './storage.events';

@Module({})
export class EventsModule {
  providers: [
    FeederEvents,
    ContentEvents,
    NodeEvents,
    ShareEvents,
    StorageEvents,
  ];
}
