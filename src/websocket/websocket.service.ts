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
  private clients: { [key: string]: Socket | boolean } = {};

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('connect_user')
  connectUser(
    client: Socket,
    { userId, key }: { userId: string; key: string },
  ) {
    if (this.clients[`${userId}@${key}`]) {
      this.clients[`${userId}@${key}`] = client;
      client.on('close', () => {
        delete this.clients[`${userId}@${key}`];
      });
    }
    //console.clear();
    //console.log(`Websocket clients: ${Object.keys(this.clients).length}`);
  }

  emit(message: string, body: any) {
    this.server.emit(message, body);
  }

  emitTo(usersIds: string[], message: string, body: any) {
    const clientKeys = Object.keys(this.clients);
    usersIds.forEach((userId) => {
      const keys = clientKeys.filter((key) => key.startsWith(userId));
      if (!!keys.length) {
        keys.forEach((clientKey) => {
          if (typeof this.clients[clientKey] !== 'boolean') {
            this.clients[clientKey].emit(message, body);
          }
        });
      }
    });
  }

  async generateUserKey(userId: string) {
    let key: string = await randomBytes(24).toString('base64');
    this.clients[`${userId}@${key}`] = true;
    return key;
  }
}
