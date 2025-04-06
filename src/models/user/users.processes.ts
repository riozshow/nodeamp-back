import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Injectable()
export class UsersProcesses {
  constructor(private db: DbService) {}

  async connectProfileHub(userId: string, hubId: string) {
    if (!userId) throw new BadRequestException();

    await this.db.hub.updateMany({
      where: { userId },
      data: { isDefault: null },
    });
    return await this.db.hub.update({
      where: {
        id: hubId,
        userId,
      },
      data: {
        isDefault: true,
      },
    });
  }
}
