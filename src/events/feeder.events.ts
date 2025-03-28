import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { OnEvent } from '@nestjs/event-emitter';
import { feeder, share } from '@prisma/client';
import { FeederProcesses } from '../models/feeder/feeder.processes';
import { EVENTS } from './events.names';
import { WebsocketService } from 'src/websocket/websocket.service';

@Injectable()
export class FeederEvents {
  constructor(
    private db: DbService,
    private processes: FeederProcesses,
    private ws: WebsocketService,
  ) {}

  @OnEvent(EVENTS.SHARES.MOVE)
  @OnEvent(EVENTS.SHARES.REMOVE)
  async changeTagsOnShareMove({ id }: share) {
    const share = await this.db.share.findUnique({
      where: { id },
      select: {
        node: {
          select: {
            outputFeederId: true,
          },
        },
      },
    });

    if (share.node.outputFeederId) {
      await this.processes.refreshFeederTags(share.node.outputFeederId);
    }
  }

  @OnEvent(EVENTS.FEEDERS.UPDATE)
  async updateFeeder(feeder: feeder) {
    this.ws.emitTo([feeder.userId], `feeder.details.update.${feeder.id}`, true);
  }
}
