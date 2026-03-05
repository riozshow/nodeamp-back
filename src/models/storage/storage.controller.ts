import { Controller, Get, Session, UseGuards } from '@nestjs/common';
import { StorageDetails } from './storage.service';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';
import { SessionType } from 'src/auth/auth.types';

@Controller('storage/details')
export class StorageDetailsController {
  constructor(private details: StorageDetails) {}

  @UseGuards(AuthenticatedGuard)
  @Get()
  async getStorage(@Session() session: SessionType) {
    const userId = session.passport?.user.id;
    return await this.details.getDetails(userId);
  }
}
