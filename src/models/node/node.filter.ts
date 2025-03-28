import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { Operator } from './node.types';
import { Condition } from './filter/condition.class';

@Injectable()
export class NodeFilter {
  constructor(private db: DbService) {}

  static OPERATORS: { [type: string]: { [operator: string]: Operator } } = {
    NUMERIC: {
      equals: {
        property: 'isEqual',
        label: '=',
        inputType: 'number',
        validator: (value: number, refValue: number) => value == refValue,
      },
      moreThan: {
        property: 'moreThan',
        label: '>',
        inputType: 'number',
        validator: (value: number, refValue: number) => value > refValue,
      },
      lessThan: {
        property: 'lessThan',
        label: '<',
        inputType: 'number',
        validator: (value: number, refValue: number) => value > refValue,
      },
    },
    STRING: {
      exact: {
        property: 'exact',
        label: '=',
        inputType: 'string',
        validator: (value: string, refValue: string) => value == refValue,
      },
      startsWith: {
        property: 'startsWith',
        label: 'Start',
        inputType: 'string',
        validator: (value: string, refValue: string) =>
          refValue.startsWith(value),
      },
      endsWith: {
        property: 'endsWith',
        label: 'End',
        inputType: 'string',
        validator: (value: string, refValue: string) =>
          refValue.endsWith(value),
      },
      includes: {
        property: 'includes',
        label: 'Include',
        inputType: 'string',
        validator: (value: string, refValue: string) =>
          refValue.includes(value),
      },
    },
  };

  static CONDITIONS = [
    new Condition({
      name: 'Track duration',
      property: 'trackDuration',
      select: {
        post: {
          select: {
            content: {
              select: {
                file: {
                  select: {
                    duration: true,
                  },
                },
              },
            },
          },
        },
      },
      requirements: {
        content_types: ['audio_track'],
      },
      operators: [
        NodeFilter.OPERATORS.NUMERIC.equals,
        NodeFilter.OPERATORS.NUMERIC.lessThan,
        NodeFilter.OPERATORS.NUMERIC.moreThan,
      ],
    }),
    new Condition({
      name: 'Likes',
      property: 'contentLikes',
      select: {
        post: {
          select: {
            content: {
              select: {
                interactions: {
                  select: {
                    likes: true,
                  },
                },
              },
            },
          },
        },
      },
      requirements: {
        hasContent: true,
      },
      operators: [
        NodeFilter.OPERATORS.NUMERIC.equals,
        NodeFilter.OPERATORS.NUMERIC.lessThan,
        NodeFilter.OPERATORS.NUMERIC.moreThan,
      ],
    }),
    new Condition({
      name: 'Content tag',
      property: 'contentTag',
      isMultiple: true,
      select: {
        post: {
          select: {
            content: {
              select: {
                tags: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      requirements: {
        hasContent: true,
      },
      operators: [
        NodeFilter.OPERATORS.STRING.exact,
        NodeFilter.OPERATORS.STRING.startsWith,
        NodeFilter.OPERATORS.STRING.endsWith,
        NodeFilter.OPERATORS.STRING.includes,
      ],
    }),
  ];

  getAvailableConditions() {
    return NodeFilter.CONDITIONS.map((c) => ({
      name: c.data.name,
      property: c.data.property,
      requirements: c.data.requirements,
      isMultiple: c.data.isMultiple,
      operators: c.data.operators.map((o) => ({
        label: o.label,
        inputType: o.inputType,
        property: o.property,
      })),
    }));
  }
}
