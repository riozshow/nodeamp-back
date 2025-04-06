import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { ShareRepository } from '../share/share.repository';
import { Prisma, share } from '@prisma/client';

@Injectable()
export class NodeProcesses {
  constructor(
    private db: DbService,
    private shareRepository: ShareRepository,
  ) {}

  static PROCEED_NODE_TYPE = {
    id: true,
    type: true,
    targetNodes: {
      select: {
        targetNodeId: true,
      },
    },
    config: {
      select: {
        data: true,
      },
    },
    outputFeederId: true,
  };

  async proceedShare(share: share) {
    const nodeLocation = await this.db.node_location.findUnique({
      where: {
        id: share.nodeLocationId,
      },
      select: {
        node: { select: NodeProcesses.PROCEED_NODE_TYPE },
      },
    });

    if (this.proceed[nodeLocation?.node.type]) {
      const moveTo = await this.proceed[nodeLocation.node.type](
        share,
        nodeLocation.node,
      );
      if (moveTo) {
        this.shareRepository.update.moveTo(share.id, moveTo);
      }
    }
  }

  private proceed: {
    [type: string]: (
      share: share,
      node: Prisma.nodeGetPayload<{
        select: typeof NodeProcesses.PROCEED_NODE_TYPE;
      }>,
    ) => Promise<string | void>;
  } = {
    shares: async (share, node) => {},
    rater: async (share, node) => {
      const rates = await this.db.content_rate.findMany({
        where: {
          nodeId: node.id,
          shareId: share.id,
        },
        select: {
          rate: true,
        },
      });

      const data = node.config?.data as { ratingRoutes?: string[] };

      if (!!rates.length && data?.ratingRoutes) {
        const { ratingRoutes } = data;
        const rate = rates[0];
        const availableRoutes = ratingRoutes.slice(0, rate.rate - 1);
        if (availableRoutes.length) {
          const targetNodeIds = node.targetNodes.map((t) => t.targetNodeId);
          for (let i = availableRoutes.length - 1; i > 0; i--) {
            if (targetNodeIds.includes(availableRoutes[i])) {
              return availableRoutes[i];
            }
          }
          await this.shareRepository.delete.reject(share.id);
        }
      }
    },
    filter: async (share, node) => {},
  };
}
