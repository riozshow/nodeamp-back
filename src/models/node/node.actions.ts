export type NodeActionType = {
  [key: string]: string;
};

export const NodeActions = {
  view: 'user_group_post_view',
  rate: 'user_group_post_rate',
  share: 'user_group_post_share',
  create: 'user_group_post_create',
  remove: 'user_group_post_remove',
  comment: 'user_group_post_comment',
};

export const NodeTypeActions = {
  input: [NodeActions.create],
  output: [
    NodeActions.view,
    NodeActions.share,
    NodeActions.remove,
    NodeActions.comment,
  ],
  rater: [NodeActions.view, NodeActions.rate, NodeActions.remove],
};
