import { Prisma } from '@prisma/client';

export type NodePermmissionsSelect = Prisma.nodeGetPayload<{
  select: {
    hub: { select: { userId: true } };
    permissions: { select: { data: true } };
  };
}>;

export type NodeTypes = 'input' | 'output' | 'rater';

export type ShareStatus = {
  shareId: string;
  moveTo?: string;
  isRejected?: boolean;
  isAccepted?: boolean;
};

export const NODE = {
  INPUT: 'input',
  OUTPUT: 'output',
  RATER: 'rater',
};
