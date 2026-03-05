import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { NewPortDTO, UpdateGatewayDTO } from './hub.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class HubGateway {
  constructor(private db: DbService) {}

  async portExistInRouter(
    portId: string,
    hubId: string,
    requestUserId: string,
  ) {
    return await this.db.port.findUnique({
      where: { id: portId, hubId, hub: { userId: requestUserId } },
      select: { id: true },
    });
  }

  async update(hubId: string, userId: string, data: UpdateGatewayDTO) {
    const portsIds = Object.keys(data.ports);

    for await (const id of portsIds) {
      if (await this.portExistInRouter(id, hubId, userId)) {
        const updateData: Prisma.portUpdateInput = {};
        const { name, groups, open, description, connectedFeeders } = data
          .ports[id] as {
          name?: string;
          groups?: Array<{ groupId: string }>;
          open?: boolean;
          description?: string;
          connectedFeeders?: Array<{ feederId: string }>;
        };

        if (name) {
          updateData.name = name;
        }

        if (description) {
          updateData.description = description;
        }

        if (typeof open === 'boolean') {
          updateData.open = open;
        }

        if (groups) {
          updateData.groups = {
            deleteMany: {},
            createMany: {
              data: groups.map(({ groupId }) => ({
                groupId,
              })),
            },
          };
        }

        if (!!Object.keys(updateData).length) {
          await this.db.port.update({ where: { id }, data: updateData });
        }

        if (connectedFeeders) {
          await this.db.port_feeder.deleteMany({ where: { portId: id } });
          for await (const connection of connectedFeeders) {
            await this.db.port_feeder.create({
              omit: {},
              data: {
                feeder: {
                  connect: {
                    id: connection.feederId,
                    hub: { id: hubId, user: { id: userId } },
                  },
                },
                port: {
                  connect: {
                    id,
                    hub: { id: hubId, user: { id: userId } },
                  },
                },
              },
            });
          }
        }
      }
    }

    return await this.getData(hubId, userId);
  }

  async getData(hubId: string, userId: string) {
    return await this.db.hub.findUnique({
      where: {
        id: hubId,
        user: {
          id: userId,
        },
      },
      select: {
        ports: {
          select: {
            id: true,
            name: true,
            description: true,
            readonly: true,
            open: true,
            mode: true,
            isDefault: true,
            groups: {
              select: {
                groupId: true,
              },
            },
            connectedFeeders: {
              select: {
                feederId: true,
              },
            },
            _count: {
              select: {
                recievers: true,
              },
            },
          },
        },
        feeders: {
          select: {
            id: true,
            name: true,
          },
        },
        groups: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async createPort(hubId: string, userId: string, newPort: NewPortDTO) {
    return await this.db.port.create({
      data: {
        hub: {
          connect: {
            id: hubId,
            user: {
              id: userId,
            },
          },
        },
        mode: newPort.mode === 'SEND' ? 'SEND' : 'RECIEVE',
        name: newPort.name,
        description: newPort.description,
      },
      select: {
        id: true,
        groups: true,
        description: true,
        mode: true,
        name: true,
        readonly: true,
        connectedFeeders: {
          select: {
            feederId: true,
          },
        },
      },
    });
  }

  async deletePort(portId: string, hubId: string, userId: string) {
    return await this.db.port.delete({
      where: {
        id: portId,
        readonly: false,
        hub: {
          id: hubId,
          user: {
            id: userId,
          },
        },
      },
    });
  }

  async connectOutputPort(
    hubId: string,
    userId: string,
    userPortId: string,
    hubPortId: string,
  ) {
    return await this.db.port_subscriptions.create({
      data: {
        recieverPort: {
          connect: {
            hub: {
              id: hubId,
              userId,
            },
            id: userPortId,
          },
        },
        senderPort: {
          connect: {
            id: hubPortId,
            OR: [
              { open: true },
              {
                groups: {
                  some: {
                    group: {
                      userId,
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });
  }

  async connectInputPort(
    hubId: string,
    userId: string,
    userPortId: string,
    hubPortId: string,
  ) {
    return await this.db.port_subscriptions.create({
      data: {
        senderPort: {
          connect: {
            hub: {
              id: hubId,
              userId,
            },
            id: userPortId,
          },
        },
        recieverPort: {
          connect: {
            id: hubPortId,
            OR: [
              { open: true },
              {
                groups: {
                  some: {
                    group: {
                      userId,
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });
  }

  async disconnectOutputPort(
    hubId: string,
    userId: string,
    userPortId: string,
    hubPortId: string,
  ) {
    return await this.db.port_subscriptions.delete({
      where: {
        recieverPortId_senderPortId: {
          recieverPortId: userPortId,
          senderPortId: hubPortId,
        },
        recieverPort: {
          hub: {
            id: hubId,
            userId,
          },
          id: userPortId,
        },
        senderPort: {
          id: hubPortId,
        },
      },
    });
  }

  async disconnectInputPort(
    hubId: string,
    userId: string,
    userPortId: string,
    hubPortId: string,
  ) {
    return await this.db.port_subscriptions.delete({
      where: {
        recieverPortId_senderPortId: {
          senderPortId: userPortId,
          recieverPortId: hubPortId,
        },
        senderPort: {
          hub: {
            id: hubId,
            userId,
          },
          id: userPortId,
        },
        recieverPort: {
          id: hubPortId,
        },
      },
    });
  }
}
