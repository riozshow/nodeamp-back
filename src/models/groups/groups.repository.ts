import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

export const DefaultGroups = {
  blocked: 'Blocked',
  subscribers: 'Subscribers',
};

@Injectable()
export class GroupsRepository {
  constructor(private db: DbService) {}

  async createHubDefaultUsersGroups(hubId: string, userId: string) {
    return await Promise.all([
      this.db.user_group.create({
        data: {
          type: 'blocked',
          name: DefaultGroups.blocked,
          user: {
            connect: {
              id: userId,
            },
          },
          hub: {
            connect: {
              id: hubId,
            },
          },
        },
      }),
      this.db.user_group.create({
        data: {
          type: 'subscribers',
          name: DefaultGroups.subscribers,
          user: {
            connect: {
              id: userId,
            },
          },
          hub: {
            connect: {
              id: hubId,
            },
          },
        },
      }),
    ]);
  }
}
