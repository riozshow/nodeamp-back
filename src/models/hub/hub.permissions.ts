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
                    public: true,
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
        tags: {
          select: {
            name: true,
          },
        },
        outputNode: {
          select: {
            type: true,
          },
        },
        inputNode: {
          select: {
            _count: true,
          },
        },
        ...(requestUserId
          ? {
              _count: {
                select: {
                  notifications: {
                    where: {
                      feeder: {
                        userId: requestUserId,
                      },
                      type: { in: ['SHARE_CREATED', 'SHARE_MOVED'] },
                    },
                  },
                },
              },
            }
          : {}),
      },
    });
  }

  async getPermittedPorts(hubId: string, requestUserId?: string) {
    if (!requestUserId) return [];
    return await this.db.port.findMany({
      where: {
        hubId,
        OR: [
          {
            open: true,
          },
          {
            hub: {
              userId: requestUserId,
            },
          },
          {
            groups: {
              some: {
                group: {
                  userId: requestUserId,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        mode: true,
        name: true,
        recievers: {
          where: {
            recieverPort: {
              hub: {
                userId: requestUserId,
              },
            },
          },
          select: {
            recieverPortId: true,
          },
        },
        senders: {
          where: {
            senderPort: {
              hub: {
                userId: requestUserId,
              },
            },
          },
          select: {
            senderPortId: true,
          },
        },
      },
    });
  }
}
