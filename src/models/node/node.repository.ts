import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { NodePermmissions } from './node.permissions';

@Injectable()
export class NodeRepository {
  constructor(
    private db: DbService,
    private permissions: NodePermmissions,
  ) {}

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
          hubId,
        },
        select: {
          id: true,
        },
      });

      await this.permissions.setNodePermissions(node.id, permissions);

      return node;
    },
  };
}
