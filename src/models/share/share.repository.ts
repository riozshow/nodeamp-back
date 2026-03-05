import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { ShareShareDTO } from './share.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { content_rate, Prisma, share } from '@prisma/client';
import { getCurrentDate } from 'src/utils/getCurrentDate';
import { EVENTS } from 'src/events/events.names';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class ShareRepository {
  constructor(
    private db: DbService,
    private eventEmitter: EventEmitter2,
  ) {}

  static PAGE_SIZE = 5;

  private emit = {
    create: (share: share) =>
      this.eventEmitter.emit(EVENTS.SHARES.CREATE, share),
    update: (share: share) =>
      this.eventEmitter.emit(EVENTS.SHARES.UPDATE, share),
    remove: (share: share) =>
      this.eventEmitter.emit(EVENTS.SHARES.REMOVE, share),
    reject: (share: share) =>
      this.eventEmitter.emit(EVENTS.SHARES.REJECT, share),
    move: (share: share, oldFeederId?: string) => {
      this.eventEmitter.emit(EVENTS.SHARES.MOVE, share);
      oldFeederId &&
        this.eventEmitter.emit(EVENTS.FEEDERS.TAG_REFRESH, {
          feederId: oldFeederId,
        });
    },
    rate: (rate: content_rate) =>
      this.eventEmitter.emit(EVENTS.SHARES.RATE, rate),
  };

  public get = {
    byFeederId: async (data: {
      feederId: string;
      select: Prisma.shareSelect;
      take: number;
      orderBy: { sharedAt: 'desc' | 'asc' };
      path?: string;
      lastShareId?: string;
    }) => {
      return await this.db.share.findMany({
        where: {
          nodeLocation: {
            path: data.path || '/',
            node: {
              feederOutput: { id: data.feederId },
            },
          },
        },
        select: data.select,
        take: data.take,
        ...(data.lastShareId ? { cursor: { id: data.lastShareId } } : {}),
        orderBy: data.orderBy,
      });
    },
  };

  public update = {
    pin: async (shareId: string) => {},
    moveTo: async (shareId: string, nodeId: string) => {
      const oldFeeder = await this.db.feeder.findFirst({
        where: {
          outputNode: {
            locations: {
              some: {
                shares: {
                  some: {
                    id: shareId,
                  },
                },
              },
            },
          },
        },
        select: { id: true },
      });

      const share = await this.db.share.update({
        where: { id: shareId },
        data: {
          nodeLocation: {
            connect: {
              nodeId_path: {
                nodeId,
                path: '/',
              },
            },
          },
          sharedAt: getCurrentDate(),
        },
      });

      this.emit.move(share, oldFeeder?.id);
      return share;
    },
    rate: async (
      shareId: string,
      userId: string,
      feederId: string,
      rate: number,
    ) => {
      const share = await this.db.share.findUnique({
        where: {
          id: shareId,
          nodeLocation: {
            node: {
              outputFeederId: feederId,
            },
          },
        },
        select: {
          post: {
            select: {
              content: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });
      if (share) {
        const alreadyRated = await this.db.content_rate.count({
          where: {
            shareId,
            node: {
              outputFeederId: feederId,
            },
            userId,
          },
        });

        if (!alreadyRated) {
          const rating = await this.db.content_rate.create({
            data: {
              share: { connect: { id: shareId } },
              node: { connect: { outputFeederId: feederId } },
              user: { connect: { id: userId } },
              content: { connect: { id: share.post.content.id } },
              rate,
            },
          });
          this.emit.rate(rating);
          return { shareId, feederId, rate };
        }
      }

      throw new BadRequestException();
    },
  };

  public create = {
    inFeeder: async (feederId: string, data: Prisma.shareCreateInput) => {
      const share = await this.db.share.create({ data });
      this.emit.create(share);
      return share;
    },
  };

  public share = {
    inFeeder: async (data: {
      feederId: string;
      path?: string;
      sourceFeederId: string;
      share: ShareShareDTO;
    }) => {
      const post = await this.db.post.findFirst({
        where: {
          shares: {
            some: {
              id: data.share.shareId,
              nodeLocation: {
                node: { feederOutput: { id: data.sourceFeederId } },
              },
            },
          },
        },
      });
      if (post) {
        const targetNode = await this.db.node.findUnique({
          where: { inputFeederId: data.feederId },
        });
        if (targetNode) {
          const newShare = await this.db.share.create({
            data: {
              nodeLocation: {
                connect: {
                  nodeId_path: {
                    path: data.path || '/',
                    nodeId: targetNode.id,
                  },
                },
              },
              post: {
                connect: {
                  id: post.id,
                },
              },
              user: { connect: { id: post.userId } },
            },
          });
          this.emit.create(newShare);
          return newShare;
        }
      }
    },
  };

  public delete = {
    fromFeeder: async (shareId: string, feederId: string) => {
      const share = await this.db.share.delete({
        where: {
          id: shareId,
          nodeLocation: {
            node: {
              feederOutput: {
                id: feederId,
              },
            },
          },
        },
      });
      this.emit.remove(share);
      return share;
    },
    fromNode: async (shareId: string, nodeId: string) => {
      const share = await this.db.share.delete({
        where: {
          id: shareId,
          nodeLocation: {
            nodeId,
          },
        },
      });
      this.emit.remove(share);
      return share;
    },
    one: async (shareId: string) => {
      const share = await this.db.share.delete({
        where: { id: shareId },
      });
      this.emit.reject(share);
      return share;
    },
    own: async (shareId: string, userId: string) => {
      const share = await this.db.share.delete({
        where: {
          id: shareId,
          userId,
        },
      });
      this.emit.remove(share);
      return share;
    },
    reject: async (shareId: string) => {
      const share = await this.db.share.delete({
        where: { id: shareId },
      });
      this.emit.remove(share);
      this.emit.reject(share);
      return share;
    },
  };
}
