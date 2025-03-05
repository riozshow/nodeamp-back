import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { NodePermmissions } from './node.permissions';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS } from 'src/events/events.names';

@Injectable()
export class NodeRepository {
  constructor(
    private db: DbService,
    private permissions: NodePermmissions,
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
  };

  public create = {
    one: async (
      hubId: string,
      type: string,
      name: string,
      permissions: {
        create?: string[];
        view?: string[];
        remove?: string[];
        share?: string[];
        rate?: string[];
        comment?: string[];
      },
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

      await this.permissions.setNodePermissions(node.id, permissions);

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
  };
}
