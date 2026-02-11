import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getUsername, setUsername, getPreviousUsername, getFroggyPhrase } from '@/lib/user';
import { useIsUsernameAvailable, useRegisterUsername, useReleaseUsername, useCanChangeUsername, useRecordUsernameChange, useGetJoinedPonds, useGetAllPonds, useIsAdmin, useMergeSimilarTags, useGetTagRedirects, useLeavePond, useGetCallerUserProfile, useSaveCallerUserProfile } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { Loader2, Copy, Check, AlertCircle, ArrowRight, LogOut, User, ImageIcon, Key, Waves, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ExternalBlob } from '@/backend';
import { compressImageFile, revokePreviewUrl } from '@/lib/imageCompression';

export default function UserSettingsPage() {
  const currentUsername = getUsername();
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [validationError, setValidationError] = useState('');
  const [debouncedUsername, setDebouncedUsername] = useState(currentUsername);
  
  // Controlled tab state
  const [activeTab, setActiveTab] = useState('username');
  
  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarCompressedBytes, setAvatarCompressedBytes] = useState<Uint8Array<ArrayBuffer> | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Froggy Phrase state (read-only)
  const [showPhrase, setShowPhrase] = useState(false);
  const [copied, setCopied] = useState(false);
  const existingPhrase = getFroggyPhrase();

  const registerUsername = useRegisterUsername();
  const releaseUsername = useReleaseUsername();
  const recordUsernameChange = useRecordUsernameChange();
  const queryClient = useQueryClient();

  // User profile data
  const { data: userProfile, isLoading: isLoadingProfile, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  // Joined ponds data
  const { data: joinedPondNames, isLoading: isLoadingJoined } = useGetJoinedPonds();
  const { data: allPonds, isLoading: isLoadingAllPonds } = useGetAllPonds();
  const leavePondMutation = useLeavePond();

  // Admin features
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();
  const mergeTags = useMergeSimilarTags();
  const { data: tagRedirects, isLoading: isLoadingRedirects } = useGetTagRedirects();

  // Filter ponds to get full pond objects for joined ponds
  const joinedPonds = allPonds?.filter(pond => joinedPondNames?.includes(pond.name)) || [];

  // Check if user can change username (24-hour cooldown)
  const { data: canChange, isLoading: checkingCooldown } = useCanChangeUsername(currentUsername);

  // Debounce username input for availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(newUsername);
    }, 500);

    return () => clearTimeout(timer);
  }, [newUsername]);

  // Check username availability (only check if different from current username)
  const shouldCheckAvailability = debouncedUsername !== currentUsername && debouncedUsername.trim() !== '';
  const { data: isAvailable, isLoading: checkingAvailability } = useIsUsernameAvailable(
    shouldCheckAvailability ? debouncedUsername : ''
  );

  // Cleanup avatar preview on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        revokePreviewUrl(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const validateUsername = (username: string): boolean => {
    const lowerUsername = username.toLowerCase();
    const isValid = lowerUsername.includes('frog') || 
                    lowerUsername.includes('toad') || 
                    lowerUsername.includes('tadpole');
    
    if (!isValid) {
      setValidationError('Username must include frog, toad, or tadpole.');
      return false;
    }
    
    // Check availability after format validation
    if (username !== currentUsername && debouncedUsername === username) {
      if (checkingAvailability) {
        setValidationError('');
        return false;
      }
      if (isAvailable === false) {
        setValidationError('Username already taken');
        return false;
      }
    }
    
    setValidationError('');
    return true;
  };

  const handleUsernameChange = (value: string) => {
    setNewUsername(value);
    if (value.trim()) {
      // Only validate format immediately, availability will be checked after debounce
      const lowerUsername = value.toLowerCase();
      const isValidFormat = lowerUsername.includes('frog') || 
                           lowerUsername.includes('toad') || 
                           lowerUsername.includes('tadpole');
      
      if (!isValidFormat) {
        setValidationError('Username must include frog, toad, or tadpole.');
      } else {
        setValidationError('');
      }
    } else {
      setValidationError('');
    }
  };

  // Re-validate when availability check completes
  useEffect(() => {
    if (newUsername.trim() && debouncedUsername === newUsername && newUsername !== currentUsername) {
      validateUsername(newUsername);
    }
  }, [isAvailable, checkingAvailability, debouncedUsername, newUsername, currentUsername]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clean up previous preview
    if (avatarPreview) {
      revokePreviewUrl(avatarPreview);
    }

    try {
      const result = await compressImageFile(file);
      
      setAvatarFile(file);
      setAvatarCompressedBytes(result.bytes);
      setAvatarPreview(result.previewUrl);

      if (result.wasCompressed) {
        const savedPercent = Math.round((1 - result.compressedSize / result.originalSize) * 100);
        if (savedPercent > 0) {
          toast.success(`Avatar compressed (saved ${savedPercent}%)`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process avatar';
      toast.error(errorMessage);
      setAvatarFile(null);
      setAvatarCompressedBytes(null);
      setAvatarPreview(null);
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarCompressedBytes) {
      toast.error('Please select an avatar image');
      return;
    }

    try {
      setUploadProgress(0);
      const avatarBlob = ExternalBlob.fromBytes(avatarCompressedBytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      // Save avatar through user profile
      const currentProfile = userProfile || {
        name: currentUsername,
        joinedPonds: [],
        avatar: undefined,
      };

      await saveProfile.mutateAsync({
        ...currentProfile,
        avatar: avatarBlob,
      });

      toast.success('Avatar updated successfully!');
      
      // Invalidate queries to refresh avatar display
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userAvatar', currentUsername] });
      
      setAvatarFile(null);
      setAvatarCompressedBytes(null);
      if (avatarPreview) {
        revokePreviewUrl(avatarPreview);
      }
      setAvatarPreview(null);
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Error saving avatar:', error);
      toast.error('Failed to save avatar. Please try again.');
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (!newUsername.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    if (!validateUsername(newUsername)) {
      return;
    }

    if (newUsername === currentUsername) {
      toast.info('Username unchanged');
      return;
    }

    // Check 24-hour cooldown
    if (canChange === false) {
      setValidationError('You can only change your username once every 24 hours.');
      toast.error('You can only change your username once every 24 hours.');
      return;
    }

    try {
      // Release old username and register new one
      const previousUsername = getPreviousUsername();
      if (previousUsername) {
        await releaseUsername.mutateAsync(previousUsername);
      }
      
      await registerUsername.mutateAsync(newUsername);
      await recordUsernameChange.mutateAsync(newUsername);
      setUsername(newUsername);
      
      // Update user profile with new username to maintain consistency
      if (userProfile) {
        await saveProfile.mutateAsync({
          ...userProfile,
          name: newUsername,
        });
      }
      
      toast.success('Username updated successfully!');
    } catch (error: any) {
      console.error('Error updating username:', error);
      if (error.message?.includes('already taken')) {
        setValidationError('Username already taken');
        toast.error('Username already taken');
      } else if (error.message?.includes('24 hours')) {
        setValidationError('You can only change your username once every 24 hours.');
        toast.error('You can only change your username once every 24 hours.');
      } else {
        toast.error('Failed to update username. Please try again.');
      }
    }
  };

  const handleCopyPhrase = () => {
    if (existingPhrase) {
      navigator.clipboard.writeText(existingPhrase);
      setCopied(true);
      toast.success('Froggy Phrase copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeavePond = async (pondName: string) => {
    try {
      await leavePondMutation.mutateAsync(pondName);
      toast.success(`Left ${pondName} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['joinedPonds'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    } catch (error: any) {
      console.error('Error leaving pond:', error);
      toast.error('Failed to leave pond. Please try again.');
    }
  };

  const handleMergeTags = async () => {
    try {
      await mergeTags.mutateAsync();
      toast.success('Similar tags merged successfully!');
      queryClient.invalidateQueries({ queryKey: ['tagRedirects'] });
    } catch (error: any) {
      console.error('Error merging tags:', error);
      toast.error('Failed to merge tags. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Desktop: Vertical Tabs */}
        <div className="hidden md:block">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex gap-8">
            <TabsList className="vertical-tabs-list">
              <TabsTrigger value="username" className="vertical-tabs-trigger">
                <User className="w-4 h-4 mr-2" />
                Username
              </TabsTrigger>
              <TabsTrigger value="avatar" className="vertical-tabs-trigger">
                <ImageIcon className="w-4 h-4 mr-2" />
                Avatar
              </TabsTrigger>
              <TabsTrigger value="froggy-phrase" className="vertical-tabs-trigger">
                <Key className="w-4 h-4 mr-2" />
                Froggy Phrase
              </TabsTrigger>
              <TabsTrigger value="ponds" className="vertical-tabs-trigger">
                <Waves className="w-4 h-4 mr-2" />
                Joined Ponds
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="vertical-tabs-trigger">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Admin Tools
                </TabsTrigger>
              )}
            </TabsList>

            <div className="flex-1">
              <TabsContent value="username" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Username</h2>
                    <p className="text-muted-foreground mb-6">
                      Your username must include frog, toad, or tadpole. You can change it once every 24 hours.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newUsername}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder="Enter your username"
                        className="mt-2"
                      />
                      {validationError && (
                        <p className="text-sm text-destructive mt-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {validationError}
                        </p>
                      )}
                      {checkingAvailability && debouncedUsername !== currentUsername && (
                        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Checking availability...
                        </p>
                      )}
                      {!checkingAvailability && isAvailable && debouncedUsername !== currentUsername && !validationError && (
                        <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Username available
                        </p>
                      )}
                    </div>

                    {canChange === false && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Cooldown Active</AlertTitle>
                        <AlertDescription>
                          You can only change your username once every 24 hours. Please try again later.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleSave}
                      disabled={
                        registerUsername.isPending ||
                        newUsername === currentUsername ||
                        !!validationError ||
                        checkingAvailability ||
                        checkingCooldown ||
                        canChange === false
                      }
                    >
                      {registerUsername.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Username'
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="avatar" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Avatar</h2>
                    <p className="text-muted-foreground mb-6">
                      Upload a profile picture to personalize your account.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Current Avatar Display */}
                    {userProfile?.avatar && !avatarPreview && (
                      <div>
                        <Label>Current Avatar</Label>
                        <div className="mt-2">
                          <Avatar className="w-24 h-24">
                            <AvatarImage src={userProfile.avatar.getDirectURL()} alt={currentUsername} />
                            <AvatarFallback>{currentUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    )}

                    {/* Avatar Preview */}
                    {avatarPreview && (
                      <div>
                        <Label>Preview</Label>
                        <div className="mt-2">
                          <Avatar className="w-24 h-24">
                            <AvatarImage src={avatarPreview} alt="Preview" />
                            <AvatarFallback>{currentUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="avatar-upload">Choose Avatar</Label>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="mt-2"
                      />
                    </div>

                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="space-y-2">
                        <Label>Upload Progress</Label>
                        <Progress value={uploadProgress} />
                        <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                      </div>
                    )}

                    <Button
                      onClick={handleSaveAvatar}
                      disabled={!avatarCompressedBytes || saveProfile.isPending || uploadProgress > 0}
                    >
                      {saveProfile.isPending || uploadProgress > 0 ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Save Avatar'
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="froggy-phrase" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Froggy Phrase</h2>
                    <p className="text-muted-foreground mb-6">
                      Your Froggy Phrase is a permanent 12-word identifier that was automatically generated when you first used Ribbit. 
                      It cannot be changed or removed once created.
                    </p>
                  </div>

                  {existingPhrase ? (
                    <div className="space-y-4">
                      <Alert>
                        <Key className="h-4 w-4" />
                        <AlertTitle>Permanent Phrase</AlertTitle>
                        <AlertDescription>
                          This phrase is permanent and cannot be changed. Keep it safe as a backup of your identity.
                        </AlertDescription>
                      </Alert>

                      <div>
                        <Label>Your Froggy Phrase</Label>
                        <div className="mt-2 p-4 bg-muted rounded-md font-mono text-sm relative">
                          {showPhrase ? existingPhrase : '•••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• ••••'}
                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowPhrase(!showPhrase)}
                            >
                              {showPhrase ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Reveal
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopyPhrase}
                              disabled={!showPhrase}
                            >
                              {copied ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Phrase Found</AlertTitle>
                      <AlertDescription>
                        A Froggy Phrase will be automatically generated for you.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ponds" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Joined Ponds</h2>
                    <p className="text-muted-foreground mb-6">
                      Manage the ponds you're a member of.
                    </p>
                  </div>

                  {isLoadingJoined || isLoadingAllPonds ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-9 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : joinedPonds.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Ponds Joined</AlertTitle>
                      <AlertDescription>
                        You haven't joined any ponds yet.{' '}
                        <Link to="/ponds" className="text-primary hover:underline">
                          Browse ponds
                        </Link>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {joinedPonds.map((pond) => (
                        <div
                          key={pond.name}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {pond.profileImage && (
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={pond.profileImage.getDirectURL()} alt={pond.name} />
                                <AvatarFallback>{pond.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              <Link
                                to="/pond/$name"
                                params={{ name: pond.name }}
                                className="font-semibold hover:underline"
                              >
                                {pond.name}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                {Number(pond.memberCount)} members · {Number(pond.lilyCount)} lilies
                              </p>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <LogOut className="w-4 h-4 mr-2" />
                                Leave
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Leave {pond.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to leave this pond? You can rejoin at any time.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleLeavePond(pond.name)}>
                                  Leave Pond
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="admin" className="mt-0">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold mb-4">Admin Tools</h2>
                      <p className="text-muted-foreground mb-6">
                        Administrative functions for managing the platform.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-2">Merge Similar Tags</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Automatically merge tags that are similar (e.g., plurals, hyphens, repeated letters).
                        </p>
                        <Button onClick={handleMergeTags} disabled={mergeTags.isPending}>
                          {mergeTags.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Merging...
                            </>
                          ) : (
                            'Merge Similar Tags'
                          )}
                        </Button>
                      </div>

                      {tagRedirects && tagRedirects.length > 0 && (
                        <div className="p-4 border rounded-lg">
                          <h3 className="font-semibold mb-2">Tag Redirects</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Tags that have been merged into canonical versions.
                          </p>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {tagRedirects.map(([from, to]) => (
                              <div key={from} className="flex items-center gap-2 text-sm">
                                <Badge variant="outline">{from}</Badge>
                                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                <Badge>{to}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>

        {/* Mobile: Dropdown + Content */}
        <div className="md:hidden space-y-6">
          <div>
            <Label htmlFor="mobile-tab-select">Section</Label>
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger id="mobile-tab-select" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="username">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Username
                  </div>
                </SelectItem>
                <SelectItem value="avatar">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Avatar
                  </div>
                </SelectItem>
                <SelectItem value="froggy-phrase">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Froggy Phrase
                  </div>
                </SelectItem>
                <SelectItem value="ponds">
                  <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4" />
                    Joined Ponds
                  </div>
                </SelectItem>
                {isAdmin && (
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Admin Tools
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="username" className="mt-0">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Username</h2>
                  <p className="text-muted-foreground mb-6">
                    Your username must include frog, toad, or tadpole. You can change it once every 24 hours.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username-mobile">Username</Label>
                    <Input
                      id="username-mobile"
                      value={newUsername}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="Enter your username"
                      className="mt-2"
                    />
                    {validationError && (
                      <p className="text-sm text-destructive mt-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {validationError}
                      </p>
                    )}
                    {checkingAvailability && debouncedUsername !== currentUsername && (
                      <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking availability...
                      </p>
                    )}
                    {!checkingAvailability && isAvailable && debouncedUsername !== currentUsername && !validationError && (
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Username available
                      </p>
                    )}
                  </div>

                  {canChange === false && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Cooldown Active</AlertTitle>
                      <AlertDescription>
                        You can only change your username once every 24 hours. Please try again later.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleSave}
                    disabled={
                      registerUsername.isPending ||
                      newUsername === currentUsername ||
                      !!validationError ||
                      checkingAvailability ||
                      checkingCooldown ||
                      canChange === false
                    }
                    className="w-full"
                  >
                    {registerUsername.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Username'
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="avatar" className="mt-0">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Avatar</h2>
                  <p className="text-muted-foreground mb-6">
                    Upload a profile picture to personalize your account.
                  </p>
                </div>

                <div className="space-y-4">
                  {userProfile?.avatar && !avatarPreview && (
                    <div>
                      <Label>Current Avatar</Label>
                      <div className="mt-2">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={userProfile.avatar.getDirectURL()} alt={currentUsername} />
                          <AvatarFallback>{currentUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  )}

                  {avatarPreview && (
                    <div>
                      <Label>Preview</Label>
                      <div className="mt-2">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src={avatarPreview} alt="Preview" />
                          <AvatarFallback>{currentUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="avatar-upload-mobile">Choose Avatar</Label>
                    <Input
                      id="avatar-upload-mobile"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="mt-2"
                    />
                  </div>

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="space-y-2">
                      <Label>Upload Progress</Label>
                      <Progress value={uploadProgress} />
                      <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                    </div>
                  )}

                  <Button
                    onClick={handleSaveAvatar}
                    disabled={!avatarCompressedBytes || saveProfile.isPending || uploadProgress > 0}
                    className="w-full"
                  >
                    {saveProfile.isPending || uploadProgress > 0 ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Save Avatar'
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="froggy-phrase" className="mt-0">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Froggy Phrase</h2>
                  <p className="text-muted-foreground mb-6">
                    Your Froggy Phrase is a permanent 12-word identifier that was automatically generated when you first used Ribbit. 
                    It cannot be changed or removed once created.
                  </p>
                </div>

                {existingPhrase ? (
                  <div className="space-y-4">
                    <Alert>
                      <Key className="h-4 w-4" />
                      <AlertTitle>Permanent Phrase</AlertTitle>
                      <AlertDescription>
                        This phrase is permanent and cannot be changed. Keep it safe as a backup of your identity.
                      </AlertDescription>
                    </Alert>

                    <div>
                      <Label>Your Froggy Phrase</Label>
                      <div className="mt-2 p-4 bg-muted rounded-md font-mono text-sm relative">
                        {showPhrase ? existingPhrase : '•••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• ••••'}
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPhrase(!showPhrase)}
                          >
                            {showPhrase ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                Reveal
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyPhrase}
                            disabled={!showPhrase}
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Phrase Found</AlertTitle>
                    <AlertDescription>
                      A Froggy Phrase will be automatically generated for you.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ponds" className="mt-0">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-4">Joined Ponds</h2>
                  <p className="text-muted-foreground mb-6">
                    Manage the ponds you're a member of.
                  </p>
                </div>

                {isLoadingJoined || isLoadingAllPonds ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-9 w-20" />
                      </div>
                    ))}
                  </div>
                ) : joinedPonds.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Ponds Joined</AlertTitle>
                    <AlertDescription>
                      You haven't joined any ponds yet.{' '}
                      <Link to="/ponds" className="text-primary hover:underline">
                        Browse ponds
                      </Link>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {joinedPonds.map((pond) => (
                      <div
                        key={pond.name}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {pond.profileImage && (
                            <Avatar className="w-12 h-12 flex-shrink-0">
                              <AvatarImage src={pond.profileImage.getDirectURL()} alt={pond.name} />
                              <AvatarFallback>{pond.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className="min-w-0 flex-1">
                            <Link
                              to="/pond/$name"
                              params={{ name: pond.name }}
                              className="font-semibold hover:underline block truncate"
                            >
                              {pond.name}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {Number(pond.memberCount)} members · {Number(pond.lilyCount)} lilies
                            </p>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-shrink-0">
                              <LogOut className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Leave {pond.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to leave this pond? You can rejoin at any time.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleLeavePond(pond.name)}>
                                Leave Pond
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Admin Tools</h2>
                    <p className="text-muted-foreground mb-6">
                      Administrative functions for managing the platform.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Merge Similar Tags</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Automatically merge tags that are similar (e.g., plurals, hyphens, repeated letters).
                      </p>
                      <Button onClick={handleMergeTags} disabled={mergeTags.isPending} className="w-full">
                        {mergeTags.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Merging...
                          </>
                        ) : (
                          'Merge Similar Tags'
                        )}
                      </Button>
                    </div>

                    {tagRedirects && tagRedirects.length > 0 && (
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-2">Tag Redirects</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Tags that have been merged into canonical versions.
                        </p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {tagRedirects.map(([from, to]) => (
                            <div key={from} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline">{from}</Badge>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              <Badge>{to}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
