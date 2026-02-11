import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Post, Pond, Ribbit, UserProfile, UserRole } from '@/backend';
import type { Activity, TagStats } from '@/lib/types';
import { ExternalBlob } from '@/backend';
import type { Principal } from '@icp-sdk/core/principal';
import { getPhraseHashUserId } from '@/lib/user';

// Pond queries
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

export function useGetPondAboutInfo(pondName: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Pond | null>({
    queryKey: ['pondAbout', pondName],
    queryFn: async () => {
      if (!actor) return null;
      // Use getPond as fallback since getPondAboutInfo doesn't exist
      return actor.getPond(pondName);
    },
    enabled: !!actor && !isFetching && !!pondName,
  });
}

export function useCreatePond() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      description: string;
      image: ExternalBlob;
      profileImage: ExternalBlob;
      bannerImage: ExternalBlob;
      froggyPhrase: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPond(
        params.name,
        params.description,
        params.image,
        params.profileImage,
        params.bannerImage,
        params.froggyPhrase
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useJoinPond() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pondName: string) => {
      if (!actor) throw new Error('Actor not available');
      // Backend methods not implemented yet
      throw new Error('Join pond functionality not yet implemented');
    },
    onSuccess: (_, pondName) => {
      queryClient.invalidateQueries({ queryKey: ['pond', pondName] });
      queryClient.invalidateQueries({ queryKey: ['joinedPonds'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useLeavePond() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pondName: string) => {
      if (!actor) throw new Error('Actor not available');
      // Backend methods not implemented yet
      throw new Error('Leave pond functionality not yet implemented');
    },
    onSuccess: (_, pondName) => {
      queryClient.invalidateQueries({ queryKey: ['pond', pondName] });
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
      // Backend method not implemented yet
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

// Post/Lily queries (using "Lily" naming for frontend)
export function useGetAllLilies() {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['lilies'],
    queryFn: async () => {
      if (!actor) return [];
      // Backend method not implemented yet
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: async () => {
      if (!actor) return [];
      // Backend method not implemented yet
      return [];
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
      // Backend method not implemented yet
      return null;
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useGetPost(id: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Post | null>({
    queryKey: ['post', id],
    queryFn: async () => {
      if (!actor) return null;
      // Backend method not implemented yet
      return null;
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useCreateLily() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      content: string;
      image: ExternalBlob | null;
      link: string | null;
      pond: string;
      username: string;
      tag: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend method not implemented yet
      throw new Error('Create lily functionality not yet implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lilies'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      content: string;
      image: ExternalBlob | null;
      link: string | null;
      pond: string;
      username: string;
      tag: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend method not implemented yet
      throw new Error('Create post functionality not yet implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useSearchLilies(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['searchLilies', searchTerm],
    queryFn: async () => {
      if (!actor) return [];
      // Backend method not implemented yet
      return [];
    },
    enabled: !!actor && !isFetching && !!searchTerm,
  });
}

export function useGetLiliesByTag(tag: string, sortBy: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['liliesByTag', tag, sortBy],
    queryFn: async () => {
      if (!actor) return [];
      // Backend method not implemented yet
      return [];
    },
    enabled: !!actor && !isFetching && !!tag,
  });
}

// Like queries for posts/lilies
export function useGetPostLikeCount(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['postLikeCount', postId],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      // Backend method not implemented yet
      return BigInt(0);
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
      // Backend method not implemented yet
      return false;
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
      // Backend method not implemented yet
      throw new Error('Like post functionality not yet implemented');
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
      // Backend method not implemented yet
      throw new Error('Unlike post functionality not yet implemented');
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['postLikeCount', postId] });
      queryClient.invalidateQueries({ queryKey: ['hasUserLikedPost', postId] });
    },
  });
}

// View count queries
export function useGetViewCount(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['viewCount', postId],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      // Backend method not implemented yet
      return BigInt(0);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useGetViewCountForPost(postId: string) {
  return useGetViewCount(postId);
}

// Ribbit count queries
export function useGetRibbitCount(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['ribbitCount', postId],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      // Backend method not implemented yet
      return BigInt(0);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useGetRibbitCountForPost(postId: string) {
  return useGetRibbitCount(postId);
}

// Ribbit/Comment queries
export function useGetRibbits(postId: string, sortBy: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Ribbit[]>({
    queryKey: ['ribbits', postId, sortBy],
    queryFn: async () => {
      if (!actor) return [];
      // Backend method not implemented yet
      return [];
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useGetThreadedRibbits(postId: string, sortBy: string) {
  return useGetRibbits(postId, sortBy);
}

export function useGetThreadedComments(postId: string, sortBy: string) {
  return useGetRibbits(postId, sortBy);
}

export function useCreateRibbit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      postId: string;
      parentId: string | null;
      content: string;
      username: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend method not implemented yet
      throw new Error('Create ribbit functionality not yet implemented');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ribbits', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['ribbitCount', variables.postId] });
    },
  });
}

// Ribbit like queries
export function useGetRibbitLikeCount(ribbitId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['ribbitLikeCount', ribbitId],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      // Backend method not implemented yet
      return BigInt(0);
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
      // Backend method not implemented yet
      return false;
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
      // Backend method not implemented yet
      throw new Error('Like ribbit functionality not yet implemented');
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
      // Backend method not implemented yet
      throw new Error('Unlike ribbit functionality not yet implemented');
    },
    onSuccess: (_, ribbitId) => {
      queryClient.invalidateQueries({ queryKey: ['ribbitLikeCount', ribbitId] });
      queryClient.invalidateQueries({ queryKey: ['hasUserLikedRibbit', ribbitId] });
    },
  });
}

// User profile queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const userId = await getPhraseHashUserId();
      
      if (userId !== '') {
        return actor.getUserProfileByPhraseHash(userId);
      } else {
        return actor.getCallerUserProfile();
      }
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

export function useGetUserProfile(user: Principal) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', user.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserProfile(user);
    },
    enabled: !!actor && !isFetching,
  });
}

