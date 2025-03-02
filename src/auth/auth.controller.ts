import {
  Controller,
  Post,
  Delete,
  Body,
  Request,
  Response,
  UseGuards,
  Get,
  Session,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO, LoginDTO } from './auth.dto';
import { LocalAuthGuard } from './local.guard';
import { AuthenticatedGuard } from './authenticated.guard';
import { UsersRepository } from 'src/models/user/users.repository';
import { SessionType } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userRepository: UsersRepository,
  ) {}

  @Get('restore')
  async restore(@Session() session: SessionType) {
    if (session.passport?.user) {
      return await this.userRepository.get.signedUserData(
        session.passport.user.id,
      );
    }
    return session.passport;
  }

  @Post('register')
  async register(@Body() body: RegisterDTO) {
    return this.authService.register(body);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() body: LoginDTO) {
    const user = await this.authService.login(body);
    if (user) {
      return this.userRepository.get.signedUserData(user.id);
    }
  }

  @UseGuards(AuthenticatedGuard)
  @Delete('logout')
  async logout(@Request() req, @Response() res) {
    await req.session.destroy();
    return res.end();
  }
}
