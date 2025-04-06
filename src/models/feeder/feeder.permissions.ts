import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { PermissionType } from '@prisma/client';
import { GroupsRepository } from '../groups/groups.repository';

export type PermissionsConfig = {
  type: PermissionType;
  open?: boolean;
  groups?: { groupId: string }[];
}[];

@Injectable()
export class FeederPermissions {
  constructor(
    private db: DbService,
    private groups: GroupsRepository,
  ) {}

  static DEFAULT_PERMISSIONS: {
    [key: string]: PermissionsConfig;
  } = {
    PUBLIC: [
      { type: 'user_group_post_view', open: true },
      { type: 'user_group_post_share', open: true },
      { type: 'user_group_post_comment', open: true },
      { type: 'user_group_post_create', open: false },
      { type: 'user_group_post_remove', open: false },
      { type: 'user_group_post_rate', open: false },
    ],
  };

  async getPermissions(feederId: string, reqestUserId?: string) {
    return await this.db.feeder_permission.findMany({
      where: {
        feederId,
        OR: [
          {
            open: true,
          },
          ...(reqestUserId
            ? [
                {
                  feeder: {
                    userId: reqestUserId,
                  },
                  groups: {
                    every: {
                      group: {
                        users: {
                          every: {
                            userId: reqestUserId,
                          },
                        },
                      },
                    },
                  },
                },
              ]
            : []),
        ],
      },
      select: {
        type: true,
      },
    });
  }

  async setPermissions(
    feederId: string,
    userId: string,
    config: PermissionsConfig,
  ) {
    const hub = await this.db.hub.findFirst({
      where: { feeders: { some: { id: feederId, userId } } },
      select: { id: true },
    });

    if (!hub) {
      throw new UnauthorizedException();
    }

    const hubGroups = await this.groups.getHubUserGroupsIds(hub.id, userId);

    await this.db.feeder_permission.deleteMany({
      where: { feederId },
    });

    for await (const permission of config) {
      await this.db.feeder_permission.upsert({
        where: {
          feederId_type: {
            type: permission.type,
            feederId,
          },
        },
        update: {
          open: permission.open,
          ...(permission.groups
            ? {
                groups: {
                  createMany: {
                    data: permission.groups
                      ?.filter((g) => hubGroups.includes(g.groupId))
                      .map((g) => ({
                        groupId: g.groupId,
                      })),
                  },
                },
              }
            : {}),
        },
        create: {
          open: permission.open,
          type: permission.type,
          feeder: {
            connect: {
              id: feederId,
              hub: {
                id: hub.id,
                userId,
              },
            },
          },
          ...(permission.groups
            ? {
                groups: {
                  createMany: {
                    data: permission.groups
                      ?.filter((g) => hubGroups.includes(g.groupId))
                      .map((g) => ({
                        groupId: g.groupId,
                      })),
                  },
                },
              }
            : {}),
        },
      });
    }

    return await this.getPermissions(feederId, userId);
  }
}
