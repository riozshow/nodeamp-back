import { Controller, Get, Param } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Controller('users')
export class UserController {
  constructor(private repository: UsersRepository) {}

  @Get(':userId/profile')
  async getUserPage(@Param('userId') userId: string) {
    return await this.repository.get.profilePage(userId);
  }

  @Get(':userId/default-hub')
  async getDefaultHub(@Param('userId') userId: string) {
    return await this.repository.get.defaultHub(userId);
  }
}
