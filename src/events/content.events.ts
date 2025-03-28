import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DbService } from 'src/db/db.service';

@Injectable()
export class ContentEvents {
  constructor(
    private db: DbService,
    private emitter: EventEmitter2,
  ) {}
}
