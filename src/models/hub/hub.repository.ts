import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { HubPermissions } from './hub.permissions';
import { GroupsRepository } from 'src/models/groups/groups.repository';
import { HubRouter } from './hub.router';

@Injectable()
export class HubRepository {
  constructor(
    private db: DbService,
    private hubPermissions: HubPermissions,
    private groups: GroupsRepository,
    private router: HubRouter,
  ) {}

  public create = {
    one: async (userId: string, name: string) => {
      const hub = await this.db.hub.create({
        data: {
          name,
          user: { connect: { id: userId } },
        },
        select: {
          id: true,
        },
      });
      await this.groups.createHubDefaultUsersGroups(hub.id);
      await this.groups.createHubDefaultFeedersGroups(hub.id);
      const feeder = await this.router.createFeeder(hub.id, userId, {
        name: `${name} main`,
        comment: [],
        share: [],
        view: [],
      });
      await this.router.setDefaultFeeder(hub.id, userId, feeder.id);
      return await this.get.one(hub.id, userId);
    },
  };

  public get = {
    one: async (hubId: string, requestUserId: string) => {
      const hub = await this.db.hub.findUnique({
        where: { id: hubId },
        select: {
          id: true,
          name: true,
          userId: true,
          defaultFeederId: true,
        },
      });

      const localFeeders = await this.hubPermissions.getPermittedFeeders(
        hubId,
        requestUserId,
      );

      const nodes = await this.hubPermissions.getPermittedNodes(
        hubId,
        requestUserId,
      );

      return {
        id: hub.id,
        name: hub.name,
        defaultFeederId: hub.defaultFeederId,
        localFeeders,
        nodes,
        configurable: hub.userId === requestUserId,
      };
    },
  };
}
