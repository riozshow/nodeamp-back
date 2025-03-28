import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { CreateLocationDTO } from './storage.dto';
import { PrismaClient, storage } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { STORAGE } from './storage.values';
import { StorageProcesses } from './storage.processes';
import { ContentRepository } from 'src/models/content/content.repository';
import { getLocationRegex } from 'src/utils/getLocationRegEx';
import { AudioProcesses } from 'src/models/audio/audio.processes';
import { StorageCloud } from './storage.cloud';
import { EVENTS } from 'src/events/events.names';

@Injectable()
export class StorageRepository {
  constructor(
    private db: DbService,
    private eventEmitter: EventEmitter2,
    private storageProcesses: StorageProcesses,
    private contentRepository: ContentRepository,
    private audioProcesses: AudioProcesses,
    private storageCloud: StorageCloud,
  ) {}

  private emit = {
    update: (storage: storage) =>
      this.eventEmitter.emit(EVENTS.STORAGE.UPDATE, storage),
  };

  public get = {
    storage: async (userId: string) => {
      return await this.db.storage.findUnique({
        where: { userId },
        select: {
          locations: {
            select: {
              path: true,
            },
          },
          stats: {
            select: {
              used: true,
              capacity: true,
            },
          },
        },
      });
    },
    space: async (userId: string) => {
      return await this.db.storage_stats.findUnique({
        where: { userId },
        select: {
          used: true,
          capacity: true,
        },
      });
    },
    location: async (userId: string, path: string) => {
      if (!getLocationRegex().test(path) && path !== '/')
        throw new BadRequestException();
      const storage = await this.db.storage.findUnique({ where: { userId } });
      const location = await this.db.location.findFirst({
        where: {
          userId: storage.userId,
          path,
        },
      });
      if (!location) throw new BadRequestException();
      return location;
    },
    locationById: (locationId: string, userId: string) =>
      this.db.location.findUnique({
        where: { id: locationId, storage: { userId } },
      }),
    locationContents: async (userId: string, path: string) => {
      if (!getLocationRegex().test(path) && path !== '/')
        throw new BadRequestException();

      const location = await this.db.location.findFirst({
        where: { userId, path },
      });

      if (location) {
        return await this.contentRepository.get.byLocationId(location.id);
      }
    },
  };

  public create = {
    storage: async (userId: string) => {
      return await this.db.storage.create({
        data: {
          userId,
          locations: {
            create: {
              path: '/',
            },
          },
          stats: {
            create: {
              capacity: STORAGE.DEFAULT_CAPACITY,
              used: 0,
            },
          },
        },
      });
    },
    location: async (userId: string, body: CreateLocationDTO) => {
      if (!getLocationRegex().test(body.path) || body.path.endsWith('/'))
        throw new BadRequestException();

      const storage = await this.db.storage.findUnique({ where: { userId } });
      if (!storage) throw new ForbiddenException();

      const path = await this.storageProcesses.findFirstLocationFreePath(
        body.path,
        userId,
      );

      return await this.db.location.create({
        data: {
          path,
          storage: { connect: { userId: storage.userId } },
        },
      });
    },
    file: async (userId: string, path: string, file: Express.Multer.File) => {
      const { originalname, size } = file;

      const hasFreeSpace = await this.storageProcesses.verifyFreeSpace(
        userId,
        size,
      );

      if (hasFreeSpace) {
        const location = await this.get.location(userId, path);
        if (location) {
          const encodedFile = await this.audioProcesses.encodeFile(file);

          const { duration, waveform, channels, loudness, peak } =
            await this.audioProcesses.readAudioData(encodedFile);

          const urlOriginal = await this.storageCloud.upload(file);
          const url = await this.storageCloud.upload(encodedFile);

          const newFile = await this.db.file.create({
            data: {
              size,
              originalName: originalname,
              url,
              urlOriginal,
              duration,
              properties: {
                create: {
                  peak,
                  loudness,
                  channels,
                },
              },
              waveform: {
                create: {
                  data: waveform,
                },
              },
              storage: { connect: { userId } },
            },
          });

          const content = await this.contentRepository.create.audioTrack(
            userId,
            location.path,
            'audio_track',
            newFile,
          );

          this.emit.update({ userId });

          return content;
        }
      }

      throw new BadRequestException();
    },
  };

  public update = {
    location: async (
      userId: string,
      updatedPath: string,
      body: CreateLocationDTO,
    ) => {
      if (updatedPath === body.path || updatedPath === '/')
        return new BadRequestException();
      if (!getLocationRegex().test(body.path)) throw new BadRequestException();

      const storage = await this.db.storage.findUnique({ where: { userId } });
      if (!storage) throw new ForbiddenException();

      const locations = await this.db.location.findMany({
        where: {
          userId: storage.userId,
          OR: [
            {
              path: {
                startsWith: `${updatedPath}/`,
              },
            },
            {
              path: updatedPath,
            },
          ],
        },
      });

      await this.db.$transaction(async (tx: PrismaClient) => {
        for await (const location of locations) {
          const newPath = location.path
            .replace(updatedPath, body.path === '/' ? '' : body.path)
            .replaceAll('//', '/');
          if (getLocationRegex().test(newPath)) {
            await tx.location.update({
              where: { id: location.id },
              data: {
                path: newPath,
              },
            });
          } else {
            throw new BadRequestException();
          }
        }
      });

      return { updated: true };
    },
  };

  public delete = {
    location: async (userId: string, body: CreateLocationDTO) => {
      if (!getLocationRegex().test(body.path) || body.path.endsWith('/'))
        throw new BadRequestException();

      const storage = await this.db.storage.findUnique({ where: { userId } });
      if (!storage) throw new ForbiddenException();

      await this.db.location.deleteMany({
        where: {
          userId: storage.userId,
          OR: [
            {
              path: {
                startsWith: `${body.path}/`,
              },
            },
            {
              path: body.path,
            },
          ],
        },
      });

      this.emit.update({ userId });

      return body;
    },
  };
}
