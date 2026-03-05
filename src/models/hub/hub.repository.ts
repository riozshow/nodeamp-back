import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { HubPermissions } from './hub.permissions';
import { GroupsRepository } from 'src/models/groups/groups.repository';
import { HubRouter } from './hub.router';
import { FeederPermissions } from '../feeder/feeder.permissions';

@Injectable()
export class HubRepository {
  constructor(
    private db: DbService,
    private hubPermissions: HubPermissions,
    private router: HubRouter,
  ) {}

  public create = {
    one: async (userId: string, name: string) => {
      const hub = await this.db.hub.create({
        data: {
          name,
          user: { connect: { id: userId } },
        },
        select: {
          id: true,
        },
      });

      const feeder = await this.router.createFeeder(hub.id, userId, {
        name: `${name} main`,
        permissions: FeederPermissions.DEFAULT_PERMISSIONS.PUBLIC,
      });

      await this.router.setDefaultFeeder(hub.id, userId, feeder.id);

      return await this.get.one(hub.id, userId);
    },
  };

  public get = {
    one: async (hubId: string, requestUserId: string) => {
      const hub = await this.db.hub.findUnique({
        where: { id: hubId },
        select: {
          id: true,
          name: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!hub) {
        throw new NotFoundException();
      }

      const feeders = await this.hubPermissions.getPermittedFeeders(
        hubId,
        requestUserId,
      );

      const ports = await this.hubPermissions.getPermittedPorts(
        hubId,
        requestUserId,
      );

      return {
        id: hub.id,
        user: hub.user,
        name: hub.name,
        tags: hub.tags,
        feeders,
        ports,
        configurable: hub.user.id === requestUserId,
      };
    },

    oneFromList: async (hubId: string, userId: string) => {
      return this.db.hub.findUnique({
        where: {
          id: hubId,
          OR: [
            {
              feeders: {
                some: {
                  OR: [
                    userId ? { userId } : {},
                    {
                      permissions: {
                        some: {
                          type: 'user_group_post_view',
                          OR: [
                            { public: true },
                            userId
                              ? {
                                  groups: {
                                    some: {
                                      group: {
                                        users: {
                                          some: {
                                            userId,
                                          },
                                        },
                                      },
                                    },
                                  },
                                }
                              : {},
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
            {
              ports: {
                some: {
                  OR: [
                    userId
                      ? {
                          hub: { userId },
                        }
                      : {},
                    {
                      open: true,
                    },
                    userId
                      ? {
                          groups: {
                            some: {
                              group: {
                                users: {
                                  some: {
                                    userId,
                                  },
                                },
                              },
                            },
                          },
                        }
                      : {},
                  ],
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          tags: {
            select: {
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              feeders: {
                where: {
                  OR: [
                    userId ? { userId } : {},
                    {
                      permissions: {
                        some: {
                          type: 'user_group_post_view',
                          OR: [
                            { public: true },
                            userId
                              ? {
                                  groups: {
                                    some: {
                                      group: {
                                        users: {
                                          some: {
                                            userId,
                                          },
                                        },
                                      },
                                    },
                                  },
                                }
                              : {},
                          ],
                        },
                      },
                    },
                  ],
                },
              },
              ports: {
                where: {
                  OR: [
                    userId
                      ? {
                          hub: { userId },
                        }
                      : {},
                    {
                      open: true,
                    },
                    userId
                      ? {
                          groups: {
                            some: {
                              group: {
                                users: {
                                  some: {
                                    userId,
                                  },
                                },
                              },
                            },
                          },
                        }
                      : {},
                  ],
                },
              },
            },
          },
        },
      });
    },

    owner: async (hubId: string, reqestUserId: string) => {
      return this.db.user.findFirst({
        where: {
          hubs: {
            some: {
              id: hubId,
            },
          },
        },
        select: {
          id: true,
        },
      });
    },

    settings: async (hubId: string, requestUserId: string) => {
      return await this.db.hub.findUnique({
        where: { id: hubId, userId: requestUserId },
        select: {
          id: true,
          name: true,
          feeders: {
            select: {
              id: true,
              name: true,
              isDefault: true,
            },
          },
          nodes: {
            select: {
              id: true,
              type: true,
              name: true,
              targetNodes: {
                select: {
                  targetNodeId: true,
                },
              },
              position: {
                select: {
                  x: true,
                  y: true,
                },
              },
              config: {
                select: {
                  data: true,
                },
              },
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
    },

    routerSettings: async (hubId: string, requestUserId: string) => {
      return await this.db.hub.findUnique({
        where: { id: hubId, userId: requestUserId },
        select: {
          id: true,
          name: true,
          feeders: {
            select: {
              id: true,
              name: true,
              isDefault: true,
            },
          },
          nodes: {
            select: {
              id: true,
              type: true,
              name: true,
              inputFeederId: true,
              outputFeederId: true,
              targetNodes: {
                select: {
                  targetNodeId: true,
                },
              },
              position: {
                select: {
                  x: true,
                  y: true,
                },
              },
              config: {
                select: {
                  data: true,
                },
              },
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
    },

    feedersSettings: async (hubId: string, requestUserId: string) => {
      return await this.db.hub.findUnique({
        where: { id: hubId, userId: requestUserId },
        select: {
          id: true,
          name: true,
          feeders: {
            select: {
              id: true,
              name: true,
              isDefault: true,
              inputNode: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
              outputNode: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
          nodes: {
            select: {
              id: true,
              type: true,
              name: true,
              inputFeederId: true,
              outputFeederId: true,
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
    },

    many: async (userId: string) => {
      return this.db.hub.findMany({
        where: {
          OR: [
            {
              feeders: {
                some: {
                  OR: [
                    userId ? { userId } : {},
                    {
                      permissions: {
                        some: {
                          type: 'user_group_post_view',
                          OR: [
                            { public: true },
                            userId
                              ? {
                                  groups: {
                                    some: {
                                      group: {
                                        users: {
                                          some: {
                                            userId,
                                          },
                                        },
                                      },
                                    },
                                  },
                                }
                              : {},
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
            {
              ports: {
                some: {
                  OR: [
                    userId
                      ? {
                          hub: { userId },
                        }
                      : {},
                    {
                      open: true,
                    },
                    userId
                      ? {
                          groups: {
                            some: {
                              group: {
                                users: {
                                  some: {
                                    userId,
                                  },
                                },
                              },
                            },
                          },
                        }
                      : {},
                  ],
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          tags: {
            select: {
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              feeders: {
                where: {
                  OR: [
                    userId ? { userId } : {},
                    {
                      permissions: {
                        some: {
                          type: 'user_group_post_view',
                          OR: [
                            { public: true },
                            userId
                              ? {
                                  groups: {
                                    some: {
                                      group: {
                                        users: {
                                          some: {
                                            userId,
                                          },
                                        },
                                      },
                                    },
                                  },
                                }
                              : {},
                          ],
                        },
                      },
                    },
                  ],
                },
              },
              ports: {
                where: {
                  OR: [
                    userId
                      ? {
                          hub: { userId },
                        }
                      : {},
                    {
                      open: true,
                    },
                    userId
                      ? {
                          groups: {
                            some: {
                              group: {
                                users: {
                                  some: {
                                    userId,
                                  },
                                },
                              },
                            },
                          },
                        }
                      : {},
                  ],
                },
              },
            },
          },
        },
      });
    },

    defaultFeeder: async (hubId: string) => {
      return await this.db.feeder.findFirst({
        where: {
          hubId,
          isDefault: true,
        },
        select: {
          id: true,
        },
      });
    },
  };
}
