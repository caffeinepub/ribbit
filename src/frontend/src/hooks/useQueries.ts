import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Pond, Post, Ribbit, UserProfile, Activity, TagStats } from '@/backend';
import { ExternalBlob, ViewIncrementResult } from '@/backend';
import type { Principal } from '@icp-sdk/core/principal';

// Ponds
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

export function useGetPondAboutInfo(name: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['pondAbout', name],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPondAboutInfo(name);
    },
    enabled: !!actor && !isFetching && !!name,
  });
}

export function useGetUserProfiles(principals: Principal[]) {
  const { actor, isFetching } = useActor();

  return useQuery<(UserProfile | null)[]>({
    queryKey: ['userProfiles', principals.map(p => p.toString())],
    queryFn: async () => {
      if (!actor || principals.length === 0) return [];
      const profiles = await Promise.all(
        principals.map(principal => actor.getUserProfile(principal))
      );
      return profiles;
    },
    enabled: !!actor && !isFetching && principals.length > 0,
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
      froggyPhrase 
    }: { 
      name: string;
      description: string; 
      image: ExternalBlob; 
      profileImage: ExternalBlob;
      bannerImage: ExternalBlob;
      froggyPhrase: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.createPond(name, description, image, profileImage, bannerImage, froggyPhrase);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
      queryClient.invalidateQueries({ queryKey: ['joinedPonds'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useSearchPonds(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Pond[]>({
    queryKey: ['ponds', 'search', searchTerm],
    queryFn: async () => {
      if (!actor || !searchTerm) return [];
      return actor.searchPonds(searchTerm);
    },
    enabled: !!actor && !isFetching && !!searchTerm,
  });
}

// Pond Membership
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

export function useJoinPond() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pondName: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.joinPond(pondName);
    },
    onSuccess: (_, pondName) => {
      queryClient.invalidateQueries({ queryKey: ['joinedPonds'] });
      queryClient.invalidateQueries({ queryKey: ['pond', pondName] });
      queryClient.invalidateQueries({ queryKey: ['pondAbout', pondName] });
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useLeavePond() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pondName: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.leavePond(pondName);
    },
    onSuccess: (_, pondName) => {
      queryClient.invalidateQueries({ queryKey: ['joinedPonds'] });
      queryClient.invalidateQueries({ queryKey: ['pond', pondName] });
      queryClient.invalidateQueries({ queryKey: ['pondAbout', pondName] });
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Check if current user is pond admin
export function useIsPondAdmin(pondName: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isPondAdmin', pondName],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isPondAdmin(pondName);
    },
    enabled: !!actor && !isFetching && !!pondName,
  });
}

// Lilies (Posts)
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
      tag?: string | null;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createPost(title, content, image, link, pond, username, tag || null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lilies'] });
      queryClient.invalidateQueries({ queryKey: ['tagSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivities'] });
      queryClient.invalidateQueries({ queryKey: ['topTags'] });
      queryClient.invalidateQueries({ queryKey: ['trendingTags'] });
      queryClient.invalidateQueries({ queryKey: ['newestTags'] });
    },
  });
}

export function useSearchLilies(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['lilies', 'search', searchTerm],
    queryFn: async () => {
      if (!actor || !searchTerm) return [];
      return actor.searchPosts(searchTerm);
    },
    enabled: !!actor && !isFetching && !!searchTerm,
  });
}

// Like Functions for Posts
export function useGetPostLikeCount(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['postLikeCount', postId],
    queryFn: async () => {
      if (!actor) return 0;
      const count = await actor.getPostLikeCount(postId);
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
      if (!actor) throw new Error('Actor not initialized');
      await actor.likePost(postId);
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['postLikeCount', postId] });
      queryClient.invalidateQueries({ queryKey: ['hasUserLikedPost', postId] });
      queryClient.invalidateQueries({ queryKey: ['lily', postId] });
      queryClient.invalidateQueries({ queryKey: ['recentActivities'] });
    },
  });
}

export function useUnlikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.unlikePost(postId);
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['postLikeCount', postId] });
      queryClient.invalidateQueries({ queryKey: ['hasUserLikedPost', postId] });
      queryClient.invalidateQueries({ queryKey: ['lily', postId] });
      queryClient.invalidateQueries({ queryKey: ['recentActivities'] });
    },
  });
}

// Like Functions for Ribbits
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
      if (!actor) throw new Error('Actor not initialized');
      await actor.likeRibbit(ribbitId);
    },
    onSuccess: (_, ribbitId) => {
      queryClient.invalidateQueries({ queryKey: ['ribbitLikeCount', ribbitId] });
      queryClient.invalidateQueries({ queryKey: ['hasUserLikedRibbit', ribbitId] });
      queryClient.invalidateQueries({ queryKey: ['recentActivities'] });
    },
  });
}

export function useUnlikeRibbit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ribbitId: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.unlikeRibbit(ribbitId);
    },
    onSuccess: (_, ribbitId) => {
      queryClient.invalidateQueries({ queryKey: ['ribbitLikeCount', ribbitId] });
      queryClient.invalidateQueries({ queryKey: ['hasUserLikedRibbit', ribbitId] });
      queryClient.invalidateQueries({ queryKey: ['recentActivities'] });
    },
  });
}

