import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { ShareCreatePayloadDTO } from '../share/share.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class NodeCreator {
  constructor(private db: DbService) {}

  private payloads: {
    [type: string]: (data: {
      userId: string;
      nodeId: string;
      feederId: string;
      message?: string;
      contentId?: string;
      path?: string;
    }) => Prisma.shareCreateInput;
  } = {
    contentShare: ({ nodeId, feederId, message, userId, contentId }) => {
      return {
        nodeLocation: {
          connect: {
            nodeId_path: {
              nodeId,
              path: '/',
            },
          },
        },
        post: {
          create: {
            message,
            ...(contentId
              ? {
                  content: {
                    connect: { id: contentId, userId: userId },
                  },
                }
              : {}),
            creatorFeeder: {
              connect: { id: feederId },
            },
            user: { connect: { id: userId } },
          },
        },
        user: { connect: { id: userId } },
      };
    },
    locationShare: ({ nodeId, userId, path }) => {
      return {
        nodeLocation: {
          connect: {
            nodeId_path: {
              nodeId,
              path,
            },
          },
        },
        location: {
          connect: {
            userId_path: {
              userId,
              path,
            },
          },
        },
        user: { connect: { id: userId } },
      };
    },
  };

  async getData(
    feederId: string,
    requestUserId: string,
    data: ShareCreatePayloadDTO,
  ) {
    const node = await this.db.node.findUnique({
      where: { inputFeederId: feederId },
      select: {
        type: true,
        id: true,
      },
    });

    if (node) {
      if (node.type === 'files' && data.path) {
        return this.payloads.locationShare({
          feederId,
          nodeId: node.id,
          userId: requestUserId,
          path: data.path,
        });
      } else {
        return this.payloads.contentShare({
          feederId,
          nodeId: node.id,
          userId: requestUserId,
          contentId: data.contentId,
          message: data.message,
        });
      }
    }

    throw new BadRequestException();
  }
}
