import { Prisma } from '@prisma/client';
import { Operator } from '../node.types';

export class Condition {
  constructor(
    public data: {
      name: string;
      property: string;
      select: Prisma.shareSelect;
      isMultiple?: boolean;
      requirements?: {
        content_types?: string[];
        hasContent?: boolean;
      };
      operators: Operator[];
    },
  ) {}
}
