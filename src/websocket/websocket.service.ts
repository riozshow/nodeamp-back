import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server } from 'http';
import { Socket } from 'net';
import { randomBytes } from 'crypto';

@WebSocketGateway(3002, {
  cors: 'http://localhost:5173',
})
export class WebsocketService {
  private clients: { [key: string]: { [key: string]: Socket | boolean } } = {};

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('connect_user')
  connectUser(
    client: Socket,
    { userId, key }: { userId: string; key: string },
  ) {
    if (typeof this.clients[userId][key] === 'boolean') {
      this.clients[userId][key] = client;
      client.on('close', () => {
        delete this.clients[userId][key];
        if (!Object.keys(this.clients[userId]).length) {
          delete this.clients[userId];
        }
      });
    }
  }

  emit(message: string, body: any) {
    this.server.emit(message, body);
  }

  emitTo(usersIds: string[], message: string, body: any) {
    usersIds.forEach((userId) => {
      if (this.clients[userId]) {
        for (const key in this.clients[userId]) {
          if (typeof this.clients[userId][key] !== 'boolean') {
            this.clients[userId][key].emit(message, body);
          }
        }
      }
    });
  }

  async generateUserKey(userId: string) {
    const key: string = await randomBytes(12).toString('base64');
    if (this.clients[userId]) {
      this.clients[userId] = { ...this.clients[userId], [key]: true };
    } else {
      this.clients[userId] = { [key]: true };
    }
    return key;
  }
}
