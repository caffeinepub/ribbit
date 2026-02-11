// Local type definitions for types not exported by backend
export interface Activity {
  id: string;
  type_: ActivityType;
  targetId: string;
  timestamp: bigint;
  username: string;
  pond: string;
}

export type ActivityType = 
  | { __kind__: 'post' }
  | { __kind__: 'ribbit' }
  | { __kind__: 'like' }
  | { __kind__: 'viewRibbit' };

export interface TagStats {
  id: string;
  postsTotal: bigint;
  repliesTotal: bigint;
  firstUsedAt: bigint;
  lastActivityAt: bigint;
}
