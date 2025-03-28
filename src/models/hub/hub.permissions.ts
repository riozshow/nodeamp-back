import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { FeederPermissions } from '../feeder/feeder.permissions';
import { FeederActions } from '../node/node.actions';

@Injectable()
export class HubPermissions {
  constructor(
    private db: DbService,
    private feederPermissions: FeederPermissions,
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

  async getPermittedFeeders(hubId: string, requestUserId: string) {
    const feeders = await this.db.feeder.findMany({
      where: {
        hubId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const permissions = Object.fromEntries(
      await Promise.all(
        feeders.map(async (feeder) => [
          feeder.id,
          await this.feederPermissions.getFeederPermissions(
            feeder.id,
            requestUserId,
          ),
        ]),
      ),
    );

    return feeders.filter((f) => permissions[f.id][FeederActions.view]);
  }
}
