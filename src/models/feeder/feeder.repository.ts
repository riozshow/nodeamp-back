import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DbService } from 'src/db/db.service';
import { feeder } from '@prisma/client';
import { NewFeeder } from 'src/models/hub/hub.dto';
import { NodeRepository } from '../node/node.repository';
import { NodeProcesses } from '../node/node.processes';
import { FeederPermissions } from './feeder.permissions';
import { EVENTS } from 'src/events/events.names';

@Injectable()
export class FeederRepository {
  constructor(
    private db: DbService,
    private nodeRepository: NodeRepository,
    private nodeProcesses: NodeProcesses,
    private feederPermissions: FeederPermissions,
    private eventEmitter: EventEmitter2,
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
    one: async (id: string, requestUserId: string) => {
      return await this.db.feeder.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          name: true,
          outputNodeId: true,
        },
      });
    },
    details: async (id: string, requestUserId: string) => {
      const permissions = await this.feederPermissions.getFeederPermissions(
        id,
        requestUserId,
      );
      const feeder = await this.db.feeder.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          name: true,
          outputNodeId: true,
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
          connectedHubs: {
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
      return { ...feeder, permissions };
    },
    inputId: async (id: string) =>
      (
        await this.db.feeder.findUnique({
          where: { id },
          select: { inputNodeId: true },
        })
      ).inputNodeId,
  };

  public create = {
    one: async (hubId: string, data: NewFeeder & { userId: string }) => {
      const [inputNode, outputNode] = await Promise.all([
        this.nodeRepository.create.one(
          hubId,
          'input',
          `${data.name} input`,
          data,
        ),
        this.nodeRepository.create.one(
          hubId,
          'output',
          `${data.name} output`,
          data,
        ),
      ]);

      await this.nodeProcesses.connect(inputNode.id, outputNode.id);

      const feeder = await this.db.feeder.create({
        data: {
          name: data.name,
          hub: { connect: { id: hubId, userId: data.userId } },
          user: { connect: { id: data.userId } },
          inputNode: {
            connect: { id: inputNode.id },
          },
          outputNode: {
            connect: { id: outputNode.id },
          },
          stats: {
            create: {
              postsCount: 0,
            },
          },
        },
      });

      this.emit.create(feeder);

      return await this.get.one(feeder.id, data.userId);
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

      await Promise.all([
        this.nodeRepository.delete.one(feeder.inputNodeId),
        this.nodeRepository.delete.one(feeder.outputNodeId),
      ]);

      this.emit.remove(feeder);

      return feeder;
    },
  };
}
