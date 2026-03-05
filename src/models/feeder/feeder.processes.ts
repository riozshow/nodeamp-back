import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Injectable()
export class FeederProcesses {
  constructor(private db: DbService) {}

  async updateTags(feederId: string) {
    const tags = await this.db.tag.groupBy({
      by: 'name',
      where: {
        content_tag: {
          some: {
            content: {
              posts: {
                some: {
                  shares: {
                    some: {
                      nodeLocation: {
                        node: {
                          feederOutput: {
                            id: feederId,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        _count: {
          name: 'desc',
        },
      },
      take: 10,
    });

    await this.db.feeder.update({
      where: { id: feederId },
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
