import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { OnEvent } from '@nestjs/event-emitter';
import { share } from '@prisma/client';
import { FeederProcesses } from '../models/feeder/feeder.processes';
import { EVENTS } from './events.names';

@Injectable()
export class FeederEvents {
  constructor(
    private db: DbService,
    private processes: FeederProcesses,
  ) {}

  @OnEvent(EVENTS.SHARES.UPDATE)
  @OnEvent(EVENTS.SHARES.ACCEPT)
  @OnEvent(EVENTS.SHARES.REMOVE)
  async handleFeederTagsChange({ id }: share) {
    const shares = await this.db.share.findMany({
      where: { id, acceptedAt: { not: null } },
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
