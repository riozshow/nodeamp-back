import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { FeederRepository } from 'src/models/feeder/feeder.repository';
import { FeederDataDTO } from '../feeder/feeder.dto';
import { RouterUpdate } from './hub.dto';
import {
  node_config,
  node_connections,
  node_position,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { NodeRepository } from '../node/node.repository';
import { AVAILABLE_NODE_MODELS, NODE_MODELS } from '../node/node.models';

@Injectable()
export class HubRouter {
  constructor(
    private db: DbService,
    private feederRepository: FeederRepository,
    private nodeRepository: NodeRepository,
  ) {}

  async createFeeder(hubId: string, userId: string, feeder: FeederDataDTO) {
    return await this.feederRepository.create.one(hubId, {
      userId,
      ...feeder,
    });
  }

  async updateFeeder(
    hubId: string,
    feederId: string,
    userId: string,
    feeder: FeederDataDTO,
  ) {
    let permissions = [];
    const updateData: Prisma.feederUpdateInput = {};

    if (feeder.permissions) {
      permissions = await this.feederRepository.update.permissions(
        feederId,
        userId,
        feeder.permissions,
      );
    }

    if (feeder.name) {
      updateData.name = feeder.name;
    }

    if (feeder.inputNode) {
      updateData.inputNode = {
        connect: {
          hubId,
          id: feeder.inputNode.id,
        },
      };
    }

    if (feeder.outputNode) {
      updateData.outputNode = {
        connect: {
          hubId,
          id: feeder.outputNode.id,
        },
      };
    }

    await this.db.feeder.update({
      where: {
        id: feederId,
        hubId,
        userId,
      },
      data: updateData,
    });

    return this.feederRepository.get.edit(feederId, userId);
  }

  async setDefaultFeeder(hubId: string, userId: string, feederId: string) {
    await this.db.feeder.updateMany({
      where: {
        id: feederId,
        userId,
        hubId,
      },
      data: {
        isDefault: null,
      },
    });
    return await this.db.feeder.update({
      where: {
        id: feederId,
        userId,
        hubId,
      },
      data: {
        isDefault: true,
      },
    });
  }

  async deleteFeeder(hubId: string, userId: string, feederId: string) {
    return await this.feederRepository.delete.one(feederId, userId, hubId);
  }

  async createNode(hubId: string, type: keyof typeof NODE_MODELS) {
    if (AVAILABLE_NODE_MODELS.includes(type)) {
      const node = await this.nodeRepository.create.one(
        hubId,
        type,
        NODE_MODELS[type].properties.name,
      );
      if (node) {
        return this.nodeRepository.get.settings(node.id);
      }
    }
    throw new BadRequestException();
  }

  async deleteNode(hubId: string, nodeId: string) {
    return await this.nodeRepository.delete.fromHub(hubId, nodeId);
  }

  async setNodeConnections(
    nodeId: string,
    connections: node_connections[],
    hubId: string,
  ) {
    await this.db.$transaction(async (tx: PrismaClient) => {
      await tx.node_connections.deleteMany({
        where: {
          sourceNode: {
            id: nodeId,
            hubId,
          },
        },
      });

      for await (const connection of connections) {
        await tx.node_connections.create({
          data: {
            sourceNode: {
              connect: {
                id: nodeId,
                hubId,
              },
            },
            targetNode: {
              connect: {
                id: connection.targetNodeId,
                hubId,
              },
            },
          },
        });
      }
    });
  }

  async nodeExistInRouter(
    nodeId: string,
    hubId: string,
    requestUserId: string,
  ) {
    return await this.db.node.findUnique({
      where: { id: nodeId, hubId, hub: { userId: requestUserId } },
      select: { id: true },
    });
  }

  async feederExistInRouter(
    feederId: string,
    hubId: string,
    requestUserId: string,
  ) {
    return await this.db.feeder.findUnique({
      where: { id: feederId, hubId, hub: { userId: requestUserId } },
      select: { id: true },
    });
  }

  async setNodePosition(nodeId: string, position: node_position) {
    return await this.db.node_position.upsert({
      where: { nodeId },
      update: { x: position.x, y: position.y },
      create: { nodeId, x: position.x, y: position.y },
    });
  }

  async updateNodeFeederInput(
    hubId: string,
    nodeId: string,
    feederId: string | null,
    requestUserId: string,
  ) {
    if (!feederId) {
      await this.db.node.update({
        where: { id: nodeId },
        data: {
          inputFeederId: null,
        },
      });
    } else if (await this.feederExistInRouter(feederId, hubId, requestUserId)) {
      await this.db.feeder.update({
        where: { id: feederId },
        data: {
          inputNode: {
            connect: {
              id: nodeId,
            },
          },
        },
      });
    }
  }

  async updateNodeFeederOutput(
    hubId: string,
    nodeId: string,
    feederId: string | null,
    requestUserId: string,
  ) {
    if (!feederId) {
      await this.db.node.update({
        where: { id: nodeId },
        data: {
          outputFeederId: null,
        },
      });
    } else if (await this.feederExistInRouter(feederId, hubId, requestUserId)) {
      await this.db.feeder.update({
        where: { id: feederId },
        data: {
          outputNode: {
            connect: {
              id: nodeId,
            },
          },
        },
      });
    }
  }

  async updateNodeConfig(nodeId: string, config: node_config) {
    await this.db.node_config.upsert({
      where: {
        nodeId,
      },
      create: {
        data: config.data,
        node: {
          connect: { id: nodeId },
        },
      },
      update: {
        data: config.data,
      },
    });
  }

  async update(hubId: string, requestUserId: string, data: RouterUpdate) {
    const nodesIds = Object.keys(data.nodes);
    for await (const id of nodesIds) {
      if (await this.nodeExistInRouter(id, hubId, requestUserId)) {
        const { config, position, targetNodes, inputFeederId, outputFeederId } =
          data.nodes[id] as {
            config?: node_config;
            position?: node_position;
            targetNodes?: node_connections[];
            inputFeederId?: string | null;
            outputFeederId?: string | null;
          };

        if (config) {
          await this.updateNodeConfig(id, config);
        }

        if (position) {
          await this.setNodePosition(id, position);
        }

        if (targetNodes) {
          await this.setNodeConnections(id, targetNodes, hubId);
        }

        if (typeof inputFeederId !== 'undefined') {
          await this.updateNodeFeederInput(
            hubId,
            id,
            inputFeederId,
            requestUserId,
          );
        }

        if (typeof outputFeederId !== 'undefined') {
          await this.updateNodeFeederOutput(
            hubId,
            id,
            outputFeederId,
            requestUserId,
          );
        }
      }
    }

    return { updated: true };
  }
}
