import {
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Session,
  Query,
  StreamableFile,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';
import { SessionType } from 'src/auth/auth.types';

@Controller('images')
export class ImagesController {
  constructor(private service: ImagesService) {}

  @Get('users/:userId/:size')
  async getUserImage(
    @Param('userId') userId: string,
    @Param('size') size: string,
  ) {
    const image = await this.service.getUserImage(userId, Number(size));
    if (!image) throw new NotFoundException();
    return new StreamableFile(image.data);
  }

  @UseGuards(AuthenticatedGuard)
  @Post('users')
  @UseInterceptors(FileInterceptor('image'))
  async setUserImage(
    @UploadedFile() file: Express.Multer.File,
    @Session() session: SessionType,
    @Query('width') width: string,
    @Query('height') height: string,
    @Query('y') top: string,
    @Query('x') left: string,
  ) {
    const userId = session.passport?.user.id;

    const crop = {
      width: Number(width),
      height: Number(height),
      top: Number(top),
      left: Number(left),
    };

    return await this.service.setUserImage(userId, file, crop);
  }
}
