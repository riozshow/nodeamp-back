import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { PermissionType } from '@prisma/client';
import { GroupsRepository } from '../groups/groups.repository';

export type PermissionsConfig = {
  type: PermissionType;
  public?: boolean;
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
      { type: 'user_group_post_view', public: true },
      { type: 'user_group_post_share', public: true },
      { type: 'user_group_post_comment', public: true },
      { type: 'user_group_post_create', public: false },
      { type: 'user_group_post_remove', public: false },
      { type: 'user_group_post_rate', public: false },
    ],
  };

  async getPermissions(feederId: string, reqestUserId?: string) {
    return await this.db.feeder_permission.findMany({
      where: {
        feederId,
        OR: [
          {
            public: true,
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
          public: permission.public,
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
          public: permission.public,
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
