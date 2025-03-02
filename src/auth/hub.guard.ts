import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { isUUID } from 'class-validator';

@Injectable()
export class HubGuard implements CanActivate {
  constructor(
    private permissionSource: {
      nodeId?: string;
      feederId?: string;
      hubId?: string;
    },
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { user, params, query, sessionStore } = request;
    const { prisma } = sessionStore as { prisma: PrismaClient };
    const {
      nodeId: nodeIdInput,
      feederId: feederIdInput,
      hubId: hubIdInput,
    } = this.permissionSource;

    const feederId = params[feederIdInput] || query[feederIdInput];
    const nodeId = params[nodeIdInput] || query[nodeIdInput];
    const hubId = params[hubIdInput] || query[hubIdInput];

    if (hubId && isUUID(hubId)) {
      if (isUUID(user.id)) {
        const ownHub = await prisma.hub.count({
          where: { id: hubId, userId: user.id },
        });

        if (!!ownHub) {
          if (feederId && isUUID(feederId)) {
            const ownFeeder = await prisma.feeder.count({
              where: { id: feederId, userId: user.id, hubId },
            });
            if (!ownFeeder) {
              return false;
            }
          }
          if (nodeId && isUUID(nodeId)) {
            const ownNode = await prisma.node.count({
              where: {
                id: nodeId,
                hub: {
                  id: hubId,
                  userId: user.id,
                },
              },
            });
            if (!ownNode) {
              return false;
            }
          }
          return true;
        }
      }
    }

    return false;
  }
}
