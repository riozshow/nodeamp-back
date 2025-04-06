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

  async getHubUserGroupsIds(hubId: string, userId: string) {
    return await this.db.user_group
      .findMany({
        where: { hubId, userId },
        select: { id: true },
      })
      .then((groups) => groups.map((g) => g.id));
  }
}
