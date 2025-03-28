import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { NODE_MODELS } from '../node/node.models';

@Injectable()
export class HubProcesses {
  constructor(private db: DbService) {}

  async subscribe(hubId: string, userId: string) {}

  getAvailableNodes() {
    return Object.entries(NODE_MODELS).map(([type, model]) => ({
      type,
      ...model.properties,
    }));
  }
}
