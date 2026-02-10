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
import { getUsername, setUsername, getPreviousUsername, getFroggyPhrase, setFroggyPhrase, restoreFromFroggyPhrase, clearFroggyPhrase } from '@/lib/user';
import { useIsUsernameAvailable, useRegisterUsername, useReleaseUsername, useCanChangeUsername, useRecordUsernameChange, useGetJoinedPonds, useGetAllPonds, useIsAdmin, useMergeSimilarTags, useGetTagRedirects, useLeavePond, useGetCallerUserProfile, useSaveCallerUserProfile } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { Loader2, Copy, Check, AlertCircle, ArrowRight, LogOut, User, ImageIcon, Key, Waves, ShieldCheck } from 'lucide-react';
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
  
  // Froggy Phrase state
  const [froggyPhrase, setFroggyPhraseInput] = useState('');
  const [phraseError, setPhraseError] = useState('');
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

  const validateFroggyPhrase = (phrase: string): boolean => {
    const words = phrase.trim().split(/\s+/);
    if (words.length < 5) {
      setPhraseError('Froggy Phrase must contain at least 5 words');
      return false;
    }
    setPhraseError('');
    return true;
  };

  const handleSaveFroggyPhrase = () => {
    if (!validateFroggyPhrase(froggyPhrase)) {
      return;
    }

    setFroggyPhrase(froggyPhrase);
    toast.success('Froggy Phrase saved successfully!');
    setFroggyPhraseInput('');
    setShowPhrase(true);
  };

  const handleRestoreFroggyPhrase = () => {
    if (!validateFroggyPhrase(froggyPhrase)) {
      return;
    }

    const restored = restoreFromFroggyPhrase(froggyPhrase);
    if (restored) {
      toast.success('Settings restored from Froggy Phrase!');
      setNewUsername(getUsername());
      setFroggyPhraseInput('');
      // Refetch user profile after restore
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userAvatar'] });
    } else {
      setPhraseError('Invalid Froggy Phrase');
      toast.error('Invalid Froggy Phrase');
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

  const handleClearPhrase = () => {
    clearFroggyPhrase();
    setShowPhrase(false);
    toast.success('Froggy Phrase cleared');
  };

  const handleMergeTags = async () => {
    try {
      await mergeTags.mutateAsync();
      toast.success('Tags merged successfully!');
    } catch (error: any) {
      console.error('Error merging tags:', error);
      toast.error('Failed to merge tags. Please try again.');
    }
  };

  const handleLeavePond = async (pondName: string) => {
    try {
      await leavePondMutation.mutateAsync(pondName);
      toast.success('Successfully left the pond');
    } catch (error: any) {
      toast.error(error.message || 'Failed to leave pond');
    }
  };

  const isSaveDisabled = 
    canChange === false ||
    newUsername === currentUsername || 
    !!validationError || 
    checkingAvailability ||
    checkingCooldown ||
    registerUsername.isPending ||
    releaseUsername.isPending ||
    recordUsernameChange.isPending;

  // Helper function to render icon+label for settings sections
  const renderSectionLabel = (icon: React.ReactNode, label: string) => (
    <span className="inline-flex items-center gap-2">
      {icon}
      <span>{label}</span>
    </span>
  );

  // Tab options for dropdown
  const tabOptions = [
    { value: 'username', label: 'Username', icon: <User className="h-4 w-4 shrink-0" /> },
    { value: 'avatar', label: 'Avatar', icon: <ImageIcon className="h-4 w-4 shrink-0" /> },
    { value: 'phrase', label: 'Froggy Phrase', icon: <Key className="h-4 w-4 shrink-0" /> },
    { value: 'ponds', label: 'My Ponds', icon: <Waves className="h-4 w-4 shrink-0" /> },
    ...(isAdmin ? [{ value: 'admin', label: 'Admin', icon: <ShieldCheck className="h-4 w-4 shrink-0" /> }] : []),
  ];

  // Get current avatar URL
  const currentAvatarUrl = userProfile?.avatar?.getDirectURL();

  return (
    <div className="lg:container py-8">
      <div className="max-w-4xl lg:mx-auto px-4 lg:px-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">User Settings</h1>
          <p className="text-muted-foreground">
            Manage your anonymous profile, avatar, save your settings with a Froggy Phrase, and view your joined ponds.
          </p>
        </div>
        
        {/* Mobile dropdown (< lg) */}
        <div className="lg:hidden mb-6">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a section">
                {tabOptions.find(opt => opt.value === activeTab) && (
                  <span className="inline-flex items-center gap-2">
                    {tabOptions.find(opt => opt.value === activeTab)?.icon}
                    <span>{tabOptions.find(opt => opt.value === activeTab)?.label}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {tabOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="inline-flex items-center gap-2">
                    {option.icon}
                    <span>{option.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop vertical tabs (>= lg) */}
          <div className="hidden lg:flex lg:gap-8">
            <TabsList className="vertical-tabs-list">
              <TabsTrigger value="username" className="vertical-tabs-trigger">
                {renderSectionLabel(<User className="h-4 w-4 shrink-0" />, 'Username')}
              </TabsTrigger>
              <TabsTrigger value="avatar" className="vertical-tabs-trigger">
                {renderSectionLabel(<ImageIcon className="h-4 w-4 shrink-0" />, 'Avatar')}
              </TabsTrigger>
              <TabsTrigger value="phrase" className="vertical-tabs-trigger">
                {renderSectionLabel(<Key className="h-4 w-4 shrink-0" />, 'Froggy Phrase')}
              </TabsTrigger>
              <TabsTrigger value="ponds" className="vertical-tabs-trigger">
                {renderSectionLabel(<Waves className="h-4 w-4 shrink-0" />, 'My Ponds')}
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="vertical-tabs-trigger">
                  {renderSectionLabel(<ShieldCheck className="h-4 w-4 shrink-0" />, 'Admin')}
                </TabsTrigger>
              )}
            </TabsList>

            <div className="flex-1">
              <TabsContent value="username" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      value={newUsername}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      disabled={canChange === false}
                      placeholder="Frog_1234"
                      style={{ fontSize: '1rem' }}
                    />
                    {checkingAvailability && newUsername !== currentUsername && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {validationError && (
                    <p className="text-red-500">
                      {validationError}
                    </p>
                  )}
                  {canChange === false && (
                    <p className="text-muted-foreground">
                      You can only change your username once every 24 hours.
                    </p>
                  )}
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={isSaveDisabled}
                  className="rounded-full"
                >
                  {(registerUsername.isPending || releaseUsername.isPending || recordUsernameChange.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Username Requirements</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Must include "frog", "toad", or "tadpole"</li>
                    <li>• Can only be changed once every 24 hours</li>
                    <li>• Must be unique</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="avatar" className="space-y-4 mt-0">
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Current Avatar</Label>
                    <Avatar className="h-24 w-24">
                      {currentAvatarUrl ? (
                        <AvatarImage src={currentAvatarUrl} alt={currentUsername} />
                      ) : null}
                      <AvatarFallback className="text-2xl">
                        {currentUsername[0]?.toUpperCase() || 'F'}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatar">Upload New Avatar</Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: Square image, at least 200x200px. Animated GIFs supported.
                    </p>
                  </div>

                  {avatarPreview && (
                    <div className="space-y-2">
                      <Label>Preview (compressed)</Label>
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={avatarPreview} alt="Preview" />
                        <AvatarFallback>Preview</AvatarFallback>
                      </Avatar>
                    </div>
                  )}

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="space-y-2">
                      <Label>Upload Progress</Label>
                      <Progress value={uploadProgress} />
                      <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                    </div>
                  )}

                  <Button
                    onClick={handleSaveAvatar}
                    disabled={!avatarCompressedBytes || saveProfile.isPending}
                    className="rounded-full"
                  >
                    {saveProfile.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Avatar'
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="phrase" className="space-y-4 mt-0">
                {existingPhrase && showPhrase ? (
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertTitle>Your Froggy Phrase</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p className="font-mono text-sm bg-muted p-2 rounded">
                        {existingPhrase}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyPhrase}
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              Clear Phrase
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Clear Froggy Phrase?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete your Froggy Phrase. You won't be able to restore your settings with it anymore.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleClearPhrase}>
                                Clear
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="froggyPhrase">Create or Restore Froggy Phrase</Label>
                      <Input
                        id="froggyPhrase"
                        value={froggyPhrase}
                        onChange={(e) => setFroggyPhraseInput(e.target.value)}
                        placeholder="Enter at least 5 words"
                      />
                      {phraseError && (
                        <p className="text-red-500 text-sm">{phraseError}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSaveFroggyPhrase} className="rounded-full">
                        Save New Phrase
                      </Button>
                      <Button
                        onClick={handleRestoreFroggyPhrase}
                        variant="outline"
                        className="rounded-full"
                      >
                        Restore from Phrase
                      </Button>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>What is a Froggy Phrase?</AlertTitle>
                      <AlertDescription>
                        A Froggy Phrase is a passphrase that encrypts and saves your settings locally. Use it to restore your username and preferences on any device.
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </TabsContent>

              <TabsContent value="ponds" className="space-y-4 mt-0">
                {isLoadingJoined || isLoadingAllPonds ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : joinedPonds.length > 0 ? (
                  <div className="space-y-2">
                    {joinedPonds.map((pond) => (
                      <div
                        key={pond.name}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <Link
                            to="/pond/$name"
                            params={{ name: pond.name }}
                            className="font-medium hover:underline"
                          >
                            {pond.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {Number(pond.memberCount)} members
                          </p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <LogOut className="h-4 w-4 mr-2" />
                              Leave
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Leave {pond.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                You can always rejoin this pond later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleLeavePond(pond.name)}
                              >
                                Leave Pond
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      You haven't joined any ponds yet
                    </p>
                    <Button asChild>
                      <Link to="/ponds">
                        Browse Ponds
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              {isAdmin && (
                <TabsContent value="admin" className="space-y-4 mt-0">
                  <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>Admin Tools</AlertTitle>
                    <AlertDescription>
                      These tools are only available to administrators.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Merge Similar Tags</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Automatically merge tags that are similar (e.g., "frog" and "frogs").
                      </p>
                      <Button
                        onClick={handleMergeTags}
                        disabled={mergeTags.isPending}
                      >
                        {mergeTags.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Merging...
                          </>
                        ) : (
                          'Merge Tags'
                        )}
                      </Button>
                    </div>

                    {isLoadingRedirects ? (
                      <Skeleton className="h-32 w-full" />
                    ) : tagRedirects && tagRedirects.length > 0 ? (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-medium mb-2">Tag Redirects</h3>
                        <div className="space-y-1 text-sm">
                          {tagRedirects.map(([from, to]) => (
                            <div key={from} className="flex items-center gap-2">
                              <Badge variant="outline">{from}</Badge>
                              <ArrowRight className="h-3 w-3" />
                              <Badge>{to}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </TabsContent>
              )}
            </div>
          </div>

          {/* Mobile content (< lg) */}
          <div className="lg:hidden">
            <TabsContent value="username" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username-mobile">Username</Label>
                <div className="relative">
                  <Input
                    id="username-mobile"
                    value={newUsername}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    disabled={canChange === false}
                    placeholder="Frog_1234"
                  />
                  {checkingAvailability && newUsername !== currentUsername && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                {validationError && (
                  <p className="text-red-500 text-sm">{validationError}</p>
                )}
                {canChange === false && (
                  <p className="text-muted-foreground text-sm">
                    You can only change your username once every 24 hours.
                  </p>
                )}
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaveDisabled}
                className="w-full rounded-full"
              >
                {(registerUsername.isPending || releaseUsername.isPending || recordUsernameChange.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </TabsContent>

            <TabsContent value="avatar" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Current Avatar</Label>
                  <Avatar className="h-24 w-24">
                    {currentAvatarUrl ? (
                      <AvatarImage src={currentAvatarUrl} alt={currentUsername} />
                    ) : null}
                    <AvatarFallback className="text-2xl">
                      {currentUsername[0]?.toUpperCase() || 'F'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar-mobile">Upload New Avatar</Label>
                  <Input
                    id="avatar-mobile"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: Square image, at least 200x200px. Animated GIFs supported.
                  </p>
                </div>

                {avatarPreview && (
                  <div className="space-y-2">
                    <Label>Preview (compressed)</Label>
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatarPreview} alt="Preview" />
                      <AvatarFallback>Preview</AvatarFallback>
                    </Avatar>
                  </div>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <Label>Upload Progress</Label>
                    <Progress value={uploadProgress} />
                    <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                  </div>
                )}

                <Button
                  onClick={handleSaveAvatar}
                  disabled={!avatarCompressedBytes || saveProfile.isPending}
                  className="w-full rounded-full"
                >
                  {saveProfile.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Avatar'
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="phrase" className="space-y-4">
              {existingPhrase && showPhrase ? (
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertTitle>Your Froggy Phrase</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p className="font-mono text-sm bg-muted p-2 rounded break-all">
                      {existingPhrase}
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyPhrase}
                        className="w-full"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="w-full">
                            Clear Phrase
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear Froggy Phrase?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete your Froggy Phrase.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearPhrase}>
                              Clear
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="froggyPhrase-mobile">Create or Restore Froggy Phrase</Label>
                    <Input
                      id="froggyPhrase-mobile"
                      value={froggyPhrase}
                      onChange={(e) => setFroggyPhraseInput(e.target.value)}
                      placeholder="Enter at least 5 words"
                    />
                    {phraseError && (
                      <p className="text-red-500 text-sm">{phraseError}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button onClick={handleSaveFroggyPhrase} className="w-full rounded-full">
                      Save New Phrase
                    </Button>
                    <Button
                      onClick={handleRestoreFroggyPhrase}
                      variant="outline"
                      className="w-full rounded-full"
                    >
                      Restore from Phrase
                    </Button>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>What is a Froggy Phrase?</AlertTitle>
                    <AlertDescription>
                      A Froggy Phrase is a passphrase that encrypts and saves your settings locally.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </TabsContent>

            <TabsContent value="ponds" className="space-y-4">
              {isLoadingJoined || isLoadingAllPonds ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : joinedPonds.length > 0 ? (
                <div className="space-y-2">
                  {joinedPonds.map((pond) => (
                    <div
                      key={pond.name}
                      className="flex flex-col gap-2 p-4 border rounded-lg"
                    >
                      <div>
                        <Link
                          to="/pond/$name"
                          params={{ name: pond.name }}
                          className="font-medium hover:underline"
                        >
                          {pond.name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {Number(pond.memberCount)} members
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <LogOut className="h-4 w-4 mr-2" />
                            Leave
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Leave {pond.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              You can always rejoin this pond later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleLeavePond(pond.name)}
                            >
                              Leave Pond
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    You haven't joined any ponds yet
                  </p>
                  <Button asChild className="w-full">
                    <Link to="/ponds">
                      Browse Ponds
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin" className="space-y-4">
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Admin Tools</AlertTitle>
                  <AlertDescription>
                    These tools are only available to administrators.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Merge Similar Tags</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Automatically merge tags that are similar.
                    </p>
                    <Button
                      onClick={handleMergeTags}
                      disabled={mergeTags.isPending}
                      className="w-full"
                    >
                      {mergeTags.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Merging...
                        </>
                      ) : (
                        'Merge Tags'
                      )}
                    </Button>
                  </div>

                  {isLoadingRedirects ? (
                    <Skeleton className="h-32 w-full" />
                  ) : tagRedirects && tagRedirects.length > 0 ? (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">Tag Redirects</h3>
                      <div className="space-y-1 text-sm">
                        {tagRedirects.map(([from, to]) => (
                          <div key={from} className="flex items-center gap-2">
                            <Badge variant="outline">{from}</Badge>
                            <ArrowRight className="h-3 w-3" />
                            <Badge>{to}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
