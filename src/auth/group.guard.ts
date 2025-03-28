import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';
import { isUUID } from 'class-validator';
import { FeederActions } from 'src/models/node/node.actions';
import { FeederPermissions } from 'src/models/feeder/feeder.permissions';

export type Permissions = {
  [key: string]: {
    allow: string[];
    deny: string[];
  };
};

export type CompiledPermissions = {
  [key: string]: string[];
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

    const { feederId: feederIdInput } = this.permissionSource;
    const feederId = params[feederIdInput] || query[feederIdInput];

    let feeder: null | NodePermissionsType = null;

    if (feederId && isUUID(feederId)) {
      if (Object.values(FeederActions).includes(this.action)) {
        feeder = await prisma.feeder.findUnique({
          where: { id: feederId },
          select: {
            hub: { select: { userId: true, id: true } },
            permissions: {
              select: {
                data: true,
              },
            },
          },
        });

        if (!feeder) {
          return false;
        }

        if (user?.id === feeder?.hub?.userId) return true;
        const permissions = feeder.permissions.data as Permissions;
        const requestedAction = await FeederPermissions.areActionsPermitted(
          prisma,
          [this.action],
          user.id,
          permissions,
          user.id === feeder?.hub?.userId,
        );
        return requestedAction[this.action];
      }
    }

    return false;
  }
}
