import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { StorageDetailsController } from './storage.controller';
import { StorageDetails } from './storage.service';
import { StorageLocationsController } from './locations/storage.locations.controller';
import { StorageLocations } from './locations/storage.locations.service';

@Module({
  controllers: [StorageDetailsController, StorageLocationsController],
  providers: [StorageDetails, StorageLocations],
  imports: [DbModule],
})
export class StorageModule {}
