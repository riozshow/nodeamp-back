import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Injectable()
export class HubProcesses {
  constructor(private db: DbService) {}

  async subscribe(hubId: string, userId: string) {
    const isSubscriber = !!(await this.db.hub_subscriptions.count({
      where: { hubId, userId },
    }));

    if (isSubscriber) {
      await this.db.hub_subscriptions.delete({ where: { hubId, userId } });
      await this.db.hub_user_group_member.deleteMany({
        where: { group: { hubId, type: 'subscribers' }, userId },
      });
      return { subscribes: false };
    } else {
      await this.db.hub_subscriptions.create({ data: { hubId, userId } });
      const subscribersGroup = await this.db.hub_user_group.findFirst({
        where: { hubId, type: 'subscribers' },
      });
      await this.db.hub_user_group_member.create({
        data: { groupId: subscribersGroup.id, userId },
      });
      return { subscribes: true };
    }
  }
}
