import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { HubPermissions } from './hub.permissions';
import { GroupsRepository } from 'src/models/groups/groups.repository';
import { HubRouter } from './hub.router';
import { FeederPermissions } from '../feeder/feeder.permissions';

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

      await this.groups.createHubDefaultUsersGroups(hub.id, userId);

      const feeder = await this.router.createFeeder(hub.id, userId, {
        name: `${name} main`,
        permissions: FeederPermissions.DEFAULT_PERMISSIONS.PUBLIC,
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
        },
      });

      if (!hub) {
        throw new NotFoundException();
      }

      const feeders = await this.hubPermissions.getPermittedFeeders(
        hubId,
        requestUserId,
      );

      const ports = await this.hubPermissions.getPermittedPorts(
        hubId,
        requestUserId,
      );

      return {
        id: hub.id,
        userId: hub.userId,
        name: hub.name,
        feeders,
        ports,
        configurable: hub.userId === requestUserId,
      };
    },

    settings: async (hubId: string, requestUserId: string) => {
      return await this.db.hub.findUnique({
        where: { id: hubId, userId: requestUserId },
        select: {
          id: true,
          name: true,
          feeders: {
            select: {
              id: true,
              name: true,
              isDefault: true,
            },
          },
          nodes: {
            select: {
              id: true,
              type: true,
              name: true,
              targetNodes: {
                select: {
                  targetNodeId: true,
                },
              },
              position: {
                select: {
                  x: true,
                  y: true,
                },
              },
              config: {
                select: {
                  data: true,
                },
              },
            },
          },
          groups: {
            where: { type: { not: 'blocked' } },
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });
    },

    routerSettings: async (hubId: string, requestUserId: string) => {
      return await this.db.hub.findUnique({
        where: { id: hubId, userId: requestUserId },
        select: {
          id: true,
          name: true,
          feeders: {
            select: {
              id: true,
              name: true,
              isDefault: true,
            },
          },
          nodes: {
            select: {
              id: true,
              type: true,
              name: true,
              inputFeederId: true,
              outputFeederId: true,
              targetNodes: {
                select: {
                  targetNodeId: true,
                },
              },
              position: {
                select: {
                  x: true,
                  y: true,
                },
              },
              config: {
                select: {
                  data: true,
                },
              },
            },
          },
          groups: {
            where: { type: { not: 'blocked' } },
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });
    },

    feedersSettings: async (hubId: string, requestUserId: string) => {
      return await this.db.hub.findUnique({
        where: { id: hubId, userId: requestUserId },
        select: {
          id: true,
          name: true,
          feeders: {
            select: {
              id: true,
              name: true,
              isDefault: true,
              inputNode: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
              outputNode: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
          nodes: {
            select: {
              id: true,
              type: true,
              name: true,
              inputFeederId: true,
              outputFeederId: true,
            },
          },
          groups: {
            where: { type: { not: 'blocked' } },
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });
    },
  };
}
