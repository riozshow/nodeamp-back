import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { DbService } from 'src/db/db.service';
import { feeder, content } from '@prisma/client';
import { EVENTS } from './events.names';

@Injectable()
export class ContentEvents {
  constructor(
    private db: DbService,
    private emitter: EventEmitter2,
  ) {}

  @OnEvent(EVENTS.SHARES.REMOVE)
  @OnEvent(EVENTS.SHARES.LIKE)
  @OnEvent(EVENTS.SHARES.UNLIKE)
  async updateLikes({ id }: { id?: string }) {
    if (!id) return;

    const content = await this.db.content.findFirst({
      where: {
        posts: {
          every: {
            shares: {
              every: {
                id,
              },
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    const posts = await this.db.post.findMany({
      where: { contentId: content.id },
      select: { id: true, shares: { select: { id: true } } },
    });

    const likes = await this.db.content_like.groupBy({
      by: ['userId'],
      where: {
        shareId: { in: posts.map((p) => p.shares.map((s) => s.id)).flat() },
      },
    });

    await this.db.content_interactions.update({
      where: { contentId: content.id },
      data: { likes: likes.length },
    });
  }

  @OnEvent(EVENTS.SHARES.ACCEPT)
  @OnEvent(EVENTS.SHARES.REMOVE)
  async updateShares({ contentId }: { contentId?: string }) {
    if (!contentId) return;

    const feeders = await this.db.node.count({
      where: {
        shares: {
          every: {
            post: {
              content: {
                id: contentId,
              },
            },
          },
        },
      },
    });

    await this.db.content_interactions.update({
      where: { contentId },
      data: {
        feeders,
      },
    });
  }

  @OnEvent(EVENTS.POSTS.REMOVE)
  async updateFeeders({ id }: { id: string }) {}

  @OnEvent(EVENTS.SHARES.COMMENT)
  @OnEvent(EVENTS.SHARES.UNCOMMENT)
  async updateComments({ postId }: { postId: string }) {
    const content = await this.db.content.findFirst({
      where: {
        posts: {
          some: {
            id: postId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (content) {
      const posts = await this.db.post.findMany({
        where: { contentId: content.id },
        select: { id: true },
      });

      const comments = await this.db.content_comment.findMany({
        where: {
          shareId: { in: posts.map((p) => p.id) },
        },
        select: {
          userId: true,
          time: true,
        },
      });

      await this.db.content_interactions.update({
        where: {
          contentId: content.id,
        },
        data: {
          comments: comments.length,
        },
      });
    }
  }

  @OnEvent(EVENTS.FEEDERS.REMOVE)
  async updateSharesAfterFeederDelete({ inputNodeId, outputNodeId }: feeder) {
    await this.db.post.deleteMany({
      where: {
        shares: {
          every: { nodeId: { in: [inputNodeId, outputNodeId] } },
        },
      },
    });

    const contents = await this.db.content.findMany({
      where: {
        posts: {
          every: {
            shares: {
              every: {
                nodeId: { in: [inputNodeId, outputNodeId] },
              },
            },
          },
        },
      },
      select: { id: true },
    });

    await Promise.all(
      contents.map((c) => this.updateShares({ contentId: c.id })),
    );
  }

  @OnEvent(EVENTS.SHARES.UPDATE)
  async handleFeederContentChange(content: content) {
    const posts = await this.db.post.findMany({
      where: { contentId: content.id },
    });
    posts.forEach((post) => {
      this.emitter.emit('post.updated', post);
    });
  }
}
