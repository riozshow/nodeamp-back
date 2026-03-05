import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { getDuplicateSufix } from 'src/utils/getDuplicateSufix';

@Injectable()
export class StorageProcesses {
  constructor(private db: DbService) {}

  async findFirstLocationFreePath(path: string, userId: string) {
    const duplicates = await this.db.location.findMany({
      where: {
        path: {
          startsWith: path,
          mode: 'insensitive',
        },
        userId,
      },
      select: {
        path: true,
      },
    });

    if (!!duplicates.length) {
      path += getDuplicateSufix(
        path,
        duplicates.map((d) => ({ name: d.path })),
      );
    }

    return path;
  }

  async verifyFreeSpace(userId: string, size: number) {
    const storage_stats = await this.db.storage_stats.findUnique({
      where: { userId },
    });

    if (storage_stats) {
      const { total, used } = storage_stats;
      return total - used - size > 0;
    }

    return false;
  }
}
