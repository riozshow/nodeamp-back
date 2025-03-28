export type ShareStatus = {
  shareId: string;
  moveTo?: string;
  isRejected?: boolean;
};

export type Operator = {
  property: string;
  label: string;
  inputType: string;
  validator: (
    value: string | number,
    refValue: string | number,
  ) => boolean | Promise<boolean>;
};
