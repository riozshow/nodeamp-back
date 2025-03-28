import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthenticatedGuard } from 'src/auth/authenticated.guard';
import { NodeFilter } from './node.filter';

@UseGuards(AuthenticatedGuard)
@Controller('nodes')
export class NodesController {
  constructor(private filter: NodeFilter) {}

  @Get('filter-conditions')
  getFilterNodeConditions() {
    return this.filter.getAvailableConditions();
  }
}
