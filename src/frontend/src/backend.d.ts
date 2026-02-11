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
export interface Ribbit {
    id: string;
    content: string;
    username: string;
    timestamp: bigint;
    parentId?: string;
    postId: string;
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
    assignUserRoleByPhraseHash(userId: string, role: UserRole): Promise<void>;
    canChangeUsername(username: string): Promise<boolean>;
    canChangeUsernameByPhraseHash(userId: string, username: string): Promise<boolean>;
    createPond(name: string, description: string, image: ExternalBlob, profileImage: ExternalBlob, bannerImage: ExternalBlob, froggyPhrase: string): Promise<void>;
    editPondSettings(pondName: string, title: string | null, description: string | null, visibility: Visibility | null): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCanonicalTagForTag(tag: string): Promise<string>;
    getPond(name: string): Promise<Pond | null>;
    getPondModerators(pondName: string): Promise<Array<Principal>>;
    getPondRules(pondName: string): Promise<Array<string>>;
    getPostsByUsername(username: string): Promise<Array<Post>>;
    getRibbitsByUsername(username: string): Promise<Array<Ribbit>>;
    getTagRedirects(): Promise<Array<[string, string]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserProfileByPhraseHash(userId: string): Promise<UserProfile | null>;
    getUserProfileByUsername(username: string): Promise<UserProfile | null>;
    getUserRoleByPhraseHash(userId: string): Promise<UserRole>;
    incrementLilyViewCount(postId: string): Promise<ViewIncrementResult>;
    initializeAccessControl(): Promise<void>;
    initializeFroggyPhrase(userId: string): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isPondAdmin(pondName: string): Promise<boolean>;
    isUserAdminByPhraseHash(userId: string): Promise<boolean>;
    isUsernameAvailable(username: string): Promise<boolean>;
    isUsernameAvailableByPhraseHash(_userId: string, username: string): Promise<boolean>;
    listPonds(): Promise<Array<Pond>>;
    mergeSimilarTags(): Promise<void>;
    recordUsernameChange(username: string): Promise<void>;
    recordUsernameChangeByPhraseHash(userId: string, username: string): Promise<void>;
    registerUsername(username: string): Promise<void>;
    registerUsernameWithPhraseHash(userId: string, username: string): Promise<void>;
    releaseUsername(username: string): Promise<void>;
    releaseUsernameWithPhraseHash(userId: string, username: string): Promise<void>;
    removeModerator(pondName: string, moderator: Principal): Promise<void>;
    removePondRule(pondName: string, rule: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveUserProfileByPhraseHash(userId: string, profile: UserProfile): Promise<void>;
}
