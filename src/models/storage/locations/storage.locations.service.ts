import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { CreateLocationDTO } from './storage.locations.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StorageLocations {
  constructor(private db: DbService) {}

  private select: Prisma.locationSelect = {
    path: true,
    id: true,
  };

  public get = async (userId: string) => {
    return await this.db.location.findMany({
      where: { userId },
      select: this.select,
    });
  };

  public create = async (userId: string, body: CreateLocationDTO) => {
    return await this.db.location.create({
      data: { userId, path: body.path },
      select: this.select,
    });
  };

  public update = async (
    userId: string,
    id: string,
    body: CreateLocationDTO,
  ) => {
    return await this.db.location.update({
      where: { userId, id },
      data: { path: body.path },
      select: this.select,
    });
  };

  public delete = async (userId: string, id: string) => {
    return await this.db.location.delete({
      where: { userId, id },
      select: this.select,
    });
  };
}
