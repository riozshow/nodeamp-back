import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { share } from '@prisma/client';
import { WebsocketService } from 'src/websocket/websocket.service';
import { NodeProcesses } from 'src/models/node/node.processes';
import { EVENTS } from './events.names';
import { DbService } from 'src/db/db.service';
import { getCurrentDate } from 'src/utils/getCurrentDate';
import { VISIBLE_NODES } from 'src/models/node/node.types';

@Injectable()
export class NodeEvents {
  constructor(
    private ws: WebsocketService,
    private processes: NodeProcesses,
    private db: DbService,
  ) {}

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
    await this.db.node.update({
      where: { id: share.nodeId },
      data: { lastShareAt: date },
    });
    const subscriptions = await this.db.hub_subscriptions.findMany({
      where: {
        hub: {
          nodes: { every: { type: { in: VISIBLE_NODES }, id: share.nodeId } },
        },
      },
      select: {
        userId: true,
      },
    });

    let usersIds = subscriptions.map((s) => s.userId);
    if (!usersIds.includes(share.userId)) {
      usersIds = [...usersIds, share.userId];
    }

    this.ws.emitTo(usersIds, `node.shares.create.${share.nodeId}`, date);
  }

  @OnEvent(EVENTS.SHARES.REMOVE)
  async emitRemovePost(share: share) {
    const subscriptions = await this.db.hub_subscriptions.findMany({
      where: {
        hub: {
          nodes: { every: { type: { in: VISIBLE_NODES }, id: share.nodeId } },
        },
      },
      select: {
        userId: true,
      },
    });

    let usersIds = subscriptions.map((s) => s.userId);
    if (!usersIds.includes(share.userId)) {
      usersIds = [...usersIds, share.userId];
    }

    this.ws.emitTo(usersIds, `node.shares.remove.${share.nodeId}`, share.id);
  }

  @OnEvent(EVENTS.NODES.VISIT)
  async updateVisit(visit: { userId: string; nodeId: string }) {
    const { userId, nodeId } = visit;
    const lastVisitAt = getCurrentDate();
    await this.db.node_visit.upsert({
      where: { userId_nodeId: { userId, nodeId } },
      create: {
        user: { connect: { id: userId } },
        node: { connect: { id: nodeId } },
        lastVisitAt,
      },
      update: {
        lastVisitAt,
        visitCount: { increment: 1 },
      },
    });
  }
}