// Batch user profiles query
export function useGetUserProfiles(users: Principal[]) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['userProfiles', users.map(u => u.toString())],
    queryFn: async () => {
      if (!actor) return [];
      // Fetch all profiles in parallel
      const profiles = await Promise.all(
        users.map(user => actor.getUserProfile(user))
      );
      // Filter out nulls
      return profiles.filter((p): p is UserProfile => p !== null);
    },
    enabled: !!actor && !isFetching && users.length > 0,
  });
}

export function useGetUserProfileByUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfileByUsername', username],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserProfileByUsername(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      const userId = await getPhraseHashUserId();
      
      if (userId !== '') {
        return actor.saveUserProfileByPhraseHash(userId, profile);
      } else {
        return actor.saveCallerUserProfile(profile);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Alias for backwards compatibility
export function useSaveCallerUserProfile() {
  return useSaveUserProfile();
}

export function useGetUserAvatarByUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ExternalBlob | null>({
    queryKey: ['userAvatar', username],
    queryFn: async () => {
      if (!actor) return null;
      // Backend method not implemented yet
      return null;
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

// Username management
export function useIsUsernameAvailable(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['usernameAvailable', username],
    queryFn: async () => {
      if (!actor) return false;
      const userId = await getPhraseHashUserId();
      
      if (userId !== '') {
        return actor.isUsernameAvailableByPhraseHash(userId, username);
      } else {
        return actor.isUsernameAvailable(username);
      }
    },
    enabled: !!actor && !isFetching && !!username && username.length > 0,
  });
}

export function useRegisterUsername() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not available');
      const userId = await getPhraseHashUserId();
      
      if (userId !== '') {
        return actor.registerUsernameWithPhraseHash(userId, username);
      } else {
        return actor.registerUsername(username);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['usernameAvailable'] });
    },
  });
}

