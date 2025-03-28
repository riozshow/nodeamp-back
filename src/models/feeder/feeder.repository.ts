import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DbService } from 'src/db/db.service';
import { feeder } from '@prisma/client';
import { NodeRepository } from '../node/node.repository';
import { EVENTS } from 'src/events/events.names';
import { FeederDataDTO } from './feeder.dto';
import { FeederPermissions } from './feeder.permissions';
import { CompiledPermissions, Permissions } from 'src/auth/group.guard';
import { NODE_MODELS } from '../node/node.models';

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
          label: {
            select: {
              description: true,
            },
          },
          permissions: {
            select: {
              data: true,
            },
          },
        },
      });
    },
    details: async (id: string) => {
      return await this.db.feeder.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          name: true,
          label: {
            select: {
              description: true,
            },
          },
          stats: {
            select: {
              postsCount: true,
            },
          },
          tags: {
            select: {
              count: true,
              name: true,
            },
          },
          connectedPorts: {
            select: {
              hub: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    },
    permissions: async (feederId: string, requestUserId: string) => {
      const permissions = (await this.db.feeder_permissions.findUnique({
        where: {
          feederId,
          feeder: {
            userId: requestUserId,
          },
        },
        select: {
          data: true,
        },
      })) as { data: Permissions };
      return this.feederPermissions.compilePermissions(permissions.data);
    },
  };

  public create = {
    one: async (hubId: string, data: FeederDataDTO & { userId: string }) => {
      const node = await this.nodeRepository.create.one(
        hubId,
        'shares',
        `${data.name} shares`,
      );

      const permissions = await this.feederPermissions.createPermissions(
        hubId,
        data?.permissions?.data ||
          this.feederPermissions.DEFAULT_PERMISSIONS.PUBLIC,
      );

      const feeder = await this.db.feeder.create({
        data: {
          name: data.name,
          hub: { connect: { id: hubId, userId: data.userId } },
          user: { connect: { id: data.userId } },
          permissions: {
            create: {
              data: permissions,
            },
          },
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
          label: {
            select: {
              description: true,
            },
          },
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
      return updatedFeeder;
    },

    permissions: async (
      feederId: string,
      requestUserId: string,
      permissions: { data: CompiledPermissions },
    ) => {
      return await this.feederPermissions.updatePermissions(
        feederId,
        requestUserId,
        permissions.data,
      );
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
