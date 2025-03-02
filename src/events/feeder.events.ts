import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { OnEvent } from '@nestjs/event-emitter';
import { share } from '@prisma/client';
import { FeederProcesses } from '../models/feeder/feeder.processes';
import { ShareEvents } from 'src/events/share.events';

@Injectable()
export class FeederEvents {
  constructor(
    private db: DbService,
    private processes: FeederProcesses,
  ) {}

  static create: 'feeder.create';
  static update: 'feeder.update';
  static remove: 'feeder.remove';

  @OnEvent(ShareEvents.update)
  @OnEvent(ShareEvents.accept)
  @OnEvent(ShareEvents.remove)
  async handleFeederTagsChange({ id }: share) {
    const shares = await this.db.share.findMany({
      where: { id },
      select: {
        nodeId: true,
      },
    });

    const feeders = await this.db.feeder.findMany({
      where: { outputNodeId: { in: shares.map((s) => s.nodeId) } },
      select: { id: true },
    });

    await Promise.all(
      feeders.map((feeder) => this.processes.refreshFeederTags(feeder.id)),
    );
  }
}
