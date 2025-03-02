import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { PostController } from './post.controller';
import { PostRepository } from './post.repository';

@Module({
  providers: [PostRepository],
  imports: [DbModule],
  controllers: [PostController],
})
export class PostModule {}
