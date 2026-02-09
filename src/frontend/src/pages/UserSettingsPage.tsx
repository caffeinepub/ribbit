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
import { useCheckUsernameAvailability, useRegisterUsername, useReleaseUsername, useCanChangeUsername, useRecordUsernameChange, useGetJoinedPonds, useGetAllPonds, useIsAdmin, useMergeSimilarTags, useGetTagRedirects, useLeavePond, useGetCallerUserProfile, useSaveCallerUserProfile, useGetUserAvatarByUsername } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { Loader2, Copy, Check, AlertCircle, ArrowRight, LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ExternalBlob } from '@/backend';

export default function UserSettingsPage() {
  const currentUsername = getUsername();
  const [newUsername, setNewUsername] = useState(currentUsername);
  const [validationError, setValidationError] = useState('');
  const [debouncedUsername, setDebouncedUsername] = useState(currentUsername);
  
  // Controlled tab state
  const [activeTab, setActiveTab] = useState('username');
  
  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { data: currentAvatar } = useGetUserAvatarByUsername(currentUsername);
  
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
  const { data: userProfile, isLoading: isLoadingProfile } = useGetCallerUserProfile();
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

  // Check username availability
  const { data: isAvailable, isLoading: checkingAvailability } = useCheckUsernameAvailability(
    debouncedUsername,
    currentUsername
  );

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) {
      toast.error('Please select an avatar image');
      return;
    }

    try {
      setUploadProgress(0);
      const arrayBuffer = await avatarFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const avatarBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
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
      setAvatarFile(null);
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

  // Tab options for dropdown
  const tabOptions = [
    { value: 'username', label: 'Username' },
    { value: 'avatar', label: 'Avatar' },
    { value: 'phrase', label: 'Froggy Phrase' },
    { value: 'ponds', label: 'My Ponds' },
    ...(isAdmin ? [{ value: 'admin', label: 'Admin' }] : []),
  ];

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
              <SelectValue placeholder="Select a section" />
            </SelectTrigger>
            <SelectContent>
              {tabOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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
                Username
              </TabsTrigger>
              <TabsTrigger value="avatar" className="vertical-tabs-trigger">
                Avatar
              </TabsTrigger>
              <TabsTrigger value="phrase" className="vertical-tabs-trigger">
                Froggy Phrase
              </TabsTrigger>
              <TabsTrigger value="ponds" className="vertical-tabs-trigger">
                My Ponds
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="vertical-tabs-trigger">
                  Admin
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
                  <h3 className="font-semibold mb-2">About Anonymous Accounts</h3>
                  <p className="text-muted-foreground">
                    Your identity is stored locally in your browser. No registration or personal information is required.
                    You can change your username once every 24 hours.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="avatar" className="space-y-4 mt-0">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-32 w-32 bg-primary/10">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} alt="Avatar preview" />
                    ) : currentAvatar ? (
                      <AvatarImage src={currentAvatar.getDirectURL()} alt={currentUsername} />
                    ) : (
                      <AvatarFallback className="text-5xl">🐸</AvatarFallback>
                    )}
                  </Avatar>
                  
                  <p className="text-muted-foreground text-center">
                    {currentAvatar && !avatarPreview ? 'Current avatar' : avatarPreview ? 'Preview' : 'No avatar uploaded'}
                  </p>

                  {saveProfile.isPending && uploadProgress > 0 && (
                    <div className="w-full max-w-xs">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-center text-muted-foreground mt-1" style={{ fontSize: '0.875rem' }}>
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-2">
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <Button variant="outline" asChild className="hover-darken-light rounded-full">
                        <span>Choose Avatar</span>
                      </Button>
                    </Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>

                  {avatarFile && (
                    <Button 
                      onClick={handleSaveAvatar} 
                      disabled={saveProfile.isPending}
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
                  )}
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">About Avatars</h3>
                  <p className="text-muted-foreground">
                    Your avatar is stored on the Internet Computer and linked to your username.
                    It will be visible to other users across the platform.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="phrase" className="space-y-4 mt-0">
                {existingPhrase && showPhrase ? (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Your Froggy Phrase</AlertTitle>
                      <AlertDescription className="mt-2">
                        <div className="bg-muted p-3 rounded-md font-mono break-all">
                          {existingPhrase}
                        </div>
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleCopyPhrase}
                        variant="outline"
                        className="flex-1"
                      >
                        {copied ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Phrase
                          </>
                        )}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            Clear Phrase
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Clear Froggy Phrase?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove your saved Froggy Phrase. You won't be able to restore your settings unless you have it saved elsewhere.
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
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="froggyPhrase">Create or Restore Froggy Phrase</Label>
                      <Input
                        id="froggyPhrase"
                        type="text"
                        placeholder="Enter at least 5 words..."
                        value={froggyPhrase}
                        onChange={(e) => setFroggyPhraseInput(e.target.value)}
                        style={{ fontSize: '1rem' }}
                      />
                      {phraseError && (
                        <p className="text-red-500">
                          {phraseError}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        A Froggy Phrase is a memorable passphrase that encrypts and saves your settings locally.
                        You can use it to restore your username and preferences on any device.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveFroggyPhrase}
                        disabled={!froggyPhrase.trim() || !!phraseError}
                        className="flex-1"
                      >
                        Save New Phrase
                      </Button>
                      <Button
                        onClick={handleRestoreFroggyPhrase}
                        variant="outline"
                        disabled={!froggyPhrase.trim() || !!phraseError}
                        className="flex-1"
                      >
                        Restore from Phrase
                      </Button>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">About Froggy Phrases</h3>
                  <p className="text-muted-foreground">
                    Your Froggy Phrase is stored locally and encrypted. It allows you to backup and restore your
                    anonymous identity across devices without creating an account.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="ponds" className="space-y-4 mt-0">
                {isLoadingJoined || isLoadingAllPonds ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : joinedPonds.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">You haven't joined any ponds yet.</p>
                    <Button asChild>
                      <Link to="/ponds">
                        Browse Ponds
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {joinedPonds.map((pond) => (
                      <div
                        key={pond.name}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-10 w-10">
                            {pond.profileImage ? (
                              <AvatarImage src={pond.profileImage.getDirectURL()} alt={pond.name} />
                            ) : (
                              <AvatarFallback>🐸</AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <Link
                              to="/pond/$name"
                              params={{ name: pond.name }}
                              className="font-semibold hover:underline"
                            >
                              {pond.name}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {Number(pond.memberCount)} members
                            </p>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <LogOut className="h-4 w-4 mr-2" />
                              Leave
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Leave {pond.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                You can rejoin this pond at any time.
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
              </TabsContent>

              {isAdmin && (
                <TabsContent value="admin" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Tag Management</h3>
                      <p className="text-muted-foreground mb-4">
                        Merge similar tags to keep the tag system organized.
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
                          'Merge Similar Tags'
                        )}
                      </Button>
                    </div>

                    {isLoadingRedirects ? (
                      <Skeleton className="h-32 w-full" />
                    ) : tagRedirects && tagRedirects.length > 0 ? (
                      <div>
                        <h3 className="font-semibold mb-2">Tag Redirects</h3>
                        <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                          {tagRedirects.map(([from, to]) => (
                            <div key={from} className="flex items-center gap-2 py-1">
                              <Badge variant="outline">{from}</Badge>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
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

          {/* Mobile tab content */}
          <div className="lg:hidden">
            <TabsContent value="username" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="username-mobile">Username</Label>
                <div className="relative">
                  <Input
                    id="username-mobile"
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

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">About Anonymous Accounts</h3>
                <p className="text-muted-foreground">
                  Your identity is stored locally in your browser. No registration or personal information is required.
                  You can change your username once every 24 hours.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="avatar" className="space-y-4 mt-0">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32 bg-primary/10">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Avatar preview" />
                  ) : currentAvatar ? (
                    <AvatarImage src={currentAvatar.getDirectURL()} alt={currentUsername} />
                  ) : (
                    <AvatarFallback className="text-5xl">🐸</AvatarFallback>
                  )}
                </Avatar>
                
                <p className="text-muted-foreground text-center">
                  {currentAvatar && !avatarPreview ? 'Current avatar' : avatarPreview ? 'Preview' : 'No avatar uploaded'}
                </p>

                {saveProfile.isPending && uploadProgress > 0 && (
                  <div className="w-full max-w-xs">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-center text-muted-foreground mt-1" style={{ fontSize: '0.875rem' }}>
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}

                <div className="flex flex-col items-center gap-2">
                  <Label htmlFor="avatar-mobile" className="cursor-pointer">
                    <Button variant="outline" asChild className="hover-darken-light rounded-full">
                      <span>Choose Avatar</span>
                    </Button>
                  </Label>
                  <Input
                    id="avatar-mobile"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                {avatarFile && (
                  <Button 
                    onClick={handleSaveAvatar} 
                    disabled={saveProfile.isPending}
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
                )}
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">About Avatars</h3>
                <p className="text-muted-foreground">
                  Your avatar is stored on the Internet Computer and linked to your username.
                  It will be visible to other users across the platform.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="phrase" className="space-y-4 mt-0">
              {existingPhrase && showPhrase ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Your Froggy Phrase</AlertTitle>
                    <AlertDescription className="mt-2">
                      <div className="bg-muted p-3 rounded-md font-mono break-all">
                        {existingPhrase}
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleCopyPhrase}
                      variant="outline"
                      className="w-full"
                    >
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Phrase
                        </>
                      )}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          Clear Phrase
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear Froggy Phrase?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove your saved Froggy Phrase. You won't be able to restore your settings unless you have it saved elsewhere.
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
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="froggyPhrase-mobile">Create or Restore Froggy Phrase</Label>
                    <Input
                      id="froggyPhrase-mobile"
                      type="text"
                      placeholder="Enter at least 5 words..."
                      value={froggyPhrase}
                      onChange={(e) => setFroggyPhraseInput(e.target.value)}
                      style={{ fontSize: '1rem' }}
                    />
                    {phraseError && (
                      <p className="text-red-500">
                        {phraseError}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      A Froggy Phrase is a memorable passphrase that encrypts and saves your settings locally.
                      You can use it to restore your username and preferences on any device.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleSaveFroggyPhrase}
                      disabled={!froggyPhrase.trim() || !!phraseError}
                      className="w-full"
                    >
                      Save New Phrase
                    </Button>
                    <Button
                      onClick={handleRestoreFroggyPhrase}
                      variant="outline"
                      disabled={!froggyPhrase.trim() || !!phraseError}
                      className="w-full"
                    >
                      Restore from Phrase
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">About Froggy Phrases</h3>
                <p className="text-muted-foreground">
                  Your Froggy Phrase is stored locally and encrypted. It allows you to backup and restore your
                  anonymous identity across devices without creating an account.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="ponds" className="space-y-4 mt-0">
              {isLoadingJoined || isLoadingAllPonds ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : joinedPonds.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You haven't joined any ponds yet.</p>
                  <Button asChild className="w-full">
                    <Link to="/ponds">
                      Browse Ponds
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {joinedPonds.map((pond) => (
                    <div
                      key={pond.name}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="h-10 w-10">
                          {pond.profileImage ? (
                            <AvatarImage src={pond.profileImage.getDirectURL()} alt={pond.name} />
                          ) : (
                            <AvatarFallback>🐸</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <Link
                            to="/pond/$name"
                            params={{ name: pond.name }}
                            className="font-semibold hover:underline"
                          >
                            {pond.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {Number(pond.memberCount)} members
                          </p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <LogOut className="h-4 w-4 mr-2" />
                            Leave
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Leave {pond.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              You can rejoin this pond at any time.
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
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin" className="space-y-4 mt-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Tag Management</h3>
                    <p className="text-muted-foreground mb-4">
                      Merge similar tags to keep the tag system organized.
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
                        'Merge Similar Tags'
                      )}
                    </Button>
                  </div>

                  {isLoadingRedirects ? (
                    <Skeleton className="h-32 w-full" />
                  ) : tagRedirects && tagRedirects.length > 0 ? (
                    <div>
                      <h3 className="font-semibold mb-2">Tag Redirects</h3>
                      <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                        {tagRedirects.map(([from, to]) => (
                          <div key={from} className="flex items-center gap-2 py-1">
                            <Badge variant="outline">{from}</Badge>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
