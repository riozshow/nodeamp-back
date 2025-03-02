import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { DbService } from 'src/db/db.service';
import { feeder, content } from '@prisma/client';
import { ShareEvents } from 'src/events/share.events';

@Injectable()
export class ContentEvents {
  constructor(
    private db: DbService,
    private emitter: EventEmitter2,
  ) {}

  @OnEvent(ShareEvents.remove)
  @OnEvent(ShareEvents.like)
  @OnEvent(ShareEvents.unlike)
  async updateLikes({ id }: { id?: string }) {
    if (!id) return;

    const content = await this.db.content.findFirst({
      where: {
        posts: {
          some: {
            shares: {
              some: {
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

    const likes = await this.db.share_like.groupBy({
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

  @OnEvent(ShareEvents.accept)
  @OnEvent(ShareEvents.remove)
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

  @OnEvent(ShareEvents.uncomment)
  @OnEvent(ShareEvents.comment)
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

      const comments = await this.db.share_comment.findMany({
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

  @OnEvent(ShareEvents.remove)
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

  @OnEvent(ShareEvents.update)
  async handleFeederContentChange(content: content) {
    const posts = await this.db.post.findMany({
      where: { contentId: content.id },
    });
    posts.forEach((post) => {
      this.emitter.emit('post.updated', post);
    });
  }
}
