import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Session,
  Delete,
} from '@nestjs/common';
import { ShareRepository } from '../share/share.repository';
import { GroupGuard } from 'src/auth/group.guard';
import { NodeActions } from './node.actions';
import { SessionType } from 'src/auth/auth.types';
import { NodeRepository } from './node.repository';

@Controller('nodes')
export class NodeController {
  constructor(
    private shareRepository: ShareRepository,
    private nodeRepository: NodeRepository,
  ) {}

  @UseGuards(new GroupGuard({ nodeId: 'nodeId' }, NodeActions.view))
  @Get(':nodeId/shares')
  async getNodeShares(
    @Param('nodeId') nodeId: string,
    @Query('skip') skip: string,
    @Query('lastShareId') lastShareId: string,
    @Session() session: SessionType,
  ) {
    const userId = session.passport?.user.id;
    const skipNumber = Number(skip) || 0;
    if (userId && skipNumber === 0) {
      this.nodeRepository.get.visit(nodeId, userId);
    }
    if (lastShareId) {
      return this.shareRepository.get.lastByNodeId(nodeId, lastShareId, userId);
    } else {
      return this.shareRepository.get.byNodeId(nodeId, skipNumber, userId);
    }
  }

  @UseGuards(new GroupGuard({ nodeId: 'nodeId' }, NodeActions.remove))
  @Delete(':nodeId/shares/:shareId')
  async removeNodeShare(
    @Param('nodeId') nodeId: string,
    @Param('shareId') shareId: string,
  ) {
    return this.shareRepository.delete.fromNode(shareId, nodeId);
  }
}
