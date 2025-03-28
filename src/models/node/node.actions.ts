export type FeederActionType = {
  [key: string]: string;
};

export const FeederActions = {
  view: 'user_group_post_view',
  rate: 'user_group_post_rate',
  share: 'user_group_post_share',
  create: 'user_group_post_create',
  remove: 'user_group_post_remove',
  comment: 'user_group_post_comment',
};

export const FeederTypeActions = {
  input: [FeederActions.create],
  output: [
    FeederActions.view,
    FeederActions.share,
    FeederActions.remove,
    FeederActions.comment,
  ],
  rater: [FeederActions.view, FeederActions.rate, FeederActions.remove],
};
