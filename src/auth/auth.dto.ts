import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { Match } from './match.decorator';

export class LoginDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDTO {
  @MaxLength(30)
  @MinLength(5)
  @IsString()
  @IsNotEmpty()
  password: string;

  @Match('password')
  passwordRepeat: string;

  @IsString()
  name: string;
}
