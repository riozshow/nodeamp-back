import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  serializeUser(user, done) {
    done(null, user);
  }
  deserializeUser(user, done) {
    done(null, user);
  }
}
