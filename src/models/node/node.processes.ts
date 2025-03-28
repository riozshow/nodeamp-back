import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ShareStatusData } from '../share/share.types';
import { ShareStatus } from './node.types';
import { ShareRepository } from '../share/share.repository';

@Injectable()
export class NodeProcesses {
  constructor(
    private db: DbService,
    private shareRepository: ShareRepository,
  ) {}

  static SHARE_STATUS_SELECT = {
    post: {
      select: {
        content: {
          select: {
            type: true,
            tags: {
              select: {
                name: true,
              },
            },
            interactions: true,
          },
        },
      },
    },
    node: {
      select: {
        type: true,
        targetNodes: {
          select: {
            requirements: true,
            targetNodeId: true,
          },
        },
      },
    },
  };

  async connect(
    sorceNodeId: string,
    targetNodeId: string,
    requirements?: { [key: string]: string | string[] },
  ) {
    if (sorceNodeId !== targetNodeId) {
      return await this.db.node_connections.create({
        data: {
          sourceNode: { connect: { id: sorceNodeId, type: { not: 'output' } } },
          targetNode: { connect: { id: targetNodeId, type: { not: 'input' } } },
          ...(requirements ? { requirements } : {}),
        },
      });
    }
    throw new BadRequestException();
  }

  async getShareStatus(shareId: string) {
    let status = { shareId };
    const share = await this.db.share.findUnique({
      where: {
        id: shareId,
      },
      select: NodeProcesses.SHARE_STATUS_SELECT,
    });

    switch (share.node.type) {
    }

    return status;
  }

  private shareStatus = {
    ofInputNode: (share: ShareStatusData) => {
      const [{ targetNodeId }] = share.node.targetNodes;
      return { moveTo: targetNodeId };
    },
    ofOutputNode: (share: ShareStatusData) => {
      return {};
    },
    ofRaterNode: (share: ShareStatusData) => {
      return {};
    },
  };

  async executeShareStatus(status: ShareStatus) {
    const { shareId, isRejected, moveTo } = status;

    if (moveTo) {
      return await this.shareRepository.update.moveTo(shareId, moveTo);
    }

    if (isRejected) {
      return await this.shareRepository.delete.one(shareId);
    }
  }
}
