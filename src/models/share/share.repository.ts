import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
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
    reject: (share: share) =>
      this.eventEmitter.emit(EVENTS.SHARES.REJECT, share),
    move: (share: share) => this.eventEmitter.emit(EVENTS.SHARES.MOVE, share),
  };

  public get = {
    byFeederId: async (
      feederId: string,
      requestUserId?: string,
      lastShareId?: string,
    ) => {
      return await this.db.share.findMany({
        where: {
          node: {
            feederOutput: { id: feederId },
          },
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
        cursor: { id: lastShareId },
        orderBy: {
          sharedAt: 'desc',
        },
      });
    },
    byNodeId: async (
      nodeId: string,
      requestUserId?: string,
      lastShareId?: string,
    ) => {
      return await this.db.share.findMany({
        where: {
          node: {
            id: nodeId,
          },
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
        cursor: { id: lastShareId },
        orderBy: {
          sharedAt: 'desc',
        },
      });
    },
  };

  public update = {
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
          sharedAt: getCurrentDate(),
        },
      });
      this.emit.move(share);
      return share;
    },
  };

  public create = {
    inFeeder: async (feederId: string, post: ShareCreateDTO) => {
      const share = await this.db.share.create({
        data: {
          node: {
            connect: {
              inputFeederId: feederId,
            },
          },
          post: {
            create: {
              message: post.message,
              ...(post.contentId
                ? {
                    content: {
                      connect: { id: post.contentId, userId: post.userId },
                    },
                  }
                : {}),
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
                inputFeederId: feederId,
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
  };
}
