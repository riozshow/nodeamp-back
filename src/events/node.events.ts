import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { share } from '@prisma/client';
import { WebsocketService } from 'src/websocket/websocket.service';
import { NodeProcesses } from 'src/models/node/node.processes';
import { EVENTS } from './events.names';
import { DbService } from 'src/db/db.service';
import { getCurrentDate } from 'src/utils/getCurrentDate';

@Injectable()
export class NodeEvents {
  constructor(
    private ws: WebsocketService,
    private processes: NodeProcesses,
    private db: DbService,
  ) {}

  async getSubscribersIdsByNodeId(nodeId: string, skipUserId: string) {
    return await this.db.user_group_member
      .findMany({
        where: {
          userId: { not: skipUserId },
          group: {
            type: 'subscriptions',
            hub: {
              nodes: {
                every: {
                  feederOutput: {
                    outputNode: {
                      id: nodeId,
                    },
                  },
                },
              },
            },
          },
        },
        select: {
          userId: true,
        },
      })
      .then((subs) => subs.map((sub) => sub.userId));
  }

  @OnEvent(EVENTS.RATES.CREATE)
  async checkRatedPost(rate: { shareId: string; nodeId: string }) {
    return await this.proceedShare({ id: rate.shareId });
  }

  @OnEvent(EVENTS.SHARES.MOVE)
  @OnEvent(EVENTS.SHARES.CREATE)
  async proceedShare(share: { id: string }) {
    const status = await this.processes.getShareStatus(share.id);
    await this.processes.executeShareStatus(status);
  }

  @OnEvent(EVENTS.SHARES.MOVE)
  async emitNewPost(share: share) {
    const date = getCurrentDate();

    const subscriptions = await this.getSubscribersIdsByNodeId(
      share.nodeId,
      share.userId,
    );

    this.ws.emitTo(
      [...subscriptions, share.userId],
      `node.shares.create.${share.nodeId}`,
      date,
    );
  }

  @OnEvent(EVENTS.SHARES.REMOVE)
  async emitRemovePost(share: share) {
    const subscriptions = await this.getSubscribersIdsByNodeId(
      share.nodeId,
      share.userId,
    );

    this.ws.emitTo(
      [...subscriptions, share.userId],
      `node.shares.remove.${share.nodeId}`,
      share.id,
    );
  }
}
