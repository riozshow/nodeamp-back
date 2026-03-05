import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { Prisma } from '@prisma/client';
import { Pagination } from 'src/types/pagination.types';
import { getSearch } from 'src/utils/getSearch';
import { getPagination } from 'src/utils/getPagination';
import {
  CreateStorageContentDto,
  UpdateStorageContentDto,
} from './storage.contents.dto';

@Injectable()
export class StorageContent {
  constructor(private db: DbService) {}

  private select: Prisma.contentSelect = {
    id: true,
    locationId: true,
    createdAt: true,
  };

  public get = async (
    locationId: string,
    userId: string,
    { search, page }: Pagination,
  ) => {
    return await this.db.content.findMany({
      where: {
        locationId,
        location: {
          storage: {
            userId,
          },
        },
        ...getSearch(search),
      },
      skip: getPagination(page).skip,
      take: getPagination(page).limit,
      select: this.select,
    });
  };

  public create = async (
    locationId: string,
    userId: string,
    dto: CreateStorageContentDto,
  ) => {
    return await this.db.content.create({
      data: {
        user: { connect: { id: userId } },
        location: {
          connect: {
            id: locationId,
            storage: { userId },
          },
        },
        ...dto,
      },
      select: this.select,
    });
  };

  public update = async (
    contentId: string,
    userId: string,
    dto: UpdateStorageContentDto,
  ) => {
    return await this.db.content.update({
      where: { id: contentId, location: { storage: { userId } } },
      data: { name: dto.name },
      select: this.select,
    });
  };

  public delete = async (contentId: string, userId: string) => {
    return await this.db.content.delete({
      where: { id: contentId, location: { storage: { userId } } },
      select: this.select,
    });
  };
}
