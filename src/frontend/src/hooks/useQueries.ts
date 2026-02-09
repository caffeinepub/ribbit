import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Post, Ribbit, Pond, UserProfile, Activity, TagStats, ExternalBlob } from '@/backend';
import { Principal } from '@icp-sdk/core/principal';

// Lily (Post) Queries
export function useGetLily(id: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Post | null>({
    queryKey: ['lily', id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPost(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useGetAllLilies() {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['lilies'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateLily() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      content,
      image,
      link,
      pond,
      username,
      tag,
    }: {
      title: string;
      content: string;
      image: ExternalBlob | null;
      link: string | null;
      pond: string;
      username: string;
      tag: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPost(title, content, image, link, pond, username, tag);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lilies'] });
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
    },
  });
}

// Search Lilies - stub implementation
export function useSearchLilies(query: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['searchLilies', query],
    queryFn: async () => {
      if (!actor || !query) return [];
      return actor.searchPosts(query);
    },
    enabled: !!actor && !isFetching && !!query,
  });
}

// Ribbit Queries
export function useGetRibbits(postId: string, sortBy: 'top' | 'newest' = 'newest') {
  const { actor, isFetching } = useActor();

  return useQuery<Ribbit[]>({
    queryKey: ['ribbits', postId, sortBy],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getThreadedRibbitsSorted(postId, sortBy);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useCreateRibbit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      parentId,
      content,
      username,
      image,
    }: {
      postId: string;
      parentId: string | null;
      content: string;
      username: string;
      image?: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createRibbit(postId, parentId, content, username, image || null);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ribbits', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['ribbitCount', variables.postId] });
    },
  });
}

export function useGetRibbitCount(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['ribbitCount', postId],
    queryFn: async () => {
      if (!actor) return 0;
      const count = await actor.getRibbitCountForPost(postId);
      return Number(count);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

// Pond Queries
export function useGetPond(name: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Pond | null>({
    queryKey: ['pond', name],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPond(name);
    },
    enabled: !!actor && !isFetching && !!name,
  });
}

export function useGetAllPonds() {
  const { actor, isFetching } = useActor();

  return useQuery<Pond[]>({
    queryKey: ['ponds'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPonds();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePond() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      image,
      profileImage,
      bannerImage,
      froggyPhrase,
    }: {
      name: string;
      description: string;
      image: ExternalBlob;
      profileImage: ExternalBlob;
      bannerImage: ExternalBlob;
      froggyPhrase: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPond(name, description, image, profileImage, bannerImage, froggyPhrase);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
    },
  });
}

export function useJoinPond() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pondName: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.joinPond(pondName);
    },
    onSuccess: (_, pondName) => {
      queryClient.invalidateQueries({ queryKey: ['pond', pondName] });
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
      queryClient.invalidateQueries({ queryKey: ['joinedPonds'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetJoinedPonds() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['joinedPonds'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getJoinedPonds();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLeavePond() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pondName: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.leavePond(pondName);
    },
    onSuccess: (_, pondName) => {
      queryClient.invalidateQueries({ queryKey: ['pond', pondName] });
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
      queryClient.invalidateQueries({ queryKey: ['joinedPonds'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Username Registry Queries
export function useIsUsernameAvailable(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['usernameAvailable', username],
    queryFn: async () => {
      if (!actor || !username) return true;
      return actor.isUsernameAvailable(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useRegisterUsername() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerUsername(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Stub for useReleaseUsername
export function useReleaseUsername() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.releaseUsername(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Stub for useCanChangeUsername
export function useCanChangeUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['canChangeUsername', username],
    queryFn: async () => {
      if (!actor || !username) return true;
      return actor.canChangeUsername(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

// Like Queries (Posts)
export function useGetPostLikeCount(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['postLikeCount', postId],
    queryFn: async () => {
      if (!actor) return 0;
      const count = await actor.getLikeCountForPost(postId);
      return Number(count);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useHasUserLikedPost(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['hasUserLikedPost', postId],
    queryFn: async () => {
      if (!actor) return false;
      return actor.hasUserLikedPost(postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useLikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.likePost(postId);
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['postLikeCount', postId] });
      queryClient.invalidateQueries({ queryKey: ['hasUserLikedPost', postId] });
    },
  });
}

export function useUnlikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unlikePost(postId);
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['postLikeCount', postId] });
      queryClient.invalidateQueries({ queryKey: ['hasUserLikedPost', postId] });
    },
  });
}

// Like Queries (Ribbits)
export function useGetRibbitLikeCount(ribbitId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['ribbitLikeCount', ribbitId],
    queryFn: async () => {
      if (!actor) return 0;
      const count = await actor.getRibbitLikeCount(ribbitId);
      return Number(count);
    },
    enabled: !!actor && !isFetching && !!ribbitId,
  });
}

export function useHasUserLikedRibbit(ribbitId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['hasUserLikedRibbit', ribbitId],
    queryFn: async () => {
      if (!actor) return false;
      return actor.hasUserLikedRibbit(ribbitId);
    },
    enabled: !!actor && !isFetching && !!ribbitId,
  });
}

export function useLikeRibbit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ribbitId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.likeRibbit(ribbitId);
    },
    onSuccess: (_, ribbitId) => {
      queryClient.invalidateQueries({ queryKey: ['ribbitLikeCount', ribbitId] });
      queryClient.invalidateQueries({ queryKey: ['hasUserLikedRibbit', ribbitId] });
    },
  });
}

