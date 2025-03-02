import { Module, forwardRef } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { ContentModule } from 'src/models/content/content.module';
import { StorageModule } from 'src/models/storage/storage.module';
import { AudioRepository } from './audio.repository';
import { AudioProcesses } from './audio.processes';

@Module({
  providers: [AudioRepository, AudioProcesses],
  imports: [
    DbModule,
    forwardRef(() => ContentModule),
    forwardRef(() => StorageModule),
  ],
  exports: [AudioProcesses],
})
export class AudioModule {}
