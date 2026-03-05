import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

export const DefaultGroups = {
  blocked: 'Blocked',
  subscribers: 'Subscribers',
};

@Injectable()
export class GroupsRepository {
  constructor(private db: DbService) {}

  async getHubUserGroupsIds(hubId: string, userId: string) {
    return await this.db.user_group
      .findMany({
        where: { hubId, userId },
        select: { id: true },
      })
      .then((groups) => groups.map((g) => g.id));
  }
}
