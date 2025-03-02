import { Module } from '@nestjs/common';
import { GroupsRepository } from './groups.repository';
import { DbModule } from 'src/db/db.module';

@Module({
  providers: [GroupsRepository],
  imports: [DbModule],
  exports: [GroupsRepository],
})
export class GroupsModule {}
