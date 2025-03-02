import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { FeederRepository } from 'src/models/feeder/feeder.repository';
import { PostRepository } from 'src/models/post/post.repository';
import { ShareCreateDTO, ShareShareDTO } from './share.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { share } from '@prisma/client';
import { ShareEvents } from 'src/events/share.events';
import { getCurrentDate } from 'src/utils/getCurrentDate';

@Injectable()
export class ShareRepository {
  constructor(
    private db: DbService,
    private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => FeederRepository))
    private feederRepository: FeederRepository,
  ) {}

  static PAGE_SIZE = 5;

  private emit = {
    create: (share: share) => this.eventEmitter.emit(ShareEvents.create, share),
    update: (share: share) => this.eventEmitter.emit(ShareEvents.update, share),
    remove: (share: share) => this.eventEmitter.emit(ShareEvents.remove, share),
    accept: (share: share) => this.eventEmitter.emit(ShareEvents.accept, share),
    reject: (share: share) => this.eventEmitter.emit(ShareEvents.reject, share),
    move: (share: share) => this.eventEmitter.emit(ShareEvents.move, share),
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
          id: true,
          comments: {
            where: { userId: requestUserId },
          },
          likes: {
            where: { userId: requestUserId },
          },
          message: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          post: {
            select: PostRepository.POST_SHARE_SELECT,
          },
          acceptedAt: true,
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
          id: true,
          comments: {
            where: { userId: requestUserId },
          },
          likes: {
            where: { userId: requestUserId },
          },
          message: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          post: {
            select: PostRepository.POST_SHARE_SELECT,
          },
          acceptedAt: true,
        },
        take: ShareRepository.PAGE_SIZE,
        skip,
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
          message: post.message,
          node: {
            connect: {
              id: inputNodeId,
            },
          },
          post: {
            create: {
              content: {
                connect: { id: post.contentId, userId: post.userId },
              },
              creatorFeeder: {
                connect: { id: feederId },
              },
              interactions: { create: {} },
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
      post: ShareShareDTO,
    ) => {
      const inputNodeId = await this.feederRepository.get.inputId(feederId);

      const share = await this.db.share.create({
        data: {
          message: post.message,
          node: {
            connect: {
              id: inputNodeId,
            },
          },
          post: {
            connect: {
              id: post.postId,
              shares: {
                some: { node: { feederOutput: { id: sourceFeederId } } },
              },
            },
          },
          user: { connect: { id: post.userId } },
        },
      });
      this.emit.create(share);
      return share;
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
    reject: async (shareId: string) => {
      const share = await this.db.share.delete({
        where: { id: shareId },
      });
      this.emit.reject(share);
      return share;
    },
  };
}
