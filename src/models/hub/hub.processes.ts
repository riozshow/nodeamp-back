import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { NODE_MODELS } from '../node/node.models';

@Injectable()
export class HubProcesses {
  constructor(private db: DbService) {}

  async subscribe(hubId: string, userId: string) {}

  getAvailableNodes() {
    return Object.entries(NODE_MODELS).map(([type, model]) => ({
      type,
      ...model.properties,
    }));
  }

  async updateTags(hubId: string) {
    const tags = await this.db.feeder_tag.groupBy({
      by: 'name',
      where: {
        feeder: {
          hubId,
        },
      },
      orderBy: {
        _count: {
          name: 'desc',
        },
      },
      take: 10,
    });

    if (!!tags.length) {
      await this.db.hub.update({
        where: { id: hubId },
        data: {
          tags: {
            deleteMany: {},
            createMany: {
              data: tags.map((t) => ({
                name: t.name,
              })),
            },
          },
        },
      });
    }
  }
}
