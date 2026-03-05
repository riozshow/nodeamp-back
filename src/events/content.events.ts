import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DbService } from 'src/db/db.service';
import { FeederProcesses } from 'src/models/feeder/feeder.processes';
import { EVENTS } from './events.names';
import { HubProcesses } from 'src/models/hub/hub.processes';

@Injectable()
export class ContentEvents {
  constructor(
    private db: DbService,
    private feederProcesses: FeederProcesses,
    private hubProcesses: HubProcesses,
  ) {}

  @OnEvent(EVENTS.CONTENT.UPDATE.TAGS)
  async updateFeedersTags(contentId: string) {
    const feeders = await this.db.feeder.findMany({
      where: {
        outputNode: {
          locations: {
            some: {
              shares: {
                some: {
                  post: {
                    contentId,
                  },
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        hubId: true,
      },
    });

    for await (const feeder of feeders) {
      await this.feederProcesses.updateTags(feeder.id);
      await this.hubProcesses.updateTags(feeder.hubId);
    }
  }
}
