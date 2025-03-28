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
  Patch,
  UnauthorizedException,
} from '@nestjs/common';
import { GroupGuard } from 'src/auth/group.guard';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';
import { FeederActions } from '../node/node.actions';
import { FeederRepository } from './feeder.repository';
import { ShareRepository } from '../share/share.repository';
import {
  ShareCreatePayloadDTO,
  ShareSharePayloadDTO,
} from '../share/share.dto';
import { SessionType } from 'src/auth/auth.types';
import { FeederDataDTO } from './feeder.dto';

@Controller('feeders')
export class FeederController {
  constructor(
    private shareRepository: ShareRepository,
    private repository: FeederRepository,
  ) {}

  @UseGuards(new GroupGuard({ feederId: 'feederId' }, FeederActions.view))
  @Get(':feederId/details')
  async getDetails(@Param('feederId') feederId: string) {
    return await this.repository.get.details(feederId);
  }

  @UseGuards(AuthenticatedGuard)
  @Get(':feederId/permissions')
  async getPermissions(
    @Param('feederId') feederId: string,
    @Session() session: SessionType,
  ) {
    const requestUserId = session.passport?.user.id;
    if (requestUserId) {
      return await this.repository.get.permissions(feederId, requestUserId);
    }
    throw new UnauthorizedException();
  }

  @UseGuards(AuthenticatedGuard)
  @Patch(':feederId/permissions')
  async updatePermissions(
    @Param('feederId') feederId: string,
    @Session() session: SessionType,
    @Body() feeder: FeederDataDTO,
  ) {
    const requestUserId = session.passport?.user.id;
    if (requestUserId) {
      return await this.repository.update.permissions(
        feederId,
        requestUserId,
        feeder.permissions,
      );
    }
    throw new UnauthorizedException();
  }

  @UseGuards(AuthenticatedGuard)
  @Get(':feederId/edit')
  async getFeederEditData(
    @Param('feederId') feederId: string,
    @Session() session: SessionType,
  ) {
    const requestUserId = session.passport?.user.id;
    return await this.repository.get.edit(feederId, requestUserId);
  }

  @UseGuards(AuthenticatedGuard)
  @Patch(':feederId')
  async updateFeeder(
    @Param('feederId') feederId: string,
    @Session() session: SessionType,
    @Body() feeder: FeederDataDTO,
  ) {
    const requestUserId = session.passport?.user.id;
    return await this.repository.update.one(feederId, requestUserId, feeder);
  }

  @UseGuards(new GroupGuard({ feederId: 'feederId' }, FeederActions.create))
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

  @UseGuards(new GroupGuard({ feederId: 'feederId' }, FeederActions.create))
  @UseGuards(
    new GroupGuard({ feederId: 'sourceFeederId' }, FeederActions.share),
  )
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

  @UseGuards(new GroupGuard({ feederId: 'feederId' }, FeederActions.remove))
  @UseGuards(AuthenticatedGuard)
  @Delete(':feederId/shares/:shareId')
  async deleteShare(
    @Param('shareId') shareId: string,
    @Param('feederId') feederId: string,
  ) {
    return await this.shareRepository.delete.fromFeeder(shareId, feederId);
  }
}
