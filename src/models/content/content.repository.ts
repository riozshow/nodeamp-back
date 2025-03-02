import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ContentProcesses } from './content.processes';
import { file } from '@prisma/client';
import { ContentUpdater } from './content.updater';
import { ContentUpdateDTO } from './content.dto';

@Injectable()
export class ContentRepository {
  constructor(
    private db: DbService,
    private eventEmitter: EventEmitter2,
    private contentProcesses: ContentProcesses,
    private contentUpdater: ContentUpdater,
  ) {}

  static CONTENT_SHARE_SELECT = {
    id: true,
    type: true,
    name: true,
    user: {
      select: {
        id: true,
        name: true,
      },
    },
    interactions: {
      select: {
        plays: true,
        likes: true,
        comments: true,
        rates: true,
        shares: true,
      },
    },
    audioFile: {
      select: {
        id: true,
        duration: true,
      },
    },
  };

  static CONTENT_STORAGE_SELECT = {
    id: true,
    name: true,
    type: true,
    label: {
      select: {
        description: true,
      },
    },
    properties: {
      select: {
        properties: true,
      },
    },
    tags: {
      select: {
        name: true,
      },
    },
    interactions: {
      select: {
        comments: true,
        likes: true,
        plays: true,
        rates: true,
        shares: true,
      },
    },
    commentsLine: {
      select: {
        data: true,
      },
    },
    audioFile: {
      select: {
        id: true,
        originalName: true,
        size: true,
        duration: true,
        properties: {
          select: {
            channels: true,
            loudness: true,
            peak: true,
          },
        },
      },
    },
  };

  public create = {
    audioTrack: async (
      userId: string,
      path: string,
      reqType: string,
      audioFile: file,
    ) => {
      const { type, location, name } =
        await this.contentProcesses.validateNewContent(
          userId,
          path,
          reqType,
          audioFile?.originalName,
        );

      const content = await this.db.content.create({
        data: {
          type,
          name,
          user: { connect: { id: userId } },
          location: {
            connect: { id: location.id },
          },
          interactions: {
            create: {},
          },
          ...(audioFile
            ? { audioFile: { connect: { id: audioFile.id } } }
            : {}),
        },
      });

      this.eventEmitter.emit('content.created', content);

      return content;
    },
  };

  public get = {
    one: async (contentId: string, userId: string) => {
      return await this.db.content.findUnique({
        where: {
          id: contentId,
          userId,
        },
        select: ContentRepository.CONTENT_STORAGE_SELECT,
      });
    },
    byLocationId: async (locationId: string) => {
      return await this.db.content.findMany({
        where: {
          locationId,
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
      });
    },
  };

  public update = {
    one: (userId: string, body: ContentUpdateDTO) =>
      this.contentUpdater.update(userId, body),
  };

  public delete = {
    one: async (contentId: string, userId: string) => {
      const content = await this.db.content.delete({
        where: { id: contentId, userId },
      });

      return content;
    },
  };
}
