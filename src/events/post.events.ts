import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from './events.names';
import { DbService } from 'src/db/db.service';

export class PostEvents {
  constructor(
    private db: DbService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(EVENTS.SHARES.REMOVE)
  async removeUnusedPosts({ postId }: { postId: string }) {
    const posts = await this.db.post.deleteMany({
      where: {
        shares: { none: {} },
      },
    });

    if (!!posts.count) {
      this.eventEmitter.emit(EVENTS.POSTS.REMOVE, { id: postId });
    }
  }
}
