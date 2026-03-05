import { Module, forwardRef } from '@nestjs/common';
import { ContentController } from './_content.controller';
import { DbModule } from 'src/db/db.module';
import { ContentUpdater } from './_content.updater';
import { AudioModule } from 'src/models/audio/audio.module';
import { StorageModule } from 'src/models/storage/storage.module';
import { ContentProcesses } from './content.processes';
import { ContentRepository } from './content.repository';

@Module({
  controllers: [ContentController],
  imports: [
    DbModule,
    forwardRef(() => AudioModule),
    forwardRef(() => StorageModule),
  ],
  exports: [ContentRepository],
  providers: [ContentUpdater, ContentProcesses, ContentRepository],
})
export class ContentModule {}
