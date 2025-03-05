import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { ContentRepository } from 'src/models/content/content.repository';

@Injectable()
export class PostRepository {
  constructor(private db: DbService) {}

  static POST_SHARE_SELECT = {
    id: true,
    content: {
      select: ContentRepository.CONTENT_SHARE_SELECT,
    },
    message: true,
    creatorFeeder: {
      select: {
        id: true,
        name: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
    user: {
      select: {
        id: true,
        name: true,
      },
    },
  };

  public get = {};

  public create = {};

  public delete = {
    one: async (postId: string, userId: string) => {
      const post = await this.db.post.delete({
        where: { id: postId, userId },
      });

      return post;
    },
  };
}
