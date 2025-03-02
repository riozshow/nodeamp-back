import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';

@Module({
  imports: [DbModule],
  providers: [ImagesService],
  controllers: [ImagesController],
})
export class ImagesModule {}
