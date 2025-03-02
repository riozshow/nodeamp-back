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

  async getPermittedFeeders(hubId: string, reqestUserId: string) {
    const feedersOutputNodes = await this.db.node.findMany({
      where: {
        hubId,
        type: NODE.OUTPUT,
      },
      select: {
        id: true,
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
          reqestUserId,
        ),
      })),
    ).then((nodes) => nodes.filter((n) => n.permissions.includes('view')));

    return nodesPermissions.map((n) => n.feederOutput);
  }

  async getPermittedNodes(hubId: string, requestUserId: string) {
    const hubNodes = await this.db.node.findMany({
      where: { hubId, type: { in: VISIBLE_NODES } },
      select: { id: true, name: true, type: true },
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
