import { Injectable } from '@nestjs/common';
import { RegisterDTO, LoginDTO } from './auth.dto';
import * as bcrypt from 'bcryptjs';
import { user } from '@prisma/client';
import { UsersRepository } from 'src/models/user/users.repository';

@Injectable()
export class AuthService {
  constructor(private usersRepository: UsersRepository) {}

  async register(body: RegisterDTO): Promise<user> {
    const hashedPassword = await bcrypt.hash(body.password, 10);
    return this.usersRepository.create.one({ name: body.name, hashedPassword });
  }

  async login(body: LoginDTO) {
    const { name, password } = body;
    const user = await this.usersRepository.get.byUserName(name);
    if (!user) return false;
    if (await bcrypt.compare(password, user.password.hashedPassword)) {
      const { password, ...userData } = user;
      return { ...userData };
    }
  }
}
