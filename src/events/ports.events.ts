import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from './events.names';
import { share } from '@prisma/client';
import { ShareRepository } from 'src/models/share/share.repository';

@Injectable()
export class PortsEvents {
  constructor(
    private db: DbService,
    private shareRepository: ShareRepository,
  ) {}

  @OnEvent(EVENTS.SHARES.MOVE)
  @OnEvent(EVENTS.SHARES.CREATE)
  async broadcastShare({ nodeLocationId, userId, postId, id }: share) {
    const sourceFeeder = await this.db.feeder.findFirst({
      where: {
        outputNode: {
          locations: {
            some: {
              shares: {
                some: {
                  id,
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
      },
    });
    if (sourceFeeder) {
      const subscriptions = await this.db.port_subscriptions.findMany({
        where: {
          senderPort: {
            connectedFeeders: {
              some: {
                feeder: {
                  outputNode: {
                    locations: {
                      some: {
                        id: nodeLocationId,
                      },
                    },
                  },
                },
              },
            },
          },
          recieverPort: {
            connectedFeeders: {
              every: {
                feeder: {
                  hub: {
                    nodes: {
                      some: {
                        locations: {
                          some: {
                            shares: {
                              none: {
                                postId,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            OR: [
              { open: true },
              {
                groups: {
                  some: {
                    group: {
                      userId,
                    },
                  },
                },
              },
            ],
          },
        },
        select: {
          recieverPort: {
            select: {
              connectedFeeders: {
                select: {
                  feederId: true,
                },
              },
            },
          },
        },
      });

      subscriptions.forEach((s) => {
        s.recieverPort.connectedFeeders.forEach(async ({ feederId }) => {
          await this.shareRepository.share.inFeeder({
            feederId,
            share: {
              shareId: id,
              userId,
            },
            sourceFeederId: sourceFeeder.id,
          });
        });
      });
    }
  }
}
