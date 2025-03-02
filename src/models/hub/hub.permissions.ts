import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { NodePermmissions } from '../node/node.permissions';

Injectable();
export class HubPermissions {
  constructor(
    private db: DbService,
    private nodePermissions: NodePermmissions,
  ) {}

  async getPermittedFeeders(hubId: string, reqestUserId: string) {
    const hubFeeders = await this.db.feeder.findMany({
      where: { hubId },
      select: { id: true, name: true, inputNodeId: true, outputNodeId: true },
    });

    const feedersWithOutputPermissions = await Promise.all(
      hubFeeders.map(async (f) => ({
        id: f.id,
        name: f.name,
        inputNodeId: f.inputNodeId,
        permissions: await this.nodePermissions.getNodePermissions(
          f.outputNodeId,
          reqestUserId,
        ),
      })),
    );

    const visibleFeeders = feedersWithOutputPermissions.filter((f) =>
      f.permissions.includes('view'),
    );

    return await Promise.all(
      visibleFeeders.map(async (f) => ({
        id: f.id,
        name: f.name,
        permissions: [
          ...f.permissions,
          ...(await this.nodePermissions.getNodePermissions(
            f.inputNodeId,
            reqestUserId,
          )),
        ],
      })),
    );
  }
}
