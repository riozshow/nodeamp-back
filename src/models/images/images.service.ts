import { Injectable } from '@nestjs/common';
import { Region } from 'sharp';
import * as sharp from 'sharp';
import { DbService } from 'src/db/db.service';

@Injectable()
export class ImagesService {
  constructor(private db: DbService) {}

  async getUserImage(userId: string, size: number) {
    return this.db.user_image.findUnique({
      where: { userId_size: { size, userId } },
      select: { data: true },
    });
  }

  async setUserImage(userId: string, file: Express.Multer.File, crop: Region) {
    const cropped = await sharp(file.buffer).extract(crop);

    const sizes = [320, 250, 100, 50, 25, 10];

    for await (const size of sizes) {
      const data = await cropped.resize(size, size).toBuffer();
      await this.db.user_image.upsert({
        where: { userId_size: { userId, size } },
        create: {
          data,
          size,
          userId,
        },
        update: {
          data,
        },
      });
    }
  }
}
