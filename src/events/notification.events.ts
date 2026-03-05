import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { notification, share, feeder } from '@prisma/client';
import { EVENTS } from './events.names';
import { WebsocketService } from 'src/websocket/websocket.service';
import { DbService } from 'src/db/db.service';

@Injectable()
export class NotificationEvents {
  constructor(
    private ws: WebsocketService,
    private db: DbService,
  ) {}

  sendNotification(notification: notification & { feeder: feeder }) {
    if (['SHARE_CREATED', 'SHARE_MOVED'].includes(notification.type)) {
      this.ws.emitTo(
        [notification.userId, notification.feeder.userId],
        notification.type,
        {
          hubId: notification.feeder.hubId,
          userId: notification.userId,
          feederId: notification.feederId,
        },
      );
    }

    if (['SHARE_REMOVED'].includes(notification.type)) {
      this.ws.emitTo(
        [notification.userId, notification.feeder.userId],
        notification.type,
        {
          hubId: notification.feeder.hubId,
          userId: notification.userId,
          feederId: notification.feederId,
          shareId: notification.shareId,
        },
      );
    }
  }

  @OnEvent(EVENTS.SHARES.CREATE)
  async notifyShareCreated({ id, userId, nodeLocationId }: share) {
    const feeder = await this.db.feeder.findFirst({
      where: {
        outputNode: {
          locations: {
            some: {
              id: nodeLocationId,
            },
          },
        },
      },
    });

    if (feeder) {
      const notification = await this.db.notification.create({
        data: {
          type: 'SHARE_CREATED',
          feederId: feeder.id,
          shareId: id,
          userId,
        },
        include: {
          feeder: true,
        },
      });
      await this.sendNotification(notification);
    }
  }

  @OnEvent(EVENTS.SHARES.MOVE)
  async notifyShareMoved({ id, userId, nodeLocationId }: share) {
    const feeder = await this.db.feeder.findFirst({
      where: {
        outputNode: {
          locations: {
            some: {
              id: nodeLocationId,
            },
          },
        },
      },
    });

    if (feeder) {
      const notification = await this.db.notification.create({
        data: {
          type: 'SHARE_MOVED',
          feederId: feeder.id,
          shareId: id,
          userId,
        },
        include: {
          feeder: true,
        },
      });
      await this.sendNotification(notification);
    }
  }

  @OnEvent(EVENTS.SHARES.REMOVE)
  async notifyShareRemoved({ id, userId, nodeLocationId }: share) {
    const feeder = await this.db.feeder.findFirst({
      where: {
        outputNode: {
          locations: {
            some: {
              id: nodeLocationId,
            },
          },
        },
      },
    });

    if (feeder) {
      const notification = await this.db.notification.create({
        data: {
          type: 'SHARE_REMOVED',
          feederId: feeder.id,
          shareId: id,
          userId,
        },
        include: {
          feeder: true,
        },
      });
      await this.sendNotification(notification);
    }
  }
}
