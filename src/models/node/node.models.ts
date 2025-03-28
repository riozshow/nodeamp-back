export class NodeModel {
  constructor(
    public readonly properties: {
      readonly name: string;

      readonly maxInputs: number;
      readonly maxOutputs: number;

      readonly maxShares?: number;

      readonly acceptViewer: boolean;
      readonly acceptCreator: boolean;
    },
  ) {}
}

export const NODE_MODELS = {
  shares: new NodeModel({
    name: 'Shares',

    maxOutputs: 0,
    maxInputs: 10,

    acceptCreator: true,
    acceptViewer: true,
  }),

  rater: new NodeModel({
    name: 'Rater',

    maxOutputs: 10,
    maxInputs: 10,

    acceptCreator: true,
    acceptViewer: true,
  }),

  filter: new NodeModel({
    name: 'Filter',

    maxOutputs: 10,
    maxInputs: 10,

    acceptCreator: true,
    acceptViewer: false,
  }),
};

export const AVAILABLE_NODE_MODELS = Object.keys(NODE_MODELS);
