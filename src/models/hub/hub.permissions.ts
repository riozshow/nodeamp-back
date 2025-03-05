import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { NodePermmissions } from '../node/node.permissions';
import { NODE, VISIBLE_NODES } from '../node/node.types';

@Injectable()
export class HubPermissions {
  constructor(
    private db: DbService,
    private nodePermissions: NodePermmissions,
  ) {}

  getNewSharesInfo({
    visits,
    lastShareAt,
  }: {
    visits: { lastVisitAt: Date }[];
    lastShareAt: Date;
  }) {
    if (visits?.length) {
      const [{ lastVisitAt }] = visits;
      const lastVisitDate = new Date(lastVisitAt).getTime();
      const lastShareDate = new Date(lastShareAt).getTime();
      return lastShareDate > lastVisitDate;
    } else {
      return !!lastShareAt;
    }
  }

  async getPermittedFeeders(
    hubId: string,
    requestUserId: string,
    isSubscriber?: boolean,
  ) {
    const feedersOutputNodes = await this.db.node.findMany({
      where: {
        hubId,
        type: NODE.OUTPUT,
      },
      select: {
        id: true,
        lastShareAt: true,
        ...(isSubscriber
          ? {
              visits: {
                where: { userId: requestUserId },
                select: { lastVisitAt: true },
              },
            }
          : {}),
        feederOutput: {
          select: {
            id: true,
            name: true,
            outputNodeId: true,
          },
        },
      },
    });

    const nodesPermissions = await Promise.all(
      feedersOutputNodes.map(async (node) => ({
        ...node,
        permissions: await this.nodePermissions.getNodePermissions(
          node.id,
          requestUserId,
        ),
      })),
    ).then((nodes) => nodes.filter((n) => n.permissions.includes('view')));

    return nodesPermissions.map((n) => ({
      ...n.feederOutput,
      hasNewShares: this.getNewSharesInfo(n),
    }));
  }

  async getPermittedNodes(
    hubId: string,
    requestUserId: string,
    isSubscriber?: boolean,
  ) {
    const hubNodes = await this.db.node.findMany({
      where: { hubId, type: { in: VISIBLE_NODES } },
      select: {
        id: true,
        name: true,
        type: true,
        lastShareAt: true,
        ...(isSubscriber
          ? {
              visits: {
                where: { userId: requestUserId },
                select: { lastVisitAt: true },
              },
            }
          : {}),
      },
    });

    const nodesWithPermission = await Promise.all(
      hubNodes.map(async (node) => ({
        ...node,
        permissions: await this.nodePermissions.getNodePermissions(
          node.id,
          requestUserId,
        ),
      })),
    );

    return nodesWithPermission.filter((node) =>
      node.permissions.includes('view'),
    );
  }
}
