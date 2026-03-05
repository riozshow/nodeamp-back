import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Injectable()
export class StorageDetails {
  constructor(private db: DbService) {}

  public getDetails = async (userId: string) => {
    return await this.db.storage.findUnique({
      where: { userId },
      select: {
        stats: {
          select: {
            used: true,
            total: true,
          },
        },
      },
    });
  };
}
