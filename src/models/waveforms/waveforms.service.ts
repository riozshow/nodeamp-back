import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Injectable()
export class WaveformsService {
  constructor(private db: DbService) {}

  async getByFileId(fileId: string) {
    return await this.db.waveform.findUnique({ where: { fileId } });
  }
}
