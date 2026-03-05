import { GroupPermissionType, PortMode } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

export class NewFeeder {
  @Length(1, 150)
  @IsString()
  name: string;

  @Length(1, 3000)
  @IsString()
  @IsOptional()
  description?: string;

  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  create?: string[];

  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  view?: string[];

  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  remove?: string[];

  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  share?: string[];

  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  comment?: string[];
}

export class RouterUpdate {
  nodes: {
    [nodeId: string]: { [property: string]: unknown };
  };
  emitters: {
    [emitterId: string]: { [property: string]: unknown };
  };
}

export class NewPortDTO {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  mode: PortMode;
}

export class UpdateGatewayDTO {
  ports: {
    [portId: string]: { [property: string]: unknown };
  };
}

export class UpdateGroupDTO {
  @IsString()
  @IsOptional()
  name: string;

  @IsBoolean()
  @IsOptional()
  public: boolean;

  @IsArray()
  @IsOptional()
  permissions?: {
    id: string;
    type: GroupPermissionType;
    public: boolean;
    groups?: { groupId: string }[];
  }[];
}

export class NewHubDTO {
  @IsString()
  name: string;
}

export class NewGroupDTO {
  @IsString()
  name: string;
}
