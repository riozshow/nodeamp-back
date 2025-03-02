import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Post,
  Body,
  Session,
  Query,
} from '@nestjs/common';
import { GroupGuard } from 'src/auth/group.guard';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';
import { NodeActions } from '../node/node.actions';
import { FeederRepository } from './feeder.repository';
import { ShareRepository } from '../share/share.repository';
import {
  ShareCreatePayloadDTO,
  ShareSharePayloadDTO,
} from '../share/share.dto';
import { SessionType } from 'src/auth/auth.types';

@Controller('feeders')
export class FeederController {
  constructor(
    private shareRepository: ShareRepository,
    private repository: FeederRepository,
  ) {}

  @UseGuards(new GroupGuard({ feederId: 'feederId' }, NodeActions.view))
  @Get(':feederId/details')
  async getDetails(
    @Param('feederId') feederId: string,
    @Session() session: SessionType,
  ) {
    const userId = session.passport.user.id;
    return await this.repository.get.details(feederId, userId);
  }

  @UseGuards(new GroupGuard({ feederId: 'feederId' }, NodeActions.create))
  @UseGuards(AuthenticatedGuard)
  @Post(':feederId/shares/create')
  async createShare(
    @Param('feederId') feederId: string,
    @Body() post: ShareCreatePayloadDTO,
    @Session() session: SessionType,
  ) {
    const userId = session.passport.user.id;
    return await this.shareRepository.create.inFeeder(feederId, {
      userId,
      ...post,
    });
  }

  @UseGuards(new GroupGuard({ feederId: 'feederId' }, NodeActions.create))
  @UseGuards(new GroupGuard({ feederId: 'sourceFeederId' }, NodeActions.share))
  @UseGuards(AuthenticatedGuard)
  @Post(':feederId/shares/share')
  async shareShare(
    @Param('feederId') feederId: string,
    @Query('sourceFeederId') sourceFeederId: string,
    @Body() post: ShareSharePayloadDTO,
    @Session() session: SessionType,
  ) {
    const userId = session.passport.user.id;
    return await this.shareRepository.share.inFeeder(feederId, sourceFeederId, {
      userId,
      ...post,
    });
  }

  @UseGuards(new GroupGuard({ feederId: 'feederId' }, NodeActions.remove))
  @UseGuards(AuthenticatedGuard)
  @Delete(':feederId/shares/:shareId')
  async deleteShare(
    @Param('shareId') shareId: string,
    @Param('feederId') feederId: string,
  ) {
    return await this.shareRepository.delete.fromFeeder(shareId, feederId);
  }
}
