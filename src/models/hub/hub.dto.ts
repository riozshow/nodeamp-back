import {
  IsArray,
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
