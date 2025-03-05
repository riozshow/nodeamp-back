import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DbModule } from '../db/db.module';
import { UsersModule } from '../models/user/users.module';
import { LocalStrategy } from './local.strategy';
import { PassportModule } from '@nestjs/passport';
import { SessionSerializer } from './session.serializer';
import { WebsocketModule } from 'src/websocket/websocket.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, SessionSerializer],
  imports: [
    DbModule,
    UsersModule,
    PassportModule.register({ session: true }),
    forwardRef(() => WebsocketModule),
  ],
})
export class AuthModule {}
