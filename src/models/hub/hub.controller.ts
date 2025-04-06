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
  Patch,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';
import { NewPortDTO, RouterUpdate, UpdateGatewayDTO } from './hub.dto';
import { HubGuard } from 'src/auth/hub.guard';
import { HubRouter } from './hub.router';
import { HubRepository } from './hub.repository';
import { SessionType } from 'src/auth/auth.types';
import { HubProcesses } from './hub.processes';
import { FeederDataDTO } from '../feeder/feeder.dto';
import { NODE_MODELS } from '../node/node.models';
import { HubGateway } from './hub.gateway';

@Controller('hubs')
export class HubController {
  constructor(
    private router: HubRouter,
    private gateway: HubGateway,
    private repository: HubRepository,
    private processes: HubProcesses,
  ) {}

  @Get(':hubId')
  async getHubData(
    @Param('hubId') hubId: string,
    @Session() session: SessionType,
  ) {
    const requestUserId = session.passport?.user.id;
    return await this.repository.get.one(hubId, requestUserId);
  }

  @UseGuards(AuthenticatedGuard)
  @Get(':hubId/settings')
  async getHubSettingsData(
    @Param('hubId') hubId: string,
    @Session() session: SessionType,
  ) {
    const requestUserId = session.passport?.user.id;
    return await this.repository.get.settings(hubId, requestUserId);
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Get(':hubId/settings/:entity')
  async getHubSettings(
    @Param('hubId') hubId: string,
    @Session() session: SessionType,
    @Param('entity') entity: string,
  ) {
    const requestUserId = session.passport?.user.id;
    if (requestUserId) {
      if (entity === 'routing') {
        return {
          ...(await this.repository.get.routerSettings(hubId, requestUserId)),
          availableNodes: this.processes.getAvailableNodes(),
        };
      } else if (entity === 'feeders') {
        return await this.repository.get.feedersSettings(hubId, requestUserId);
      }
    } else {
      throw new BadRequestException();
    }
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Post(':hubId/feeders')
  async createFeeder(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Body() body: FeederDataDTO,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.router.createFeeder(hubId, userId, body);
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Post(':hubId/ports')
  async createPort(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Body() body: NewPortDTO,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.gateway.createPort(hubId, userId, body);
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Delete(':hubId/ports/:portId')
  async deletePort(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Param('portId') portId: string,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.gateway.deletePort(portId, hubId, userId);
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Get(':hubId/gateway')
  async getGateway(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.gateway.getData(hubId, userId);
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Patch(':hubId/gateway')
  async updateGateway(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Body() body: UpdateGatewayDTO,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.gateway.update(hubId, userId, body);
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Patch(':hubId/settings/routing')
  async updateRouter(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Body() body: RouterUpdate,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    if (userId) {
      const status = await this.router.update(hubId, userId, body);
      if (status.updated) {
        return {
          ...(await this.repository.get.routerSettings(hubId, userId)),
          availableNodes: this.processes.getAvailableNodes(),
        };
      }
    } else {
      throw new BadRequestException();
    }
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Post(':hubId/nodes')
  async createNode(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Query('type') type: keyof typeof NODE_MODELS,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    return await this.router.createNode(hubId, type);
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Delete(':hubId/nodes/:nodeId')
  async deleteNode(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Param('nodeId') nodeId: string,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    return await this.router.deleteNode(hubId, nodeId);
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

  @UseGuards(new HubGuard({ hubId: 'hubId', feederId: 'feederId' }))
  @UseGuards(AuthenticatedGuard)
  @Patch(':hubId/feeders/:feederId')
  async updateFeeder(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Param('feederId') feederId: string,
    @Body() feeder: FeederDataDTO,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.router.updateFeeder(hubId, feederId, userId, feeder);
  }

  @UseGuards(AuthenticatedGuard)
  @Post(':hubId/subscribe')
  async subscribeHub(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.processes.subscribe(hubId, userId);
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Post(':hubId/ports/:recieverPortId/subscriptions/:senderPortId')
  async subscribePort(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Param('recieverPortId') recieverPortId: string,
    @Param('senderPortId') senderPortId: string,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.gateway.subscribePort(
      hubId,
      userId,
      recieverPortId,
      senderPortId,
    );
  }
}
