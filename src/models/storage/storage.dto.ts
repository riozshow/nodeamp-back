import { IsString, Length } from 'class-validator';

export class CreateLocationDTO {
  @Length(2)
  @IsString()
  path: string;
}

export class UploadFileDTO {}
