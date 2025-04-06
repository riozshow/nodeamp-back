import { Controller, Session, Delete, Param } from '@nestjs/common';
import { ShareRepository } from './share.repository';
import { SessionType } from 'src/auth/auth.types';

@Controller('share')
export class ShareController {
  constructor(private repository: ShareRepository) {}

  @Delete(':shareId')
  async removeOwnShare(
    @Param('shareId') shareId: string,
    @Session() session: SessionType,
  ) {
    const userId = session.passport?.user.id;
    return this.repository.delete.own(shareId, userId);
  }
}
