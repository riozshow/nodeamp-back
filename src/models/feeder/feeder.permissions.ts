import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { PrismaClient } from '@prisma/client';
import { CompiledPermissions, Permissions } from 'src/auth/group.guard';
import { FeederActions } from '../node/node.actions';

@Injectable()
export class FeederPermissions {
  constructor(private db: DbService) {}

  DEFAULT_PERMISSIONS: {
    [key: string]: {
      create?: string[];
      share?: string[];
      comment?: string[];
      view?: string[];
      rate?: string[];
      remove?: string[];
    };
  } = {
    PUBLIC: {
      share: ['*'],
      comment: ['*'],
      view: ['*'],
      rate: ['*'],
    },
  };

  async getFeederPermissions(feederId: string, reqestUserId?: string) {
    const feeder = (await this.db.feeder.findUnique({
      where: { id: feederId },
      select: { userId: true, permissions: { select: { data: true } } },
    })) as { permissions: { data: Permissions } } & { userId: string };

    return await FeederPermissions.areActionsPermitted(
      this.db,
      Object.values(FeederActions),
      reqestUserId,
      feeder.permissions.data,
      reqestUserId === feeder.userId,
    );
  }

  static async areActionsPermitted(
    db: PrismaClient,
    actions: string[],
    userId: string,
    permissions: Permissions,
    isOwner: boolean,
  ) {
    const actionsPermissions: { [key: string]: boolean } = {};

    if (isOwner) {
      actions.forEach((action) => (actionsPermissions[action] = true));
      return actionsPermissions;
    }

    const permissionsGroupsIds = Object.values(permissions)
      .map(({ allow, deny }) => [...allow, ...deny])
      .flat();

    const userGroupsIds = await db.user_group_member
      .findMany({
        where: {
          userId,
          groupId: { in: permissionsGroupsIds.filter((id) => id !== '*') },
        },
        select: { groupId: true },
      })
      .then((groups) => groups.map((g) => g.groupId));

    for (const action in permissions) {
      if (actions.includes(action)) {
        if (
          permissions[action].deny.some((groupId) =>
            userGroupsIds.includes(groupId),
          )
        ) {
          actionsPermissions[action] = false;
          continue;
        }
        if (permissions[action].allow.includes('*')) {
          actionsPermissions[action] = true;
          continue;
        }
        if (
          permissions[action].allow.some((groupId) =>
            userGroupsIds.includes(groupId),
          )
        ) {
          actionsPermissions[action] = true;
          continue;
        }
        actionsPermissions[action] = false;
      }
    }

    return actionsPermissions;
  }

  async createPermissions(
    hubId: string,
    config: {
      create?: string[];
      share?: string[];
      comment?: string[];
      view?: string[];
      rate?: string[];
      remove?: string[];
    },
  ) {
    const permissions: { [key: string]: { allow: string[]; deny: string[] } } =
      {};

    const hubGroups = await this.db.user_group.findMany({
      where: {
        hubId,
      },
      select: {
        id: true,
        type: true,
      },
    });

    const blockedGroup = hubGroups.find((g) => g.type === 'blocked');
    const groupsIds = [...hubGroups.map((g) => g.id), '*'];

    for (const action in FeederActions) {
      permissions[FeederActions[action]] = {
        deny: [blockedGroup.id],
        allow: [],
      };
      if (config[action]) {
        for (const groupId of config[action]) {
          if (groupsIds.includes(groupId)) {
            permissions[FeederActions[action]].allow.push(groupId);
          }
        }
      }
    }

    return permissions;
  }

  async updatePermissions(
    feederId: string,
    userId: string,
    permissions: CompiledPermissions,
  ) {
    const decompiledPermissions: Permissions = {};

    const hub = await this.db.hub.findFirst({
      where: {
        userId,
        feeders: {
          some: {
            id: feederId,
          },
        },
      },
      select: {
        groups: {
          select: {
            id: true,
            type: true,
          },
        },
      },
    });

    if (hub.groups) {
      const blockedId = hub.groups.find((g) => g.type === 'blocked')?.id;
      if (blockedId) {
        const groupsIds = [...hub.groups.map((group) => group.id), '*'];
        for (const action in FeederActions) {
          const actionId = FeederActions[action];
          if (!!permissions[actionId]?.length) {
            if (permissions[actionId].every((gId) => groupsIds.includes(gId))) {
              decompiledPermissions[actionId] = {
                allow: permissions[actionId],
                deny: [blockedId],
              };
            }
          } else {
            decompiledPermissions[actionId] = {
              allow: [],
              deny: [blockedId],
            };
          }
        }
        await this.db.feeder_permissions.update({
          where: { feederId },
          data: {
            data: decompiledPermissions,
          },
          select: {
            data: true,
          },
        });
        return this.compilePermissions(decompiledPermissions);
      }
    }

    throw new BadRequestException();
  }

  compilePermissions(permissions: Permissions) {
    const compiledPermissions: CompiledPermissions = {};

    for (const action in permissions) {
      compiledPermissions[action] = permissions[action].allow;
    }

    return { data: compiledPermissions };
  }
}
