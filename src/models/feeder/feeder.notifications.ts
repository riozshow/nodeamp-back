import { Injectable } from '@nestjs/common';
import { EVENTS } from 'src/events/events.names';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class FeederNotifications {
  constructor(private eventEmitter: EventEmitter2) {}

  private emit = {
    load: (event: { userId: string; feederId: string }) =>
      this.eventEmitter.emit(EVENTS.FEEDERS.LOAD, event),
  };

  async removeFeederNotifications(feederId: string, requestUserId: string) {
    this.emit.load({ feederId, userId: requestUserId });
  }
}
