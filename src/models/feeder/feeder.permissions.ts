import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { NodePermmissions } from '../node/node.permissions';

@Injectable()
export class FeederPermissions {
  constructor(
    private db: DbService,
    private nodePermissions: NodePermmissions,
  ) {}

  async getFeederPermissions(feederId: string, reqestUserId?: string) {
    const feeder = await this.db.feeder.findUnique({
      where: { id: feederId },
      select: { inputNodeId: true, outputNodeId: true },
    });

    return Promise.all([
      await this.nodePermissions.getNodePermissions(
        feeder.inputNodeId,
        reqestUserId,
      ),
      await this.nodePermissions.getNodePermissions(
        feeder.outputNodeId,
        reqestUserId,
      ),
    ]).then((p) => p.flat());
  }
}
