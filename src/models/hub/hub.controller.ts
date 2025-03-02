import {
  Controller,
  UseGuards,
  Body,
  Session,
  Get,
  NotFoundException,
  Post,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';
import { NewFeeder } from './hub.dto';
import { HubGuard } from 'src/auth/hub.guard';
import { HubRouter } from './hub.router';
import { HubRepository } from './hub.repository';
import { SessionType } from 'src/auth/auth.types';

@Controller('hubs')
export class HubController {
  constructor(
    private router: HubRouter,
    private repository: HubRepository,
  ) {}

  @Get(':hubId')
  async getHubData(
    @Param('hubId') hubId: string,
    @Session() session: SessionType,
  ) {
    const requestUserId = session.passport?.user.id;
    return await this.repository.get.one(hubId, requestUserId);
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Post(':hubId/feeders')
  async createFeeder(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Body() body: NewFeeder,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.router.createFeeder(hubId, userId, body);
  }

  @UseGuards(new HubGuard({ hubId: 'hubId', feederId: 'feederId' }))
  @UseGuards(AuthenticatedGuard)
  @Delete(':hubId/feeders/:feederId')
  async deleteFeeder(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Param('feederId') feederId: string,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.router.deleteFeeder(hubId, userId, feederId);
  }
}
