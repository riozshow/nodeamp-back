import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PermissionType, PrismaClient } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';
import { isUUID } from 'class-validator';

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
    private action: PermissionType,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { user, params, query, sessionStore } = request;
    const { prisma } = sessionStore as { prisma: PrismaClient };

    const { feederId: feederIdInput } = this.permissionSource;
    const feederId = params[feederIdInput] || query[feederIdInput];

    if (feederId && isUUID(feederId)) {
      const permission = await prisma.feeder_permission.findUnique({
        where: {
          feederId_type: {
            feederId,
            type: this.action,
          },
          OR: [
            {
              public: true,
            },
            ...(user?.id
              ? [
                  {
                    feeder: {
                      userId: user?.id,
                    },
                  },
                  {
                    groups: {
                      some: {
                        group: {
                          userId: user?.id,
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

      return permission?.type === this.action;
    }

    return false;
  }
}
