import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Injectable()
export class UsersProcesses {
  constructor(private db: DbService) {}

  async connectProfileHub(userId: string, hubId: string) {
    return await this.db.user.update({
      where: {
        id: userId,
      },
      data: {
        profileHub: {
          connect: {
            id: hubId,
            userId,
          },
        },
      },
    });
  }
}
