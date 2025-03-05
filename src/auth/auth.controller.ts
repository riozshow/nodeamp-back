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
  Inject,
  forwardRef,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO, LoginDTO } from './auth.dto';
import { LocalAuthGuard } from './local.guard';
import { AuthenticatedGuard } from './authenticated.guard';
import { UsersRepository } from 'src/models/user/users.repository';
import { SessionType } from './auth.types';
import { WebsocketService } from 'src/websocket/websocket.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userRepository: UsersRepository,
    @Inject(forwardRef(() => WebsocketService))
    private ws: WebsocketService,
  ) {}

  @Get('restore')
  async restore(@Session() session: SessionType) {
    if (session.passport?.user.id) {
      const { user } = session.passport;
      const ws = await this.ws.generateUserKey(user.id);
      const userData = await this.userRepository.get.signedUserData(user.id);
      return {
        ...userData,
        ws,
      };
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
      const ws = await this.ws.generateUserKey(user.id);
      const userData = await this.userRepository.get.signedUserData(user.id);
      return {
        ...userData,
        ws,
      };
    }
  }

  @UseGuards(AuthenticatedGuard)
  @Delete('logout')
  async logout(@Request() req, @Response() res) {
    await req.session.destroy();
    return res.end();
  }
}
