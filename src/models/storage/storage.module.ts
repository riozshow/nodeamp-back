import { forwardRef, Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { DbModule } from 'src/db/db.module';
import { ContentModule } from 'src/models/content/content.module';
import { StorageRepository } from './storage.repository';
import { StorageCloud } from './storage.cloud';
import { StorageProcesses } from './storage.processes';
import { AudioModule } from 'src/models/audio/audio.module';

@Module({
  controllers: [StorageController],
  providers: [StorageRepository, StorageCloud, StorageProcesses],
  imports: [
    DbModule,
    forwardRef(() => ContentModule),
    forwardRef(() => AudioModule),
  ],
  exports: [StorageRepository],
})
export class StorageModule {}
