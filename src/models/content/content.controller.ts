import {
  Controller,
  UseGuards,
  Delete,
  Post,
  Session,
  Query,
  Get,
  Body,
  Param,
  Put,
  Patch,
} from '@nestjs/common';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';
import { ContentPatchDTO, ContentUpdateDTO } from './content.dto';
import { SessionType } from 'src/auth/auth.types';
import { StorageRepository } from 'src/models/storage/storage.repository';
import { ContentRepository } from './content.repository';

@Controller('contents')
export class ContentController {
  constructor(
    private storageRepository: StorageRepository,
    private contentRepository: ContentRepository,
  ) {}

  @UseGuards(AuthenticatedGuard)
  @Get()
  async getContents(
    @Session() session: SessionType,
    @Query('path') path: string,
  ) {
    const userId = session.passport?.user.id;
    return await this.storageRepository.get.locationContents(userId, path);
  }

  @UseGuards(AuthenticatedGuard)
  @Get(':contentId')
  async getContent(
    @Session() session: SessionType,
    @Param('contentId') contentId: string,
  ) {
    const userId = session.passport?.user.id;
    return await this.contentRepository.get.one(contentId, userId);
  }

  @UseGuards(AuthenticatedGuard)
  @Post()
  async createContent(
    @Session() session: SessionType,
    @Query('path') path: string,
    @Query('type') type: string,
  ) {
    const userId = session.passport?.user.id;
    return true;
  }

  @UseGuards(AuthenticatedGuard)
  @Put()
  async updateContent(
    @Session() session: SessionType,
    @Body() body: ContentUpdateDTO,
  ) {
    const userId = session.passport?.user.id;
    return await this.contentRepository.update.one(userId, body);
  }

  @UseGuards(AuthenticatedGuard)
  @Patch(':contentId')
  async patchContent(
    @Session() session: SessionType,
    @Body() body: ContentPatchDTO,
    @Param('contentId') contentId: string,
  ) {
    const userId = session.passport?.user.id;
    return await this.contentRepository.update.one(userId, {
      id: contentId,
      ...body,
    });
  }

  @UseGuards(AuthenticatedGuard)
  @Delete(':contentId')
  async deleteContent(
    @Session() session: SessionType,
    @Param('contentId') contentId: string,
  ) {
    const userId = session.passport?.user.id;
    return await this.contentRepository.delete.one(contentId, userId);
  }
}
