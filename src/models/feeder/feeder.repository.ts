import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DbService } from 'src/db/db.service';
import { feeder } from '@prisma/client';
import { NodeRepository } from '../node/node.repository';
import { EVENTS } from 'src/events/events.names';
import { FeederDataDTO } from './feeder.dto';
import { FeederPermissions, PermissionsConfig } from './feeder.permissions';

@Injectable()
export class FeederRepository {
  constructor(
    private db: DbService,
    private nodeRepository: NodeRepository,
    private eventEmitter: EventEmitter2,
    private feederPermissions: FeederPermissions,
  ) {}

  private emit = {
    create: (feeder: feeder) =>
      this.eventEmitter.emit(EVENTS.FEEDERS.CREATE, feeder),
    update: (feeder: feeder) =>
      this.eventEmitter.emit(EVENTS.FEEDERS.UPDATE, feeder),
    remove: (feeder: feeder) =>
      this.eventEmitter.emit(EVENTS.FEEDERS.REMOVE, feeder),
  };

  public get = {
    one: async (id: string) => {
      return await this.db.feeder.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          name: true,
        },
      });
    },
    edit: async (feederId: string, requestUserId: string) => {
      return this.db.feeder.findUnique({
        where: { id: feederId, userId: requestUserId },
        select: {
          id: true,
          name: true,
          isDefault: true,
          inputNode: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          outputNode: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          permissions: {
            select: {
              type: true,
              public: true,
              groups: {
                select: {
                  groupId: true,
                },
              },
            },
          },
        },
      });
    },
    permissions: async (feederId: string, reqestUserId: string) => {
      return this.db.feeder_permission.findMany({
        where: {
          feeder: {
            id: feederId,
            userId: reqestUserId,
          },
        },
        select: {
          public: true,
          type: true,
          groups: {
            select: {
              groupId: true,
            },
          },
        },
      });
    },
    details: async (id: string, reqestUserId?: string) => {
      return {
        ...(await this.db.feeder.findUnique({
          where: {
            id,
          },
          select: {
            id: true,
            name: true,
            outputNode: {
              select: {
                type: true,
              },
            },
            inputNode: {
              select: {
                _count: true,
              },
            },
            tags: {
              select: {
                name: true,
              },
            },
          },
        })),
        permissions: await this.feederPermissions.getPermissions(
          id,
          reqestUserId,
        ),
      };
    },
  };

  public create = {
    one: async (hubId: string, data: FeederDataDTO & { userId: string }) => {
      const node = await this.nodeRepository.create.one(
        hubId,
        'shares',
        `${data.name} shares`,
      );

      const feeder = await this.db.feeder.create({
        data: {
          name: data.name,
          hub: { connect: { id: hubId, userId: data.userId } },
          user: { connect: { id: data.userId } },
          inputNode: {
            connect: { id: node.id },
          },
          outputNode: {
            connect: { id: node.id },
          },
          stats: {
            create: {
              postsCount: 0,
            },
          },
        },
        select: {
          id: true,
          name: true,
          userId: true,
          hubId: true,
          isDefault: true,
          inputNode: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          outputNode: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      await this.feederPermissions.setPermissions(
        feeder.id,
        data.userId,
        FeederPermissions.DEFAULT_PERMISSIONS.PUBLIC,
      );

      this.emit.create(feeder);

      return feeder;
    },
  };

  public update = {
    one: async (
      feederId: string,
      requestUserId: string,
      feeder: FeederDataDTO,
    ) => {
      let permissions = [];

      if (feeder.permissions) {
        permissions = await this.feederPermissions.setPermissions(
          feederId,
          requestUserId,
          feeder.permissions,
        );
      }

      const updatedFeeder = await this.db.feeder.update({
        where: { id: feederId, userId: requestUserId },
        data: {
          name: feeder.name,
          ...(feeder?.label?.description
            ? {
                label: {
                  upsert: {
                    create: {
                      description: feeder.label.description,
                    },
                    update: {
                      description: feeder.label.description,
                    },
                    where: {
                      feederId,
                    },
                  },
                },
              }
            : {}),
        },
      });

      this.emit.update(updatedFeeder);

      return {
        ...updatedFeeder,
        ...(feeder.permissions ? { permissions } : {}),
      };
    },

    permissions: async (
      feederId: string,
      requestUserId: string,
      permissions: PermissionsConfig,
    ) => {
      return await this.feederPermissions.setPermissions(
        feederId,
        requestUserId,
        permissions,
      );
    },

    setAsDefault: async (feederId: string, requestUserId: string) => {
      await this.db.$transaction(async (tx) => {
        await tx.feeder.updateMany({
          where: {
            hub: { feeders: { some: { id: feederId, userId: requestUserId } } },
          },
          data: {
            isDefault: false,
          },
        });
        await this.db.feeder.update({
          where: {
            id: feederId,
            hub: { feeders: { some: { id: feederId, userId: requestUserId } } },
          },
          data: {
            isDefault: true,
          },
        });
      });
      return { updated: true };
    },
  };

  public delete = {
    one: async (id: string, userId: string, hubId: string) => {
      const feeder = await this.db.feeder.delete({
        where: {
          id,
          hubId,
          userId,
        },
      });

      this.emit.remove(feeder);

      return feeder;
    },
  };
}
