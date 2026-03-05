import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Session,
  Body,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { StorageContent } from './storage.contents.service';
import { SessionType } from 'src/auth/auth.types';
import {
  CreateStorageContentDto,
  UpdateStorageContentDto,
} from './storage.contents.dto';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';

@UseGuards(AuthenticatedGuard)
@Controller(':locationId/contents')
export class StorageContentController {
  constructor(private content: StorageContent) {}

  @Get()
  async getContents(
    @Param('locationId') locationId: string,
    @Query('search') search: string,
    @Query('page') page: number,
    @Session() session: SessionType,
  ) {
    const userId = session.passport?.user.id;
    return await this.content.get(locationId, userId, {
      search,
      page,
    });
  }

  @Post()
  async createContent(
    @Param('locationId') locationId: string,
    @Session() session: SessionType,
    @Body() dto: CreateStorageContentDto,
  ) {
    const userId = session.passport?.user.id;
    return await this.content.create(locationId, userId, dto);
  }

  @Patch(':contentId')
  async updateContent(
    @Param('contentId') contentId: string,
    @Session() session: SessionType,
    @Body() dto: UpdateStorageContentDto,
  ) {
    const userId = session.passport?.user.id;
    return await this.content.update(contentId, userId, dto);
  }

  @Delete(':contentId')
  async deleteContent(
    @Param('contentId') contentId: string,
    @Session() session: SessionType,
  ) {
    const userId = session.passport?.user.id;
    return await this.content.delete(contentId, userId);
  }
}
