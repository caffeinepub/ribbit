import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Pond, Post, Ribbit, UserProfile, Activity } from '@/backend';
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
      title, 
      description, 
      image, 
      profileImage,
      bannerImage,
      froggyPhrase 
    }: { 
      name: string; 
      title: string; 
      description: string; 
      image: ExternalBlob; 
      profileImage: ExternalBlob;
      bannerImage: ExternalBlob;
      froggyPhrase: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.createPond(name, title, description, image, profileImage, bannerImage, froggyPhrase);
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

// Tag Merging (Admin only)
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
      queryClient.invalidateQueries({ queryKey: ['lilies'] });
      queryClient.invalidateQueries({ queryKey: ['tagSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['tagRedirects'] });
      queryClient.invalidateQueries({ queryKey: ['liliesByTag'] });
    },
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

// Ribbits - Using threaded ribbits
export function useGetRibbits(lilyId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Ribbit[]>({
    queryKey: ['ribbits', lilyId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getThreadedRibbits(lilyId);
    },
    enabled: !!actor && !isFetching && !!lilyId,
  });
}

export function useGetRibbitCount(lilyId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['ribbitCount', lilyId],
    queryFn: async () => {
      if (!actor) return 0;
      const count = await actor.getRibbitCountForPost(lilyId);
      return Number(count);
    },
    enabled: !!actor && !isFetching && !!lilyId,
  });
}

export function useGetViewCount(lilyId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['viewCount', lilyId],
    queryFn: async () => {
      if (!actor) return 0;
      const count = await actor.getViewCountForPost(lilyId);
      return Number(count);
    },
    enabled: !!actor && !isFetching && !!lilyId,
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
      username 
    }: { 
      postId: string; 
      parentId?: string | null; 
      content: string; 
      username: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createRibbit(postId, parentId || null, content, username);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ribbits', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['ribbitCount', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['recentActivities'] });
    },
  });
}

// View Count Increment Mutation
export function useIncrementLilyViewCount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not initialized');
      const result = await actor.incrementLilyViewCount(postId);
      return { postId, result };
    },
    onSuccess: ({ postId, result }) => {
      // Only invalidate queries if the increment was successful
      if (result === ViewIncrementResult.success) {
        queryClient.invalidateQueries({ queryKey: ['viewCount', postId] });
        queryClient.invalidateQueries({ queryKey: ['lily', postId] });
      }
      // Return result for caller to handle
      return result;
    },
    // Don't throw on error - let the page continue loading
    onError: (error) => {
      console.error('Failed to increment view count:', error);
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
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Username Availability
export function useCheckUsernameAvailability(username: string, currentUsername: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['usernameAvailable', username],
    queryFn: async () => {
      if (!actor) return true;
      // If checking current username, it's always available
      if (username === currentUsername) return true;
      return actor.isUsernameAvailable(username);
    },
    enabled: !!actor && !isFetching && !!username && username !== currentUsername,
    staleTime: 0, // Always check freshness for username availability
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
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useReleaseUsername() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.releaseUsername(username);
    },
  });
}

// Username Change Cooldown
export function useCanChangeUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['canChangeUsername', username],
    queryFn: async () => {
      if (!actor) return true;
      return actor.canChangeUsername(username);
    },
    enabled: !!actor && !isFetching && !!username,
    staleTime: 0, // Always check freshness for cooldown status
  });
}

export function useRecordUsernameChange() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.recordUsernameChange(username);
    },
  });
}

// Username-based Avatar Functions
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

export function useSaveAvatarByUsername() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, avatar }: { username: string; avatar: ExternalBlob }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.saveAvatarByUsername(username, avatar);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userAvatar', variables.username] });
    },
  });
}

// Recent Activity Functions
export function useGetAllRecentActivities(limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<Activity[]>({
    queryKey: ['recentActivities', limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRecentActivities(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
}

export function useGetRecentPosts(limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<Activity[]>({
    queryKey: ['recentPosts', limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentPosts(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
}

export function useGetRecentRibbits(limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<Activity[]>({
    queryKey: ['recentRibbits', limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentRibbits(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
}

export function useGetRecentlyLikedPosts(limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<Activity[]>({
    queryKey: ['recentlyLikedPosts', limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentlyLikedPosts(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
}
