import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { FeederRepository } from 'src/models/feeder/feeder.repository';
import { NewFeeder } from './hub.dto';

@Injectable()
export class HubRouter {
  constructor(
    private db: DbService,
    private feederRepository: FeederRepository,
  ) {}

  async createFeeder(hubId: string, userId: string, feeder: NewFeeder) {
    return await this.feederRepository.create.one(hubId, {
      userId,
      ...feeder,
    });
  }

  async updateFeeder(hubId: string) {}

  async setDefaultFeeder(hubId: string, userId: string, feederId: string) {
    return await this.db.hub.update({
      where: {
        id: hubId,
        userId,
        localFeeders: {
          some: {
            id: feederId,
          },
        },
      },
      data: {
        defaultFeederId: feederId,
      },
    });
  }

  async deleteFeeder(hubId: string, userId: string, feederId: string) {
    return await this.feederRepository.delete.one(feederId, userId, hubId);
  }

  async createNode(hubId: string) {}

  async updateNode(hubId: string) {}

  async deleteNode(hubId: string) {}

  async setNodeConnections(hubId: string) {}
}
