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
  create?: string[];

  @ValidateNested({ each: true })
  @IsArray()
  view?: string[];

  @ValidateNested({ each: true })
  @IsArray()
  remove?: string[];

  @ValidateNested({ each: true })
  @IsArray()
  share?: string[];

  @ValidateNested({ each: true })
  @IsArray()
  comment?: string[];
}
