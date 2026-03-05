import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Session,
  UseGuards,
} from '@nestjs/common';
import { Delete, Patch } from '@nestjs/common';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';
import { StorageLocations } from './storage.locations.service';
import { SessionType } from 'src/auth/auth.types';
import { CreateLocationDTO } from './storage.locations.dto';

@Controller('storage/locations')
export class StorageLocationsController {
  constructor(private locations: StorageLocations) {}

  @UseGuards(AuthenticatedGuard)
  @Get()
  async getLocations(@Session() session: SessionType) {
    const userId = session.passport?.user.id;
    return await this.locations.get(userId);
  }

  @UseGuards(AuthenticatedGuard)
  @Post()
  async createLocation(
    @Session() session: SessionType,
    @Body() body: CreateLocationDTO,
  ) {
    const userId = session.passport?.user.id;
    return await this.locations.create(userId, body);
  }

  @UseGuards(AuthenticatedGuard)
  @Patch()
  async updateLocation(
    @Session() session: SessionType,
    @Query('id') id: string,
    @Body() body: CreateLocationDTO,
  ) {
    const userId = session.passport?.user.id;
    return await this.locations.update(userId, id, body);
  }

  @UseGuards(AuthenticatedGuard)
  @Delete()
  async deleteLocation(
    @Session() session: SessionType,
    @Query('id') id: string,
  ) {
    const userId = session.passport?.user.id;
    return await this.locations.delete(userId, id);
  }
}
