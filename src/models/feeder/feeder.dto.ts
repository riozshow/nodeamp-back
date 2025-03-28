import {
  IsUUID,
  IsOptional,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
  Matches,
  Length,
  IsObject,
} from 'class-validator';
import { CompiledPermissions } from 'src/auth/group.guard';

export class GetPostsDTO {
  @IsUUID('4')
  feederId: string;

  @IsUUID('4')
  portalId?: string;

  page: number;
}

export class GetPostDTO {
  @IsUUID('4')
  feederId: string;

  @IsUUID('4')
  portalId?: string;

  @IsUUID('4')
  postId?: string;
}

export class CreateFeederDTO {
  @MinLength(1)
  @IsString()
  name: string;

  @Matches(/public|private/)
  @IsString()
  type: 'public' | 'private';

  @IsString()
  @IsUUID('4')
  hubId: string;
}

export class FeederPostCreatePayloadDTO {
  @IsUUID('4')
  @IsOptional()
  contentId?: string;

  @IsUUID('4')
  @IsOptional()
  postId?: string;

  @IsString()
  @IsOptional()
  message: string;
}

export class FeederPostCreateDTO {
  @IsUUID('4')
  contentId?: string;

  @IsOptional()
  @IsUUID('4')
  postId?: string;

  @IsUUID('4')
  feederId: string;

  label: {
    description?: string;
  };
}

export class FeederPostShareDTO {
  @IsUUID('4')
  feederId: string;

  @IsUUID('4')
  shareId: string;

  label: {
    description?: string;
  };
}

export class FeederPostRateDTO {
  @IsUUID('4')
  feederId: string;

  @IsUUID('4')
  shareId: string;

  @IsUUID('4')
  portalId: string;

  @IsUUID('4')
  userId: string;

  @IsPositive()
  @IsNumber()
  rate: number;
}

export class FeederDataDTO {
  @Length(1, 30)
  @IsString()
  @IsOptional()
  name: string;

  @IsOptional()
  label?: {
    description?: string;
  };

  @IsOptional()
  inputNode?: {
    id?: string;
  };

  @IsOptional()
  outputNode?: {
    id?: string;
  };

  @IsOptional()
  permissions: { data: CompiledPermissions };
}
