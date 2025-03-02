import { IsOptional, IsString, IsUUID } from 'class-validator';

export class PostCreateDTO {
  @IsUUID('4')
  userId: string;

  @IsUUID('4')
  contentId?: string;

  @IsUUID('4')
  postId?: string;

  @IsString()
  @IsOptional()
  message?: string;
}

export class PostCreatePayloadDTO {
  @IsUUID('4')
  @IsOptional()
  contentId?: string;

  @IsUUID('4')
  postId?: string;

  @IsString()
  @IsOptional()
  message: string;
}
