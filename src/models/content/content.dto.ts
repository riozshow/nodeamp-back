import { IsString, IsUUID, IsOptional } from 'class-validator';

export class ContentUpdateDTO {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  label?: {
    title?: string;
    description?: string;
  };

  @IsOptional()
  properties?: {
    type: string;
    value: string;
  }[];

  @IsOptional()
  tags?: {
    name: string;
  }[];

  @IsOptional()
  relatedContents: {
    relatedContent: {
      id: string;
    };
  }[];

  @IsOptional()
  sourceContents: {
    sourceContent: {
      id: string;
    };
  }[];
}

export class ContentPatchDTO {
  @IsString()
  @IsOptional()
  name: string;

  @IsOptional()
  label?: {
    title?: string;
    description?: string;
  };

  @IsOptional()
  properties?: {
    type: string;
    value: string;
  }[];

  @IsOptional()
  tags?: {
    name: string;
  }[];

  @IsOptional()
  relatedContents: {
    relatedContent: {
      id: string;
    };
  }[];

  @IsOptional()
  sourceContents: {
    sourceContent: {
      id: string;
    };
  }[];
}
