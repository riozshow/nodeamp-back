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
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';
import {
  NewGroupDTO,
  NewHubDTO,
  NewPortDTO,
  RouterUpdate,
  UpdateGatewayDTO,
  UpdateGroupDTO,
} from './hub.dto';
import { HubGuard } from 'src/auth/hub.guard';
import { HubRouter } from './hub.router';
import { HubRepository } from './hub.repository';
import { SessionType } from 'src/auth/auth.types';
import { HubProcesses } from './hub.processes';
import { FeederDataDTO } from '../feeder/feeder.dto';
import { NODE_MODELS } from '../node/node.models';
import { HubGateway } from './hub.gateway';
import { HubGroups } from './hub.groups';

@Controller('hubs')
export class HubController {
  constructor(
    private router: HubRouter,
    private gateway: HubGateway,
    private repository: HubRepository,
    private processes: HubProcesses,
    private groups: HubGroups,
  ) {}

  @Get()
  async getHubs(@Session() session: SessionType) {
    const requestUserId = session.passport?.user.id;
    return await this.repository.get.many(requestUserId);
  }

  @UseGuards(AuthenticatedGuard)
  @Post()
  async createHub(@Session() session: SessionType, @Body() body: NewHubDTO) {
    const requestUserId = session.passport?.user.id;
    const hub = await this.repository.create.one(requestUserId, body.name);
    if (hub) {
      return await this.repository.get.oneFromList(hub.id, requestUserId);
    }
  }

  @Get(':hubId')
  async getHubData(
    @Param('hubId') hubId: string,
    @Session() session: SessionType,
  ) {
    const requestUserId = session.passport?.user.id;
    return await this.repository.get.one(hubId, requestUserId);
  }

  @Get(':hubId/user')
  async getHubOwner(
    @Param('hubId') hubId: string,
    @Session() session: SessionType,
  ) {
    const requestUserId = session.passport?.user.id;
    return await this.repository.get.owner(hubId, requestUserId);
  }

  @Get(':hubId/default-feeder')
  async getDefaultFeeder(@Param('hubId') hubId: string) {
    return await this.repository.get.defaultFeeder(hubId);
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
  @Get(':hubId/groups')
  async getGroups(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.groups.getData(hubId, userId);
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Get(':hubId/groups/:groupId/permissions')
  async getGroupPermissions(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Param('groupId') groupId: string,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.groups.getGroupPermissions(hubId, userId, groupId);
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Post(':hubId/groups')
  async createGroup(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Body() data: NewGroupDTO,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.groups.createGroup(hubId, userId, data);
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Patch(':hubId/groups/:groupId')
  async updateGroup(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Param('groupId') groupId: string,
    @Body() body: UpdateGroupDTO,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.groups.update(groupId, hubId, userId, body);
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Delete(':hubId/groups/:groupId')
  async deleteGroup(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Param('groupId') groupId: string,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.groups.deleteGroup(groupId, hubId, userId);
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
  @Post(':hubId/ports/:userPortId/inputs/:hubPortId')
  async connectOutputPort(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Param('userPortId') userPortId: string,
    @Param('hubPortId') hubPortId: string,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.gateway.connectOutputPort(
      hubId,
      userId,
      userPortId,
      hubPortId,
    );
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Post(':hubId/ports/:userPortId/outputs/:hubPortId')
  async connectInputPort(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Param('userPortId') userPortId: string,
    @Param('hubPortId') hubPortId: string,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.gateway.connectInputPort(
      hubId,
      userId,
      userPortId,
      hubPortId,
    );
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Delete(':hubId/ports/:userPortId/inputs/:hubPortId')
  async disconnectOutputPort(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Param('userPortId') userPortId: string,
    @Param('hubPortId') hubPortId: string,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.gateway.disconnectOutputPort(
      hubId,
      userId,
      userPortId,
      hubPortId,
    );
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Delete(':hubId/ports/:userPortId/outputs/:hubPortId')
  async disconnectInputPort(
    @Session() session: SessionType,
    @Param('hubId') hubId: string,
    @Param('userPortId') userPortId: string,
    @Param('hubPortId') hubPortId: string,
  ) {
    if (!session.passport?.user.id) throw new NotFoundException();
    const userId = session.passport.user.id;
    return await this.gateway.disconnectInputPort(
      hubId,
      userId,
      userPortId,
      hubPortId,
    );
  }

  @UseGuards(new HubGuard({ hubId: 'hubId' }))
  @UseGuards(AuthenticatedGuard)
  @Patch(':hubId/feeders/:feederId/default')
  async setAsDefault(
    @Param('feederId') feederId: string,
    @Param('hubId') hubId: string,
    @Session() session: SessionType,
  ) {
    const requestUserId = session.passport?.user.id;
    if (requestUserId) {
      return await this.router.setDefaultFeeder(hubId, requestUserId, feederId);
    }
    throw new UnauthorizedException();
  }
}
