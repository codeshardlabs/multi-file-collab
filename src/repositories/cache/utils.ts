export function getShardCommentsKey(shardId: number): string {
  let shardKey = getShardKey(shardId);
  return `${shardKey}:comments`;
}

export function getShardKey(shardId: number): string {
  return `shard:${shardId}`;
}

export function getUserKey(userId: string): string {
  return `user:${userId}`;
}

export function getCommentKey(commentId: number): string {
  return `comment:${commentId}`;
}

export function getShardsByUserIdKey(userId: string, page: number) : string {
  return `${getUserKey(userId)}:shards:page:${page}`
}
