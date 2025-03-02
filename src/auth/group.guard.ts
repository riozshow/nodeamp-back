import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';
import { isUUID } from 'class-validator';
import { NodePermmissions } from 'src/models/node/node.permissions';
import { NodeTypeActions } from 'src/models/node/node.actions';

export type Permissions = {
  [key: string]: {
    allow: string[];
    deny: string[];
  };
};

export type NodePermissionsType = {
  permissions: { data: JsonValue };
  hub: { userId: string; id: string };
};

@Injectable()
export class GroupGuard implements CanActivate {
  constructor(
    private permissionSource: {
      nodeId?: string;
      feederId?: string;
    },
    private action: string,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { user, params, query, sessionStore } = request;
    const { prisma } = sessionStore as { prisma: PrismaClient };
    const { nodeId: nodeIdInput, feederId: feederIdInput } =
      this.permissionSource;

    const feederId = params[feederIdInput] || query[feederIdInput];
    const nodeId = params[nodeIdInput] || query[nodeIdInput];

    let feeder: null | {
      inputNode?: NodePermissionsType;
      outputNode?: NodePermissionsType;
    } = null;

    let node: null | NodePermissionsType = null;

    if (feederId && isUUID(feederId)) {
      if (NodeTypeActions.input.includes(this.action)) {
        feeder = await prisma.feeder.findUnique({
          where: { id: feederId },
          select: {
            inputNode: {
              select: {
                hub: { select: { userId: true, id: true } },
                permissions: {
                  select: {
                    data: true,
                  },
                },
              },
            },
          },
        });
      } else if (NodeTypeActions.output.includes(this.action)) {
        feeder = await prisma.feeder.findUnique({
          where: { id: feederId },
          select: {
            outputNode: {
              select: {
                hub: { select: { userId: true, id: true } },
                permissions: {
                  select: {
                    data: true,
                  },
                },
              },
            },
          },
        });
      }
      node = feeder.inputNode || feeder.outputNode;
    }

    if (!node) {
      if (nodeId && isUUID(nodeId)) {
        node = await prisma.node.findUnique({
          where: { id: nodeId },
          select: {
            hub: { select: { id: true, userId: true } },
            permissions: { select: { data: true } },
          },
        });
      }
    }

    if (node) {
      if (user?.id === node.hub.userId) return true;

      const userGroupsIds = await NodePermmissions.getUserGroupsIdsByHubId(
        prisma,
        user.id,
        node.hub.id,
      );

      const permissions = node.permissions.data as Permissions;

      if (
        !!NodePermmissions.getValidatedNodeActions(
          [this.action],
          userGroupsIds,
          permissions,
        )
      ) {
        return true;
      }
    }

    return false;
  }
}
