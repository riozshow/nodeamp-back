import { Injectable } from '@nestjs/common';

@Injectable()
export class StorageCloud {
  async upload(file: Express.Multer.File) {
    return `https://${file.originalname}_${Math.random()}/`;
  }
}
