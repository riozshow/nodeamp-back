import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Injectable()
export class FeederProcesses {
  constructor(private db: DbService) {}

  async refreshFeederTags(id: string) {
    const tags = await this.db.content_tag.groupBy({
      by: 'name',
      where: {
        content: {
          posts: {
            some: {
              shares: {
                some: {
                  node: {
                    outputFeederId: id,
                  },
                },
              },
            },
          },
        },
      },
      _count: {
        name: true,
      },
      orderBy: {
        _count: {
          name: 'desc',
        },
      },
      take: 10,
    });

    await this.db.$transaction([
      this.db.feeder_tag.deleteMany({ where: { feederId: id } }),
      this.db.feeder_tag.createMany({
        data: tags.map((t) => ({
          feederId: id,
          count: t._count.name,
          name: t.name,
        })),
        skipDuplicates: true,
      }),
    ]);
  }
}
