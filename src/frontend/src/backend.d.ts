import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Pond {
    associatedTags: Array<string>;
    members: Array<Principal>;
    admin: Principal;
    lilyCount: bigint;
    profileImage?: ExternalBlob;
    name: string;
    createdAt: bigint;
    memberCount: bigint;
    description: string;
    bannerImage?: ExternalBlob;
    image?: ExternalBlob;
    moderators: Array<Principal>;
    visibility: Visibility;
    rules: Array<string>;
}
export interface TagStats {
    id: string;
    firstUsedAt: bigint;
    repliesTotal: bigint;
    postsTotal: bigint;
    lastActivityAt: bigint;
}
export interface Ribbit {
    id: string;
    content: string;
    username: string;
    timestamp: bigint;
    parentId?: string;
    postId: string;
}
export interface Activity {
    id: string;
    username: string;
    pond: string;
    type: ActivityType;
    timestamp: bigint;
    targetId: string;
}
export interface Post {
    id: string;
    tag?: string;
    title: string;
    content: string;
    username: string;
    link?: string;
    pond: string;
    viewCount: bigint;
    timestamp: bigint;
    image?: ExternalBlob;
}
export interface UserProfile {
    name: string;
    joinedPonds: Array<string>;
    avatar?: ExternalBlob;
}
export enum ActivityType {
    like = "like",
    post = "post",
    ribbit = "ribbit",
    viewRibbit = "viewRibbit"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum ViewIncrementResult {
    error = "error",
    notFound = "notFound",
    success = "success"
}
export enum Visibility {
    privateVisibility = "privateVisibility",
    publicVisibility = "publicVisibility"
}
export interface backendInterface {
    addModerator(pondName: string, moderator: Principal): Promise<void>;
    addPondRule(pondName: string, rule: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    canChangeUsername(username: string): Promise<boolean>;
    clearPostLikes(postId: string): Promise<void>;
    createPond(name: string, description: string, image: ExternalBlob, profileImage: ExternalBlob, bannerImage: ExternalBlob, froggyPhrase: string): Promise<void>;
    createPost(title: string, content: string, image: ExternalBlob | null, link: string | null, pond: string, username: string, tag: string | null): Promise<string>;
    createRibbit(postId: string, parentId: string | null, content: string, username: string): Promise<string>;
    deleteLily(postId: string): Promise<void>;
    deleteRibbit(ribbitId: string): Promise<void>;
    editPondSettings(pondName: string, title: string | null, description: string | null, visibility: Visibility | null): Promise<void>;
    getAllRecentActivities(limit: bigint): Promise<Array<Activity>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCanonicalTagForTag(tag: string): Promise<string>;
    getJoinedPonds(): Promise<Array<string>>;
    getLikeCountForPost(postId: string): Promise<bigint>;
    getLiliesByTag(tag: string, sortBy: string): Promise<Array<Post>>;
    getNewestTags(limit: bigint): Promise<Array<[string, TagStats]>>;
    getPond(name: string): Promise<Pond | null>;
    getPondAboutInfo(pondName: string): Promise<{
        title: string;
        associatedTags: Array<string>;
        admin: Principal;
        lilyCount: bigint;
        profileImage?: ExternalBlob;
        name: string;
        createdAt: bigint;
        memberCount: bigint;
        description: string;
        bannerImage?: ExternalBlob;
        moderators: Array<Principal>;
        visibility: Visibility;
        rules: Array<string>;
    } | null>;
    getPondModerators(pondName: string): Promise<Array<Principal>>;
    getPondRules(pondName: string): Promise<Array<string>>;
    getPost(id: string): Promise<Post | null>;
    getPostLikeCount(postId: string): Promise<bigint>;
    getPostsByUsername(username: string): Promise<Array<Post>>;
    getRecentPosts(limit: bigint): Promise<Array<Activity>>;
    getRecentRibbitViews(username: string, limit: bigint): Promise<Array<Activity>>;
    getRecentRibbits(limit: bigint): Promise<Array<Activity>>;
    getRecentlyLikedPosts(limit: bigint): Promise<Array<Activity>>;
    getRibbit(id: string): Promise<Ribbit | null>;
    getRibbitCountForPost(postId: string): Promise<bigint>;
    getRibbitLikeCount(ribbitId: string): Promise<bigint>;
    getRibbitsByUsername(username: string): Promise<Array<Ribbit>>;
    getTagRank(tag: string): Promise<{
        tag: string;
        rank?: bigint;
        canonicalTag: string;
    }>;
    getTagRedirects(): Promise<Array<[string, string]>>;
    getTagStatsForTag(tag: string): Promise<TagStats | null>;
    getTagSuggestions(prefix: string, limit: bigint): Promise<Array<string>>;
    getThreadedRibbitsSorted(postId: string, sortBy: string): Promise<Array<Ribbit>>;
    getTopTags(limit: bigint): Promise<Array<[string, TagStats]>>;
    getTrendingTags(limit: bigint): Promise<Array<[string, TagStats]>>;
    getUserAvatarByUsername(username: string): Promise<ExternalBlob | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserProfileByUsername(username: string): Promise<UserProfile | null>;
    getViewCountForPost(postId: string): Promise<bigint>;
    hasUserLikedPost(postId: string): Promise<boolean>;
    hasUserLikedRibbit(ribbitId: string): Promise<boolean>;
    incrementLilyViewCount(postId: string): Promise<ViewIncrementResult>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isPondAdmin(pondName: string): Promise<boolean>;
    isUsernameAvailable(username: string): Promise<boolean>;
    joinPond(pondName: string): Promise<void>;
    leavePond(pondName: string): Promise<void>;
    likePost(postId: string): Promise<void>;
    likeRibbit(ribbitId: string): Promise<void>;
    listPonds(): Promise<Array<Pond>>;
    listPosts(): Promise<Array<Post>>;
    listRibbits(postId: string): Promise<Array<Ribbit>>;
    mergeSimilarTags(): Promise<void>;
    recordUsernameChange(username: string): Promise<void>;
    registerUsername(username: string): Promise<void>;
    releaseUsername(username: string): Promise<void>;
    removeMemberFromPond(pondName: string, member: Principal): Promise<void>;
    removeModerator(pondName: string, moderator: Principal): Promise<void>;
    removePondRule(pondName: string, rule: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchPonds(searchTerm: string): Promise<Array<Pond>>;
    searchPosts(searchTerm: string): Promise<Array<Post>>;
    unlikePost(postId: string): Promise<void>;
    unlikeRibbit(ribbitId: string): Promise<void>;
}
