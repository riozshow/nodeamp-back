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

  @OnEvent(EVENTS.SHARES.MOVE)
  async emitNewPost(share: share) {}

  @OnEvent(EVENTS.SHARES.REMOVE)
  async emitRemovePost(share: share) {}
}
