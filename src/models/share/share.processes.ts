import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Injectable()
export class ShareProcesses {
  constructor(private db: DbService) {}
}
