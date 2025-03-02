import {
  Controller,
  Get,
  Body,
  Session,
  Post,
  Query,
  Delete,
  Patch,
  UseGuards,
  Param,
} from '@nestjs/common';
import { StorageRepository } from './storage.repository';
import { CreateLocationDTO } from './storage.dto';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';
import { SessionType } from 'src/auth/auth.types';
import { randomUUID } from 'crypto';

@Controller('storage')
export class StorageController {
  constructor(private repository: StorageRepository) {}

  @UseGuards(AuthenticatedGuard)
  @Get()
  async getStorage(@Session() session: SessionType) {
    const userId = session.passport?.user.id;
    return await this.repository.get.storage(userId);
  }

  @UseGuards(AuthenticatedGuard)
  @Post('locations/:locationId')
  async uploadFile(
    @Session() session: SessionType,
    @Param('locationId') locationId: string,
  ) {
    const userId = session.passport?.user.id;

    const file = {
      originalname: `${randomUUID().slice(0, 8)}.wav`,
      encoding: '',
      mimetype: '',
      size: Math.random() * 10000000,
      buffer: Buffer.from([Math.random() * 10000000]),
      fieldname: 'das',
      stream: undefined,
      destination: undefined,
      filename: undefined,
      path: undefined,
    };

    return await this.repository.create.file(userId, locationId, file);
  }

  @UseGuards(AuthenticatedGuard)
  @Post('locations')
  async createLocation(
    @Session() session: SessionType,
    @Body() body: CreateLocationDTO,
  ) {
    const userId = session.passport?.user.id;
    return await this.repository.create.location(userId, body);
  }

  @UseGuards(AuthenticatedGuard)
  @Patch('locations')
  async updateLocation(
    @Session() session: SessionType,
    @Query('updatedPath') updatedPath: string,
    @Body() body: CreateLocationDTO,
  ) {
    const userId = session.passport?.user.id;
    return await this.repository.update.location(userId, updatedPath, body);
  }

  @UseGuards(AuthenticatedGuard)
  @Delete('locations')
  async deleteLocation(
    @Session() session: SessionType,
    @Query('path') path: string,
  ) {
    const userId = session.passport?.user.id;
    return await this.repository.delete.location(userId, { path });
  }
}
