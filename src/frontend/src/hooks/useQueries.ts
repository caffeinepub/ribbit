import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Post, Pond, Ribbit, UserProfile, Activity, TagStats } from '@/backend';
import { ExternalBlob } from '@/backend';

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

  return useQuery({
    queryKey: ['pondAbout', pondName],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPondAboutInfo(pondName);
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
      return actor.joinPond(pondName);
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
      return actor.leavePond(pondName);
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
      return actor.getJoinedPonds();
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
      return actor.listPosts();
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

export function useGetPost(id: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Post | null>({
    queryKey: ['post', id],
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
      return actor.createPost(
        params.title,
        params.content,
        params.image,
        params.link,
        params.pond,
        params.username,
        params.tag
      );
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
      return actor.createPost(
        params.title,
        params.content,
        params.image,
        params.link,
        params.pond,
        params.username,
        params.tag
      );
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
      return actor.searchPosts(searchTerm);
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
      return actor.getLiliesByTag(tag, sortBy);
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
      return actor.getPostLikeCount(postId);
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

export function useGetViewCount(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['viewCount', postId],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getViewCountForPost(postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

export function useGetRibbitCount(postId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['ribbitCount', postId],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getRibbitCountForPost(postId);
    },
    enabled: !!actor && !isFetching && !!postId,
  });
}

// Ribbit queries
export function useGetRibbits(postId: string, sortBy: string = 'top') {
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

export function useGetThreadedRibbits(postId: string, sortBy: string) {
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
    mutationFn: async (params: {
      postId: string;
      parentId: string | null;
      content: string;
      username: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createRibbit(
        params.postId,
        params.parentId,
        params.content,
        params.username
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ribbits', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['ribbitCount', variables.postId] });
    },
  });
}

// Like queries for ribbits
export function useGetRibbitLikeCount(ribbitId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['ribbitLikeCount', ribbitId],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getRibbitLikeCount(ribbitId);
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

// User profile queries
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
      queryClient.invalidateQueries({ queryKey: ['userAvatar'] });
    },
  });
}

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

// Username queries
export function useIsUsernameAvailable(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['usernameAvailable', username],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isUsernameAvailable(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useRegisterUsername() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerUsername(username);
    },
  });
}

export function useReleaseUsername() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.releaseUsername(username);
    },
  });
}

export function useCanChangeUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['canChangeUsername', username],
    queryFn: async () => {
      if (!actor) return false;
      return actor.canChangeUsername(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useRecordUsernameChange() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordUsernameChange(username);
    },
  });
}

// Admin queries
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
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['lilies'] });
      queryClient.invalidateQueries({ queryKey: ['tagRedirects'] });
    },
  });
}

export function useGetTagRedirects() {
  const { actor, isFetching } = useActor();

  return useQuery<[string, string][]>({
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

// Tag queries
export function useGetTagSuggestions(prefix: string, limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['tagSuggestions', prefix, limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTagSuggestions(prefix, BigInt(limit));
    },
    enabled: !!actor && !isFetching && !!prefix,
  });
}

export function useGetTopTags(limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<[string, TagStats][]>({
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

  return useQuery<[string, TagStats][]>({
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

  return useQuery<[string, TagStats][]>({
    queryKey: ['newestTags', limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNewestTags(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

// Activity queries
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

// View count mutation
export function useIncrementViewCount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.incrementLilyViewCount(postId);
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['lily', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['viewCount', postId] });
    },
  });
}

// Profile page queries
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
    queryKey: ['userPosts', username],
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
    queryKey: ['userRibbits', username],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRibbitsByUsername(username);
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

// Search queries (placeholder implementations - backend doesn't have these yet)
export function useGetTrendingSearches(limit: number = 10) {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['trendingSearches', limit],
    queryFn: async () => {
      // Placeholder: return empty array since backend doesn't have this
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
      // Placeholder: return empty array since backend doesn't have this
      return [];
    },
    enabled: !!actor && !isFetching && !!query,
  });
}

export function useRecordSearchTerm() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (searchTerm: string) => {
      // Placeholder: no-op since backend doesn't have this
      return;
    },
  });
}

// Placeholder for useGetUserProfiles (not in backend, but used in components)
// Note: This accepts Principal[] but backend doesn't have batch profile fetch
export function useGetUserProfiles(principals: any[]) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile[]>({
    queryKey: ['userProfiles', principals],
    queryFn: async () => {
      // Placeholder: return empty array since backend doesn't have batch profile fetch
      return [];
    },
    enabled: !!actor && !isFetching && principals.length > 0,
  });
}
