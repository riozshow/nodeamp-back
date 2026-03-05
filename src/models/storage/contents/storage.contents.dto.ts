import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { FileType } from '@prisma/client';

export class CreateStorageContentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(FileType)
  @IsNotEmpty()
  type: FileType;
}

export class UpdateStorageContentDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
