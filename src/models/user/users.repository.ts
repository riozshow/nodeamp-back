import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { CreateUserDTO, UpdateUser } from './users.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StorageRepository } from 'src/models/storage/storage.repository';
import { HubRepository } from 'src/models/hub/hub.repository';
import { UsersProcesses } from './users.processes';

@Injectable()
export class UsersRepository {
  constructor(
    private db: DbService,
    private hubRepository: HubRepository,
    private storageRepository: StorageRepository,
    private usersProcesses: UsersProcesses,
  ) {}

  public get = {
    byId: async (id: string) => {
      const user = await this.db.user.findUnique({ where: { id } });
      if (user) return user;
      throw new NotFoundException('User not found');
    },
    byUserName: async (name: string) => {
      const user = await this.db.user.findUnique({
        where: { name },
        include: { password: true },
      });
      if (user) return user;
      throw new NotFoundException('User not found');
    },
    signedUserData: async (id: string) => {
      const user = await this.db.user.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          name: true,
          feeders: {
            select: {
              id: true,
              name: true,
            },
          },
          hubs: {
            select: {
              id: true,
              name: true,
              ports: {
                where: {
                  mode: 'RECIEVE',
                },
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
      if (user.id) {
        return user;
      }
      throw new NotFoundException();
    },
    profilePage: async (id: string) => {
      return await this.db.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          label: true,
          hubs: {
            where: {
              isDefault: true,
            },
          },
        },
      });
    },
  };

  public create = {
    one: async (userData: CreateUserDTO) => {
      const { hashedPassword, ...userDetails } = userData;
      const user = await this.db.user.create({
        data: {
          ...userDetails,
          name: userData.name,
          password: { create: { hashedPassword } },
          label: {
            create: {
              title: userData.name,
            },
          },
        },
      });

      await this.storageRepository.create.storage(user.id);
      const hub = await this.hubRepository.create.one(user.id, userData.name);
      await this.usersProcesses.connectProfileHub(user.id, hub.id);

      return user;
    },
  };

  public update = {
    one: async (id: string, data: UpdateUser) => {
      return this.db.user.update({ where: { id }, data });
    },
  };
}
