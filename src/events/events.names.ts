export const EVENTS = {
  SHARES: {
    UNCOMMENT: 'share.uncomment',
    COMMENT: 'share.comment',
    CREATE: 'share.create',
    UPDATE: 'share.update',
    REJECT: 'share.reject',
    REMOVE: 'share.remove',
    RATE: 'share.rate',
    UNLIKE: 'share.unlike',
    LIKE: 'share.like',
    MOVE: 'share.move',
  },
  FEEDERS: {
    LOAD: 'feeder.load',
    CREATE: 'feeder.create',
    UPDATE: 'feeder.update',
    REMOVE: 'feeder.remove',
    TAG_REFRESH: 'feeder.tag_refresh',
  },
  STORAGE: {
    UPDATE: 'storage.update',
  },
  RATES: {
    CREATE: 'rate.created',
  },
  NODES: {
    VISIT: 'node.visited',
  },
  POSTS: {
    REMOVE: 'post.removed',
  },
  CONTENT: {
    UPDATE: {
      TAGS: 'content.updated.tags',
    },
  },
};