export function useReleaseUsername() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not available');
      const userId = await getPhraseHashUserId();
      
      if (userId !== '') {
        return actor.releaseUsernameWithPhraseHash(userId, username);
      } else {
        return actor.releaseUsername(username);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['usernameAvailable'] });
    },
  });
}

export function useCanChangeUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['canChangeUsername', username],
    queryFn: async () => {
      if (!actor) return false;
      const userId = await getPhraseHashUserId();
      
      if (userId !== '') {
        return actor.canChangeUsernameByPhraseHash(userId, username);
      } else {
        return actor.canChangeUsername(username);
      }
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useRecordUsernameChange() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not available');
      const userId = await getPhraseHashUserId();
      
      if (userId !== '') {
        return actor.recordUsernameChangeByPhraseHash(userId, username);
      } else {
        return actor.recordUsernameChange(username);
      }
    },
  });
}

// Access control queries
export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['callerUserRole'],
    queryFn: async () => {
      if (!actor) return 'guest' as UserRole;
      const userId = await getPhraseHashUserId();
      
      if (userId !== '') {
        return actor.getUserRoleByPhraseHash(userId);
      } else {
        return actor.getCallerUserRole();
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      const userId = await getPhraseHashUserId();
      
      if (userId !== '') {
        return actor.isUserAdminByPhraseHash(userId);
      } else {
        return actor.isCallerAdmin();
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  return useIsAdmin();
}

// View count increment
export function useIncrementLilyViewCount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.incrementLilyViewCount(postId);
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['lily', postId] });
      queryClient.invalidateQueries({ queryKey: ['viewCount', postId] });
    },
  });
}

// Activity queries
export function useGetRecentActivities(limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<Activity[]>({
    queryKey: ['recentActivities', limit],
    queryFn: async () => {
      if (!actor) return [];
      // Backend method not implemented yet
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

// Tag queries
export function useGetTopTags(limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, TagStats]>>({
    queryKey: ['topTags', limit],
    queryFn: async () => {
      if (!actor) return [];
      // Backend method not implemented yet
      return [];
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
      // Backend method not implemented yet
      return [];
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
      // Backend method not implemented yet
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTagStatsForTag(tag: string) {
  const { actor, isFetching } = useActor();

  return useQuery<TagStats | null>({
    queryKey: ['tagStats', tag],
    queryFn: async () => {
      if (!actor) return null;
      // Backend method not implemented yet
      return null;
    },
    enabled: !!actor && !isFetching && !!tag,
  });
}

export function useGetTagSuggestions(prefix?: string, limit: number = 5) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['tagSuggestions', prefix, limit],
    queryFn: async () => {
      if (!actor) return [];
      // Backend method not implemented yet
      return [];
    },
    enabled: !!actor && !isFetching && !!prefix && prefix.length > 0,
  });
}

export function useGetTagSubcategories(tag: string) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['subcategories', tag],
    queryFn: async () => {
      if (!actor) return [];
      // Backend method not implemented yet
      return [];
    },
    enabled: !!actor && !isFetching && !!tag,
  });
}

export function useGetSubcategoriesForTag(tag: string) {
  return useGetTagSubcategories(tag);
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

export function useMergeSimilarTags() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.mergeSimilarTags();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tagRedirects'] });
      queryClient.invalidateQueries({ queryKey: ['topTags'] });
      queryClient.invalidateQueries({ queryKey: ['trendingTags'] });
      queryClient.invalidateQueries({ queryKey: ['newestTags'] });
    },
  });
}

// Search queries (placeholder - not implemented in backend)
export function useRecordSearchTerm() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (searchTerm: string) => {
      if (!actor) throw new Error('Actor not available');
      // Backend method not implemented yet
      console.log('Search term recorded (placeholder):', searchTerm);
    },
  });
}

export function useGetSearchSuggestions(query?: string) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['searchSuggestions', query],
    queryFn: async () => {
      if (!actor) return [];
      // Backend method not implemented yet
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTrendingSearches() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['trendingSearches'],
    queryFn: async () => {
      if (!actor) return [];
      // Backend method not implemented yet
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}
