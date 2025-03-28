import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from 'src/events/events.names';
import { NODE_MODELS } from './node.models';

@Injectable()
export class NodeRepository {
  constructor(
    private db: DbService,
    private eventEmitter: EventEmitter2,
  ) {}

  private emit = {
    visit: (visit: { userId: string; nodeId: string }) =>
      this.eventEmitter.emit(EVENTS.NODES.VISIT, visit),
  };

  public get = {
    visit: async (nodeId: string, userId: string) => {
      this.emit.visit({ userId, nodeId });
    },
    settings: async (nodeId: string) => {
      return this.db.node.findUnique({
        where: { id: nodeId },
        select: {
          id: true,
          type: true,
          name: true,
          targetNodes: {
            select: {
              targetNodeId: true,
            },
          },
          position: {
            select: {
              x: true,
              y: true,
            },
          },
          config: {
            select: {
              data: true,
            },
          },
        },
      });
    },
  };

  public create = {
    one: async (
      hubId: string,
      type: keyof typeof NODE_MODELS,
      name: string,
    ) => {
      const node = await this.db.node.create({
        data: {
          name,
          type,
          hub: { connect: { id: hubId } },
        },
        select: {
          id: true,
        },
      });

      return node;
    },
  };

  public delete = {
    one: async (nodeId: string) => {
      const node = await this.db.node.delete({
        where: { id: nodeId },
      });

      return node;
    },

    fromHub: async (hubId: string, nodeId: string) => {
      const node = await this.db.node.delete({
        where: { id: nodeId, hubId },
      });

      return node;
    },
  };
}
