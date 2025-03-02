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
          isUserDefined: false,
          name: DefaultGroups.blocked,
        },
        {
          hubId,
          isUserDefined: false,
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
