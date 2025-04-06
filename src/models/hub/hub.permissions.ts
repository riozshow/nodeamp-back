import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Injectable()
export class HubPermissions {
  constructor(private db: DbService) {}

  async getPermittedFeeders(hubId: string, requestUserId?: string) {
    return await this.db.feeder.findMany({
      where: {
        hubId,
        OR: [
          requestUserId ? { userId: requestUserId } : {},
          {
            permissions: {
              some: {
                type: 'user_group_post_view',
                OR: [
                  {
                    open: true,
                  },
                  requestUserId
                    ? {
                        groups: {
                          some: {
                            group: {
                              userId: requestUserId,
                            },
                          },
                        },
                      }
                    : {},
                ],
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        isDefault: true,
        outputNode: {
          select: {
            type: true,
          },
        },
      },
    });
  }

  async getPermittedPorts(hubId: string, requestUserId?: string) {
    return await this.db.port.findMany({
      where: {
        hubId,
        mode: 'SEND',
        OR: [
          {
            open: true,
          },
          requestUserId
            ? {
                groups: {
                  some: {
                    group: {
                      userId: requestUserId,
                    },
                  },
                },
              }
            : {},
        ],
      },
      select: {
        id: true,
        name: true,
        isDefault: true,
        _count: {
          select: {
            recievers: true,
          },
        },
      },
    });
  }
}
