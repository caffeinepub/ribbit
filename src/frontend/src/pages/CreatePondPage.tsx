import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreatePond } from '@/hooks/useQueries';
import { ExternalBlob } from '@/backend';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import { normalizePondName, getPondNameValidationError } from '@/lib/pondNameValidation';
import { compressImageFile, revokePreviewUrl } from '@/lib/imageCompression';

export default function CreatePondPage() {
  const navigate = useNavigate();
  const [pondName, setPondName] = useState('');
  const [pondNameError, setPondNameError] = useState<string>('');
  const [description, setDescription] = useState('');
  const [froggyPhrase, setFroggyPhrase] = useState('');
  const [froggyPhraseError, setFroggyPhraseError] = useState<string>('');
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerCompressedBytes, setBannerCompressedBytes] = useState<Uint8Array<ArrayBuffer> | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const [bannerImageError, setBannerImageError] = useState<string>('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileCompressedBytes, setProfileCompressedBytes] = useState<Uint8Array<ArrayBuffer> | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileImageError, setProfileImageError] = useState<string>('');

  const { mutate: createPond, isPending } = useCreatePond();

  const handleBannerImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clean up previous preview
    if (bannerImagePreview) {
      revokePreviewUrl(bannerImagePreview);
    }

    try {
      const result = await compressImageFile(file);
      
      setBannerImageFile(file);
      setBannerCompressedBytes(result.bytes);
      setBannerImagePreview(result.previewUrl);
      setBannerImageError('');

      if (result.wasCompressed) {
        const savedPercent = Math.round((1 - result.compressedSize / result.originalSize) * 100);
        if (savedPercent > 0) {
          toast.success(`Banner compressed (saved ${savedPercent}%)`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process banner image';
      toast.error(errorMessage);
      setBannerImageError(errorMessage);
      setBannerImageFile(null);
      setBannerCompressedBytes(null);
      setBannerImagePreview(null);
    }
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clean up previous preview
    if (profileImagePreview) {
      revokePreviewUrl(profileImagePreview);
    }

    try {
      const result = await compressImageFile(file);
      
      setProfileImageFile(file);
      setProfileCompressedBytes(result.bytes);
      setProfileImagePreview(result.previewUrl);
      setProfileImageError('');

      if (result.wasCompressed) {
        const savedPercent = Math.round((1 - result.compressedSize / result.originalSize) * 100);
        if (savedPercent > 0) {
          toast.success(`Profile image compressed (saved ${savedPercent}%)`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process profile image';
      toast.error(errorMessage);
      setProfileImageError(errorMessage);
      setProfileImageFile(null);
      setProfileCompressedBytes(null);
      setProfileImagePreview(null);
    }
  };

  const handleRemoveBannerImage = () => {
    if (bannerImagePreview) {
      revokePreviewUrl(bannerImagePreview);
    }
    setBannerImageFile(null);
    setBannerCompressedBytes(null);
    setBannerImagePreview(null);
    setBannerImageError('');
  };

  const handleRemoveProfileImage = () => {
    if (profileImagePreview) {
      revokePreviewUrl(profileImagePreview);
    }
    setProfileImageFile(null);
    setProfileCompressedBytes(null);
    setProfileImagePreview(null);
    setProfileImageError('');
  };

  const handlePondNameChange = (value: string) => {
    setPondName(value);
    const error = getPondNameValidationError(value);
    setPondNameError(error || '');
  };

  const handleFroggyPhraseChange = (value: string) => {
    setFroggyPhrase(value);
    const words = value.trim().split(/\s+/);
    if (value.trim() && words.length < 5) {
      setFroggyPhraseError('Froggy Phrase must contain at least 5 words');
    } else {
      setFroggyPhraseError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate pond name
    const nameError = getPondNameValidationError(pondName);
    if (nameError) {
      setPondNameError(nameError);
      toast.error(nameError);
      return;
    }

    // Validate Froggy Phrase
    const words = froggyPhrase.trim().split(/\s+/);
    if (words.length < 5) {
      setFroggyPhraseError('Froggy Phrase must contain at least 5 words');
      toast.error('Froggy Phrase must contain at least 5 words');
      return;
    }

    // Validate banner image
    if (!bannerCompressedBytes) {
      setBannerImageError('Banner image is required');
      toast.error('Banner image is required');
      return;
    }

    // Validate profile image
    if (!profileCompressedBytes) {
      setProfileImageError('Profile image is required');
      toast.error('Profile image is required');
      return;
    }

    // Normalize pond name to lowercase alphanumeric
    const normalizedName = normalizePondName(pondName);
    
    // Check if normalization failed
    if (!normalizedName) {
      setPondNameError('Invalid pond name');
      toast.error('Invalid pond name');
      return;
    }

    // Create ExternalBlob instances from compressed bytes
    const bannerBlob = ExternalBlob.fromBytes(bannerCompressedBytes);
    const profileBlob = ExternalBlob.fromBytes(profileCompressedBytes);
    const imageBlob = profileBlob; // Use profile image as the main image

    createPond(
      {
        name: normalizedName,
        description,
        image: imageBlob,
        profileImage: profileBlob,
        bannerImage: bannerBlob,
        froggyPhrase,
      },
      {
        onSuccess: () => {
          toast.success('Pond created successfully!');
          navigate({ to: '/pond/$name', params: { name: normalizedName } });
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create pond';
          toast.error(errorMessage);
        },
      }
    );
  };

  return (
    <div className="lg:container py-8">
      <div className="max-w-2xl lg:mx-auto px-4 lg:px-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Start a Pond</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pondName">Pond Name</Label>
                <Input
                  id="pondName"
                  placeholder="e.g., FrogLovers"
                  value={pondName}
                  onChange={(e) => handlePondNameChange(e.target.value)}
                  required
                  style={{ fontSize: '1rem' }}
                />
                {pondNameError && (
                  <p className="text-red-500 text-sm">{pondNameError}</p>
                )}
                <p className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>
                  Letters and numbers only. Will be converted to lowercase.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What's your pond about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                  style={{ fontSize: '1rem' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="froggyPhrase">Froggy Phrase</Label>
                <Input
                  id="froggyPhrase"
                  placeholder="Enter at least 5 words"
                  value={froggyPhrase}
                  onChange={(e) => handleFroggyPhraseChange(e.target.value)}
                  required
                  style={{ fontSize: '1rem' }}
                />
                {froggyPhraseError && (
                  <p className="text-red-500 text-sm">{froggyPhraseError}</p>
                )}
                <p className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>
                  A secret phrase to verify pond ownership (minimum 5 words)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannerImage">Banner Image (Required)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="bannerImage"
                    type="file"
                    accept="image/*"
                    onChange={handleBannerImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('bannerImage')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Banner
                  </Button>
                  {bannerImageFile && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{bannerImageFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveBannerImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {bannerImageError && (
                  <p className="text-red-500 text-sm">{bannerImageError}</p>
                )}
                {bannerImagePreview && (
                  <div className="mt-4 relative">
                    <img
                      src={bannerImagePreview}
                      alt="Banner preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileImage">Profile Image (Required)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('profileImage')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Profile Image
                  </Button>
                  {profileImageFile && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{profileImageFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveProfileImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {profileImageError && (
                  <p className="text-red-500 text-sm">{profileImageError}</p>
                )}
                {profileImagePreview && (
                  <div className="mt-4 flex justify-center">
                    <img
                      src={profileImagePreview}
                      alt="Profile preview"
                      className="w-32 h-32 object-cover rounded-full"
                    />
                  </div>
                )}
                <p className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>
                  This will be displayed as a circular profile image
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isPending || !!pondNameError || !!froggyPhraseError || !!bannerImageError || !!profileImageError}
                  className="flex-1"
                >
                  {isPending ? 'Creating...' : 'Create Pond'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: '/ponds' })}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
