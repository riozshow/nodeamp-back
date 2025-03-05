import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { FeederRepository } from 'src/models/feeder/feeder.repository';
import { PostRepository } from 'src/models/post/post.repository';
import { ShareCreateDTO, ShareShareDTO } from './share.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { share } from '@prisma/client';
import { getCurrentDate } from 'src/utils/getCurrentDate';
import { EVENTS } from 'src/events/events.names';

@Injectable()
export class ShareRepository {
  constructor(
    private db: DbService,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => FeederRepository))
    private feederRepository: FeederRepository,
  ) {}

  static PAGE_SIZE = 5;

  static NODE_SHARE_SELECT = {
    id: true,
    isPinned: true,
    user: {
      select: {
        id: true,
        name: true,
      },
    },
    post: { select: PostRepository.POST_SHARE_SELECT },
    acceptedAt: true,
  };

  private emit = {
    create: (share: share) =>
      this.eventEmitter.emit(EVENTS.SHARES.CREATE, share),
    update: (share: share) =>
      this.eventEmitter.emit(EVENTS.SHARES.UPDATE, share),
    remove: (share: share) =>
      this.eventEmitter.emit(EVENTS.SHARES.REMOVE, share),
    accept: (share: share) =>
      this.eventEmitter.emit(EVENTS.SHARES.ACCEPT, share),
    reject: (share: share) =>
      this.eventEmitter.emit(EVENTS.SHARES.REJECT, share),
    move: (share: share) => this.eventEmitter.emit(EVENTS.SHARES.MOVE, share),
  };

  public get = {
    byFeederId: async (
      feederId: string,
      skip: number,
      requestUserId?: string,
    ) => {
      return await this.db.share.findMany({
        where: {
          node: {
            feederOutput: { id: feederId },
          },
          acceptedAt: { not: null },
        },
        select: {
          ...ShareRepository.NODE_SHARE_SELECT,
          comments: {
            where: { userId: requestUserId },
          },
          likes: {
            where: { userId: requestUserId },
          },
        },
        take: ShareRepository.PAGE_SIZE,
        skip,
        orderBy: {
          acceptedAt: 'desc',
        },
      });
    },
    byNodeId: async (nodeId: string, skip: number, requestUserId?: string) => {
      return await this.db.share.findMany({
        where: {
          nodeId,
          acceptedAt: { not: null },
        },
        select: {
          ...ShareRepository.NODE_SHARE_SELECT,
          comments: {
            where: { userId: requestUserId },
          },
          likes: {
            where: { userId: requestUserId },
          },
        },
        take: ShareRepository.PAGE_SIZE,
        skip,
        orderBy: {
          acceptedAt: 'desc',
        },
      });
    },
    lastByNodeId: async (
      nodeId: string,
      lastShareId: string,
      requestUserId?: string,
    ) => {
      return await this.db.share.findMany({
        where: {
          nodeId,
          acceptedAt: { not: null },
        },
        select: {
          ...ShareRepository.NODE_SHARE_SELECT,
          comments: {
            where: { userId: requestUserId },
          },
          likes: {
            where: { userId: requestUserId },
          },
        },
        take: ShareRepository.PAGE_SIZE * -1,
        skip: 1,
        cursor: { id: lastShareId },
        orderBy: {
          acceptedAt: 'desc',
        },
      });
    },
  };

  public update = {
    accept: async (shareId: string) => {
      const share = await this.db.share.update({
        where: { id: shareId },
        data: {
          acceptedAt: getCurrentDate(),
        },
      });
      this.emit.accept(share);
      return share;
    },
    pin: async (shareId: string) => {
      const share = await this.db.share.update({
        where: { id: shareId },
        data: {
          isPinned: true,
        },
      });
      return share;
    },
    moveTo: async (shareId: string, nodeId: string) => {
      const share = await this.db.share.update({
        where: { id: shareId },
        data: {
          nodeId,
          updatedAt: getCurrentDate(),
        },
      });
      this.emit.move(share);
      return share;
    },
  };

  public create = {
    inFeeder: async (feederId: string, post: ShareCreateDTO) => {
      const inputNodeId = await this.feederRepository.get.inputId(feederId);
      const share = await this.db.share.create({
        data: {
          node: {
            connect: {
              id: inputNodeId,
            },
          },
          post: {
            create: {
              message: post.message,
              content: {
                connect: { id: post.contentId, userId: post.userId },
              },
              creatorFeeder: {
                connect: { id: feederId },
              },
              user: { connect: { id: post.userId } },
            },
          },
          user: { connect: { id: post.userId } },
        },
      });
      this.emit.create(share);
      return share;
    },
  };

  public share = {
    inFeeder: async (
      feederId: string,
      sourceFeederId: string,
      share: ShareShareDTO,
    ) => {
      const inputNodeId = await this.feederRepository.get.inputId(feederId);
      const post = await this.db.post.findFirst({
        where: {
          shares: {
            some: {
              id: share.shareId,
              node: { feederOutput: { id: sourceFeederId } },
            },
          },
        },
      });
      if (post) {
        const newShare = await this.db.share.create({
          data: {
            node: {
              connect: {
                id: inputNodeId,
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
    },
  };

  public delete = {
    fromFeeder: async (shareId: string, feederId: string) => {
      const share = await this.db.share.delete({
        where: {
          id: shareId,
          node: {
            feederOutput: {
              id: feederId,
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
          nodeId,
        },
      });
      this.emit.remove(share);
      return share;
    },
    reject: async (shareId: string) => {
      const share = await this.db.share.delete({
        where: { id: shareId },
      });
      this.emit.reject(share);
      return share;
    },
  };
}
