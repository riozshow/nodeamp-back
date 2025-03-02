import {
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'http';

@WebSocketGateway(3002, {
  cors: 'http://localhost:5173',
})
export class WebsocketService implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {}

  emit(message: string, body: any) {
    this.server.emit(message, body);
  }
}
