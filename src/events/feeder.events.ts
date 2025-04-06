import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { feeder, share } from '@prisma/client';
import { EVENTS } from './events.names';
import { WebsocketService } from 'src/websocket/websocket.service';

@Injectable()
export class FeederEvents {
  constructor(private ws: WebsocketService) {}

  @OnEvent(EVENTS.FEEDERS.UPDATE)
  async updateFeeder(feeder: feeder) {
    this.ws.emitTo([feeder.userId], `feeder.details.update.${feeder.id}`, true);
  }

  @OnEvent(EVENTS.SHARES.CREATE)
  @OnEvent(EVENTS.SHARES.MOVE)
  async updateSharesList({ userId }: share) {}
}
