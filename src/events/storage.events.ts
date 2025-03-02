import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { storage } from '@prisma/client';
import { DbService } from 'src/db/db.service';

@Injectable()
export class StorageEvents {
  constructor(private db: DbService) {}

  static update: 'storage.update';

  @OnEvent(StorageEvents.update)
  async updateStats({ userId }: storage) {
    const used = await this.db.file.aggregate({
      where: { userId },
      _sum: { size: true },
    });

    await this.db.storage_stats.update({
      where: { userId },
      data: {
        used: used._sum.size || 0,
      },
    });
  }
}
