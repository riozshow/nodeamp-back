import { Controller, Delete, Param, UseGuards, Session } from '@nestjs/common';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';
import { PostRepository } from './post.repository';
import { SessionType } from 'src/auth/auth.types';

@Controller('posts')
export class PostController {
  constructor(private repository: PostRepository) {}

  @UseGuards(AuthenticatedGuard)
  @Delete(':postId')
  async deleteOwnPost(
    @Param('postId') postId: string,
    @Session() session: SessionType,
  ) {
    const userId = session.passport.user.id;
    return await this.repository.delete.one(postId, userId);
  }
}
