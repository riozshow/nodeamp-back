import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from './events.names';
import { content_rate, share } from '@prisma/client';
import { NodeProcesses } from 'src/models/node/node.processes';
import { DbService } from 'src/db/db.service';

@Injectable()
export class ShareEvents {
  constructor(
    private db: DbService,
    private nodeProcesses: NodeProcesses,
  ) {}

  @OnEvent(EVENTS.SHARES.CREATE)
  async onShareCreate(share: share) {
    await this.nodeProcesses.proceedShare(share);
  }

  @OnEvent(EVENTS.SHARES.RATE)
  async onShareRate(rate: content_rate) {
    const share = await this.db.share.findUnique({
      where: { id: rate.shareId },
    });
    await this.nodeProcesses.proceedShare(share);
  }
}
