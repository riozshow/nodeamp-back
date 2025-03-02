import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  hashedPassword: string;
}

export class UpdateUser {
  @IsString()
  @IsNotEmpty()
  user: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
