import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { share } from '@prisma/client';
import { WebsocketService } from 'src/websocket/websocket.service';
import { NodeProcesses } from 'src/models/node/node.processes';
import { ShareEvents } from 'src/events/share.events';

@Injectable()
export class NodeEvents {
  constructor(
    private ws: WebsocketService,
    private processes: NodeProcesses,
  ) {}

  @OnEvent('rate.created')
  async checkRatedPost(rate: { shareId: string; nodeId: string }) {
    return await this.proceedShare({ id: rate.shareId });
  }

  @OnEvent(ShareEvents.move)
  @OnEvent(ShareEvents.create)
  async proceedShare(share: { id: string }) {
    const status = await this.processes.getShareStatus(share.id);
    await this.processes.executeShareStatus(status);
  }

  @OnEvent(ShareEvents.move)
  async emitNewPost(share: share) {
    this.ws.emit(`node.shares.create.${share.nodeId}`, true);
  }

  @OnEvent(ShareEvents.remove)
  async emitRemovePost(share: share) {
    this.ws.emit(`node.shares.remove.${share.nodeId}`, share.id);
  }
}
