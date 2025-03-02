import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Session,
} from '@nestjs/common';
import { ShareRepository } from '../share/share.repository';
import { GroupGuard } from 'src/auth/group.guard';
import { NodeActions } from './node.actions';
import { SessionType } from 'src/auth/auth.types';

@Controller('nodes')
export class NodeController {
  constructor(private shareRepository: ShareRepository) {}

  @UseGuards(new GroupGuard({ nodeId: 'nodeId' }, NodeActions.view))
  @Get(':nodeId/shares')
  async getNodeShares(
    @Param('nodeId') nodeId: string,
    @Query('skip') skip: string,
    @Session() session: SessionType,
  ) {
    const userId = session.passport?.user.id;
    return this.shareRepository.get.byNodeId(nodeId, Number(skip) || 0, userId);
  }
}
