import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { storage } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { EVENTS } from './events.names';
import { WebsocketService } from 'src/websocket/websocket.service';

@Injectable()
export class StorageEvents {
  constructor(
    private db: DbService,
    private ws: WebsocketService,
  ) {}

  @OnEvent(EVENTS.STORAGE.UPDATE)
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

    this.ws.emitTo([userId], 'storage.space.update', true);
  }
}