// Tag Suggestions
export function useGetTagSuggestions(prefix: string, limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['tagSuggestions', prefix, limit],
    queryFn: async () => {
      if (!actor || !prefix.trim()) return [];
      return actor.getTagSuggestions(prefix, BigInt(limit));
    },
    enabled: !!actor && !isFetching && !!prefix.trim(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Search History Functions
export function useGetTrendingSearches(limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['trendingSearches', limit],
    queryFn: async () => {
      if (!actor) return [];
      // TODO: Replace with actual backend call when available
      // return actor.getTrendingSearches(BigInt(limit));
      return [];
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000, // Cache for 1 minute
  });
}

export function useGetSearchSuggestions(prefix: string, limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['searchSuggestions', prefix, limit],
    queryFn: async () => {
      if (!actor || !prefix.trim()) return [];
      // TODO: Replace with actual backend call when available
      // return actor.getSearchSuggestions(prefix, BigInt(limit));
      return [];
    },
    enabled: !!actor && !isFetching && !!prefix.trim(),
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
}

export function useRecordSearchTerm() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (term: string) => {
      if (!actor) throw new Error('Actor not initialized');
      // TODO: Replace with actual backend call when available
      // await actor.recordSearchTerm(term);
      console.log('Recording search term:', term);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trendingSearches'] });
      queryClient.invalidateQueries({ queryKey: ['searchSuggestions'] });
    },
  });
}

// Tag Pages
export function useGetLiliesByTag(tag: string, sortBy: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['liliesByTag', tag, sortBy],
    queryFn: async () => {
      if (!actor || !tag) return [];
      return actor.getLiliesByTag(tag, sortBy);
    },
    enabled: !!actor && !isFetching && !!tag,
  });
}

// Get canonical tag
export function useGetCanonicalTag(tag: string) {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ['canonicalTag', tag],
    queryFn: async () => {
      if (!actor || !tag) return tag;
      return actor.getCanonicalTagForTag(tag);
    },
    enabled: !!actor && !isFetching && !!tag,
  });
}

// Tag Ranking Queries
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

export function useGetTagStats(tag: string) {
  const { actor, isFetching } = useActor();

  return useQuery<TagStats | null>({
    queryKey: ['tagStats', tag],
    queryFn: async () => {
      if (!actor || !tag) return null;
      return actor.getTagStatsForTag(tag);
    },
    enabled: !!actor && !isFetching && !!tag,
  });
}

export function useGetTagRank(tag: string) {
  const { actor, isFetching } = useActor();

  return useQuery<{ tag: string; rank?: bigint; canonicalTag: string } | null>({
    queryKey: ['tagRank', tag],
    queryFn: async () => {
      if (!actor || !tag) return null;
      return actor.getTagRank(tag);
    },
    enabled: !!actor && !isFetching && !!tag,
  });
}

// Get tag redirects
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

// Ribbits
export function useGetRibbits(postId: string, sortBy: 'top' | 'newest' = 'top') {
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
    }: {
      postId: string;
      parentId: string | null;
      content: string;
      username: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createRibbit(postId, parentId, content, username);
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['ribbits', postId] });
      queryClient.invalidateQueries({ queryKey: ['ribbitCount', postId] });
      queryClient.invalidateQueries({ queryKey: ['recentActivities'] });
      queryClient.invalidateQueries({ queryKey: ['tagStats'] });
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
      if (!actor) throw new Error('Actor not initialized');
      return actor.incrementLilyViewCount(postId);
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['viewCount', postId] });
      queryClient.invalidateQueries({ queryKey: ['lily', postId] });
    },
  });
}

// User Profile
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

  // Return custom state that properly reflects actor dependency
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
      if (!actor) throw new Error('Actor not initialized');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Username Registry
export function useIsUsernameAvailable(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['usernameAvailable', username],
    queryFn: async () => {
      if (!actor || !username) return false;
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
      if (!actor) throw new Error('Actor not initialized');
      await actor.registerUsername(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usernameAvailable'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useReleaseUsername() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.releaseUsername(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usernameAvailable'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useCanChangeUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['canChangeUsername', username],
    queryFn: async () => {
      if (!actor || !username) return false;
      return actor.canChangeUsername(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useRecordUsernameChange() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.recordUsernameChange(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canChangeUsername'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Get user avatar by username
export function useGetUserAvatarByUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ExternalBlob | null>({
    queryKey: ['userAvatar', username],
    queryFn: async () => {
      if (!actor || !username) return null;
      return actor.getUserAvatarByUsername(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

// Recent Activities
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

// Profile page queries
export function useGetUserProfileByUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfileByUsername', username],
    queryFn: async () => {
      if (!actor || !username) return null;
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
      if (!actor || !username) return [];
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
      if (!actor || !username) return [];
      return actor.getRibbitsByUsername(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

// Admin functions
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
      if (!actor) throw new Error('Actor not initialized');
      await actor.mergeSimilarTags();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tagSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['topTags'] });
      queryClient.invalidateQueries({ queryKey: ['trendingTags'] });
      queryClient.invalidateQueries({ queryKey: ['newestTags'] });
      queryClient.invalidateQueries({ queryKey: ['tagRedirects'] });
      queryClient.invalidateQueries({ queryKey: ['canonicalTag'] });
    },
  });
}
