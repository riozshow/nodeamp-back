import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { NewGroupDTO, UpdateGroupDTO } from './hub.dto';
import { GroupPermissionType, Prisma } from '@prisma/client';
import { GroupsRepository } from '../groups/groups.repository';

@Injectable()
export class HubGroups {
  constructor(
    private db: DbService,
    private groups: GroupsRepository,
  ) {}

  async groupExistInRouter(
    groupId: string,
    hubId: string,
    requestUserId: string,
  ) {
    return await this.db.user_group.findUnique({
      where: { id: groupId, hubId, hub: { userId: requestUserId } },
      select: { id: true },
    });
  }

  async update(
    groupId: string,
    hubId: string,
    userId: string,
    data: UpdateGroupDTO,
  ) {
    const updateData: Prisma.user_groupUpdateInput = {};

    if (data.name) {
      updateData.name = data.name;
    }

    if (data.permissions) {
      await this.setGroupPermissionsConfig(groupId, userId, data.permissions);
    }

    await this.db.user_group.update({
      where: {
        id: groupId,
        hubId,
        userId,
      },
      data: updateData,
    });

    return await this.getGroupPermissions(hubId, userId, groupId);
  }

  async getData(hubId: string, userId: string) {
    return await this.db.hub.findUnique({
      where: {
        id: hubId,
        user: {
          id: userId,
        },
      },
      select: {
        groups: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                users: true,
              },
            },
          },
        },
      },
    });
  }

  async getGroupPermissions(hubId: string, userId: string, groupId: string) {
    return this.db.user_group.findUnique({
      where: {
        hubId,
        userId,
        id: groupId,
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true,
          },
        },
        permissions: {
          select: {
            type: true,
            public: true,
            groups: {
              select: {
                groupId: true,
              },
            },
          },
        },
      },
    });
  }

  async createGroup(hubId: string, userId: string, newGroup: NewGroupDTO) {
    return this.db.user_group.create({
      data: {
        hubId,
        userId,
        name: newGroup.name,
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  }

  async deleteGroup(groupId: string, hubId: string, userId: string) {
    return this.db.user_group.delete({
      where: {
        id: groupId,
        hubId,
        userId,
      },
      select: {
        id: true,
      },
    });
  }

  async setGroupPermissionsConfig(
    groupId: string,
    userId: string,
    config: {
      id: string;
      type: GroupPermissionType;
      public: boolean;
      groups?: { groupId: string }[];
    }[],
  ) {
    const hub = await this.db.hub.findFirst({
      where: { groups: { some: { id: groupId, userId } } },
      select: { id: true },
    });

    if (!hub) {
      throw new UnauthorizedException();
    }

    const hubGroups = await this.groups.getHubUserGroupsIds(hub.id, userId);

    await this.db.$transaction(async (tx) => {
      await tx.group_permission.deleteMany({
        where: { groupId },
      });

      for await (const permission of config) {
        await tx.group_permission.upsert({
          where: {
            groupId_type: {
              type: permission.type,
              groupId,
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
            group: {
              connect: {
                id: groupId,
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
    });

    return { updated: true };
  }
}
