import { Module } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { DbModule } from 'src/db/db.module';
import { UserController } from './users.controller';
import { HubModule } from 'src/models/hub/hub.module';
import { StorageModule } from 'src/models/storage/storage.module';

@Module({
  providers: [UsersRepository],
  imports: [DbModule, HubModule, StorageModule],
  exports: [UsersRepository],
  controllers: [UserController],
})
export class UsersModule {}
