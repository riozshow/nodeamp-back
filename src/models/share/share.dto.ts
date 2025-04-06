import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class ShareCreateDTO {
  @IsUUID('4')
  userId: string;

  @IsOptional()
  path?: string;

  @IsUUID('4')
  @IsOptional()
  contentId?: string;

  @Length(0, 500)
  @IsString()
  @IsOptional()
  message?: string;
}

export class ShareShareDTO {
  @IsUUID('4')
  userId: string;

  @IsUUID('4')
  shareId: string;

  @Length(0, 500)
  @IsString()
  @IsOptional()
  message?: string;
}

export class ShareCreatePayloadDTO {
  @IsUUID('4')
  @IsOptional()
  contentId?: string;

  @IsOptional()
  path?: string;

  @Length(0, 500)
  @IsString()
  @IsOptional()
  message?: string;
}

export class ShareSharePayloadDTO {
  @IsUUID('4')
  shareId: string;

  @Length(0, 500)
  @IsString()
  @IsOptional()
  message?: string;
}
