import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { PostRepository } from '../post/post.repository';

@Injectable()
export class NodeDisplay {
  constructor(private db: DbService) {}

  private shareSelects: {
    [type: string]: (data: {
      requestUserId?: string;
      nodeId?: string;
    }) => Prisma.shareSelect;
  } = {
    shares: (data) => ({
      id: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      post: { select: PostRepository.POST_SHARE_SELECT },
      sharedAt: true,
      ...(data.requestUserId
        ? {
            comments: {
              where: { userId: data.requestUserId },
            },
            likes: {
              where: { userId: data.requestUserId },
            },
          }
        : {}),
    }),
    rater: (data) => ({
      id: true,
      rates: {
        where: {
          nodeId: data.nodeId,
          userId: data.requestUserId,
        },
        select: {
          rate: true,
        },
      },
      post: {
        select: {
          content: {
            select: {
              type: true,
              file: {
                select: {
                  id: true,
                  duration: true,
                },
              },
            },
          },
        },
      },
      sharedAt: true,
    }),
  };

  private shareTakes: { [key: string]: number } = {
    shares: 3,
    rater: 5,
  };

  public async getSelect({
    node,
    requestUserId,
    loadLast,
  }: {
    requestUserId?: string;
    node: { type: string; id: string };
    loadLast: boolean;
  }): Promise<{
    select: Prisma.shareSelect;
    take: number;
    orderBy?: { sharedAt: 'asc' | 'desc' };
  }> {
    if (node) {
      if (this.shareSelects[node?.type]) {
        return {
          select: this.shareSelects[node.type]({
            nodeId: node.id,
            requestUserId,
          }),
          take: loadLast ? 1 : this.shareTakes[node.type] || 0,
          orderBy: { sharedAt: 'desc' },
        };
      }
    }

    throw new BadRequestException();
  }

  public async getNodeType(feederId: string) {
    return await this.db.node.findUnique({
      where: { outputFeederId: feederId },
      select: { type: true, id: true },
    });
  }

  public async getNodeTree(nodeId: string) {
    return await this.db.node_location.findMany({
      where: {
        nodeId,
      },
      select: {
        path: true,
      },
    });
  }
}
