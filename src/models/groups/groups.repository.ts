import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

export const DefaultGroups = {
  blocked: 'Blocked',
  subscribers: 'Subscribers',
};

@Injectable()
export class GroupsRepository {
  constructor(private db: DbService) {}

  async createHubDefaultUsersGroups(hubId: string) {
    return await this.db.hub_user_group.createMany({
      data: [
        {
          hubId,
          type: 'blocked',
          name: DefaultGroups.blocked,
        },
        {
          hubId,
          type: 'subscribers',
          name: DefaultGroups.subscribers,
        },
      ],
    });
  }

  async createHubDefaultFeedersGroups(hubId: string) {
    return await this.db.hub_feeder_group.createMany({
      data: [
        {
          hubId,
          name: 'All external feeders',
        },
      ],
    });
  }
}
