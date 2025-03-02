import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { BadRequestException } from '@nestjs/common';
import { capitalize } from 'src/utils/capitalize';
import { getDuplicateSufix } from 'src/utils/getDuplicateSufix';
import { StorageRepository } from 'src/models/storage/storage.repository';

@Injectable()
export class ContentProcesses {
  constructor(
    private db: DbService,
    @Inject(forwardRef(() => StorageRepository))
    private storageRepositiory: StorageRepository,
  ) {}

  validateType(type: string) {
    const types = [
      'tunnel',
      'playlist',
      'audio_track',
      'cut',
      'premiere',
      'stems',
    ];

    type = type.toLowerCase();

    if (!types.includes(type)) {
      throw new BadRequestException();
    }

    return type;
  }

  async validateNewContent(
    userId: string,
    path: string,
    reqType: string,
    contentName?: string,
  ) {
    const type = this.validateType(reqType);
    const location = await this.storageRepositiory.get.location(userId, path);
    const name = await this.findFirstContentFreeName(
      contentName || capitalize(type),
      userId,
      location.id,
    );

    return { type, location, name };
  }

  async findFirstContentFreeName(
    name: string,
    userId: string,
    locationId: string,
  ) {
    const duplicates = await this.db.content.findMany({
      where: {
        locationId,
        userId,
        name: {
          startsWith: name,
          mode: 'insensitive',
        },
      },
      select: {
        name: true,
      },
    });

    if (!!duplicates.length) {
      name += getDuplicateSufix(name, duplicates);
    }

    return name;
  }
}
