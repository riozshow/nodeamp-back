import { Injectable } from '@nestjs/common';
import { NodeTypeActions, NodeActions } from './node.actions';
import { PrismaClient } from '@prisma/client';
import { DbService } from 'src/db/db.service';

@Injectable()
export class NodePermmissions {
  constructor(private db: DbService) {}

  getPermissionKey(permission: string) {
    const nodeAction = Object.entries(NodeActions).find(
      ([key, value]) => value === permission,
    );
    return nodeAction[0];
  }

  async getNodePermissions(id: string, requestUserId?: string) {
    const node = await this.db.node.findUnique({
      where: { id },
      select: {
        type: true,
        hub: { select: { id: true, userId: true } },
        permissions: { select: { data: true } },
      },
    });

    const actions: string[] = NodeTypeActions[node.type] || [];

    if (node.hub.userId === requestUserId) {
      return actions.map((permission) => this.getPermissionKey(permission));
    }

    const permissions = node.permissions.data as unknown;
    const userPermissions: string[] = [];

    if (requestUserId) {
      const userGroupsIds = await NodePermmissions.getUserGroupsIdsByHubId(
        this.db,
        requestUserId,
        node.hub.id,
      );
      return NodePermmissions.getValidatedNodeActions(
        actions,
        userGroupsIds,
        permissions,
      );
    }

    return userPermissions;
  }

  async setNodePermissions(
    id: string,
    permissions: {
      create?: string[];
      view?: string[];
      remove?: string[];
      share?: string[];
      comment?: string[];
    },
  ) {
    const node = await this.db.node.findUnique({
      where: { id },
      select: {
        type: true,
        hub: {
          select: {
            id: true,
            userId: true,
            usersGroups: { select: { id: true, name: true } },
          },
        },
      },
    });

    const groupsIds = node.hub.usersGroups.map((g) => g.id);
    const typeActions = NodeTypeActions[node.type] || [];
    const blockedGroupId = node.hub.usersGroups.find((g) => g.name)?.id;

    const data: {
      [key: string]: {
        allow?: string[];
        deny: string[];
      };
    } = {};

    for (const action of typeActions) {
      const actionKey = Object.values(NodeActions).find(
        (value) => action === value,
      );
      if (permissions[actionKey]) {
        const filteredGroupIds = groupsIds.filter((id) =>
          permissions[actionKey].includes(id),
        );
        data[action].allow = filteredGroupIds;
      }
      if (data[action]?.deny) {
        data[action].deny = [blockedGroupId];
      } else {
        data[action] = { deny: [blockedGroupId] };
      }
    }

    await this.db.node_permissions.upsert({
      where: { nodeId: id },
      update: { data },
      create: { nodeId: id, data },
    });
  }

  static async getUserGroupsIdsByHubId(
    db: PrismaClient,
    userId: string,
    hubId: string,
  ) {
    return await db.hub_user_group_member
      .findMany({
        where: {
          userId,
          group: {
            hubId,
          },
        },
        select: {
          groupId: true,
        },
      })
      .then((groups) => groups.map((g) => g.groupId));
  }

  static getValidatedNodeActions(
    actions: string[],
    userGroupsIds: string[],
    permissions: unknown,
  ) {
    const userPermissions: string[] = [];
    for (const action of actions) {
      if (permissions[action]) {
        const { deny, allow } = permissions[action] as {
          deny?: string[];
          allow?: string[];
        };

        if (deny) {
          if (deny.some((id) => userGroupsIds.includes(id))) {
            continue;
          }
        }

        if (allow) {
          if (
            allow.length === 0 ||
            allow.some((id) => userGroupsIds.includes(id))
          ) {
            userPermissions.push(action);
          }
        }
      }
    }
    return userPermissions;
  }
}
