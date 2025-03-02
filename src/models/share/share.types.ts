import { Prisma } from '@prisma/client';
import { NodeProcesses } from '../node/node.processes';

export type ShareStatusData = Prisma.shareGetPayload<{
  select: typeof NodeProcesses.SHARE_STATUS_SELECT;
}>;