export function useUnlikeRibbit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ribbitId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unlikeRibbit(ribbitId);
    },
    onSuccess: (_, ribbitId) => {
      queryClient.invalidateQueries({ queryKey: ['ribbitLikeCount', ribbitId] });
      queryClient.invalidateQueries({ queryKey: ['hasUserLikedRibbit', ribbitId] });
    },
  });
}

// View Count Queries
export function useGetViewCount(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['viewCount', postId],
    queryFn: async () => {
      if (!actor) return 0;
      const count = await actor.getViewCountForPost(postId);
      return Number(count);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useIncrementViewCount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.incrementLilyViewCount(postId);
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['viewCount', postId] });
    },
  });
}

// Tag Queries
export function useGetLiliesByTag(tag: string, sortBy: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['liliesByTag', tag, sortBy],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLiliesByTag(tag, sortBy);
    },
    enabled: !!actor && !isFetching && !!tag,
  });
}

export function useGetTagSuggestions(prefix: string, limit: number) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['tagSuggestions', prefix, limit],
    queryFn: async () => {
      if (!actor || !prefix) return [];
      return actor.getTagSuggestions(prefix, BigInt(limit));
    },
    enabled: !!actor && !isFetching && !!prefix,
  });
}

// Recent Activity Queries - accepts limit parameter
export function useGetRecentActivities(limit: number = 30) {
  const { actor, isFetching } = useActor();

  return useQuery<Activity[]>({
    queryKey: ['recentActivities', limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRecentActivities(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

// Pond About Info Query
export function useGetPondAboutInfo(pondName: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['pondAboutInfo', pondName],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPondAboutInfo(pondName);
    },
    enabled: !!actor && !isFetching && !!pondName,
  });
}

// Tag Rank Query
export function useGetTagRank(tag: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['tagRank', tag],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTagRank(tag);
    },
    enabled: !!actor && !isFetching && !!tag,
  });
}

// Tag Stats Query
export function useGetTagStats(tag: string) {
  const { actor, isFetching } = useActor();

  return useQuery<TagStats | null>({
    queryKey: ['tagStats', tag],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTagStatsForTag(tag);
    },
    enabled: !!actor && !isFetching && !!tag,
  });
}

// Tag Hub Queries
export function useGetTopTags(limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, TagStats]>>({
    queryKey: ['topTags', limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopTags(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTrendingTags(limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, TagStats]>>({
    queryKey: ['trendingTags', limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTrendingTags(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetNewestTags(limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, TagStats]>>({
    queryKey: ['newestTags', limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNewestTags(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

// Stub implementations for search features - accept parameters
export function useGetTrendingSearches(limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['trendingSearches', limit],
    queryFn: async () => {
      // Stub: return empty array since backend doesn't have this
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSearchSuggestions(query: string, limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['searchSuggestions', query, limit],
    queryFn: async () => {
      // Stub: return empty array since backend doesn't have this
      return [];
    },
    enabled: !!actor && !isFetching && !!query,
  });
}

export function useRecordSearchTerm() {
  return useMutation({
    mutationFn: async (term: string) => {
      // Stub: no-op since backend doesn't have this
      return;
    },
  });
}

// Stub for useGetUserProfiles
export function useGetUserProfiles(principals: Principal[]) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<UserProfile | null>>({
    queryKey: ['userProfiles', principals.map(p => p.toString())],
    queryFn: async () => {
      // Stub: return empty array since backend doesn't have batch profile fetch
      return [];
    },
    enabled: !!actor && !isFetching && principals.length > 0,
  });
}

// Profile Page Queries
export function useGetUserProfileByUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', username],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserProfileByUsername(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useGetPostsByUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['postsByUsername', username],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPostsByUsername(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useGetRibbitsByUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Ribbit[]>({
    queryKey: ['ribbitsByUsername', username],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRibbitsByUsername(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

// Avatar Query
export function useGetUserAvatarByUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ExternalBlob | null>({
    queryKey: ['userAvatar', username],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserAvatarByUsername(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

// Admin Queries
export function useIsAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMergeSimilarTags() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.mergeSimilarTags();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lilies'] });
      queryClient.invalidateQueries({ queryKey: ['liliesByTag'] });
      queryClient.invalidateQueries({ queryKey: ['topTags'] });
      queryClient.invalidateQueries({ queryKey: ['trendingTags'] });
      queryClient.invalidateQueries({ queryKey: ['newestTags'] });
    },
  });
}

// Tag Canonical and Redirects
export function useGetCanonicalTag(tag: string) {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ['canonicalTag', tag],
    queryFn: async () => {
      if (!actor) return tag;
      return actor.getCanonicalTagForTag(tag);
    },
    enabled: !!actor && !isFetching && !!tag,
  });
}

export function useGetTagRedirects() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, string]>>({
    queryKey: ['tagRedirects'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTagRedirects();
    },
    enabled: !!actor && !isFetching,
  });
}

// Username Change
export function useRecordUsernameChange() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordUsernameChange(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}
