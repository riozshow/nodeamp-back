import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { feeder, share } from '@prisma/client';
import { EVENTS } from './events.names';
import { WebsocketService } from 'src/websocket/websocket.service';
import { DbService } from 'src/db/db.service';
import { FeederProcesses } from 'src/models/feeder/feeder.processes';
import { HubProcesses } from 'src/models/hub/hub.processes';

@Injectable()
export class FeederEvents {
  constructor(
    private ws: WebsocketService,
    private db: DbService,
    private feederProcesses: FeederProcesses,
    private hubProcesses: HubProcesses,
  ) {}

  @OnEvent(EVENTS.FEEDERS.UPDATE)
  async updateFeeder(feeder: feeder) {
    this.ws.emitTo([feeder.userId], `feeder.details.update.${feeder.id}`, true);
  }

  @OnEvent(EVENTS.FEEDERS.LOAD)
  async removeFeederNotifications({
    userId,
    feederId,
  }: {
    userId: string;
    feederId: string;
  }) {
    await this.db.notification.deleteMany({
      where: {
        feeder: {
          id: feederId,
          userId,
        },
      },
    });
  }

  @OnEvent(EVENTS.SHARES.CREATE)
  @OnEvent(EVENTS.SHARES.MOVE)
  @OnEvent(EVENTS.SHARES.REMOVE)
  async updateFeederTagsFromShare(share: share) {
    const feeder = await this.db.feeder.findFirst({
      where: {
        outputNode: {
          locations: {
            some: {
              id: share.nodeLocationId,
            },
          },
        },
      },
      select: {
        id: true,
        hubId: true,
      },
    });

    if (feeder) {
      await this.feederProcesses.updateTags(feeder.id);
      await this.hubProcesses.updateTags(feeder.hubId);
    }
  }

  @OnEvent(EVENTS.FEEDERS.TAG_REFRESH)
  async refreshTags({ feederId }: { feederId: string }) {
    await this.feederProcesses.updateTags(feederId);

    const hub = await this.db.hub.findFirst({
      where: { feeders: { some: { id: feederId } } },
    });

    if (hub) {
      await this.hubProcesses.updateTags(hub.id);
    }
  }
}
