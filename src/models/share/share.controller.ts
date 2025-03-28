import {
  Controller,
  UseGuards,
  Get,
  Query,
  Session,
  Delete,
  Param,
} from '@nestjs/common';
import { GroupGuard } from 'src/auth/group.guard';
import { FeederActions } from '../node/node.actions';
import { ShareRepository } from './share.repository';
import { SessionType } from 'src/auth/auth.types';

@Controller('share')
export class ShareController {
  constructor(private repository: ShareRepository) {}

  @UseGuards(new GroupGuard({ feederId: 'feederId' }, FeederActions.view))
  @Get()
  async getFeederShares(
    @Query('feederId') feederId: string,
    @Query('lastShareId') lastShareId: string,
    @Session() session: SessionType,
  ) {
    const userId = session.passport?.user.id;
    return this.repository.get.byFeederId(feederId, userId, lastShareId);
  }

  @Delete(':shareId')
  async removeOwnShare(
    @Param('shareId') shareId: string,
    @Session() session: SessionType,
  ) {
    const userId = session.passport?.user.id;
    return this.repository.delete.own(shareId, userId);
  }
}
