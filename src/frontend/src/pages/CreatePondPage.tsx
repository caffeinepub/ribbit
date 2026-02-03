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

export default function CreatePondPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [froggyPhrase, setFroggyPhrase] = useState('');
  const [froggyPhraseError, setFroggyPhraseError] = useState<string>('');
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const [bannerImageError, setBannerImageError] = useState<string>('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileImageError, setProfileImageError] = useState<string>('');

  const { mutate: createPond, isPending } = useCreatePond();

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerImageFile(file);
      setBannerImageError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      setProfileImageError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBannerImage = () => {
    setBannerImageFile(null);
    setBannerImagePreview(null);
    setBannerImageError('');
  };

  const handleRemoveProfileImage = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setProfileImageError('');
  };

  const validateFroggyPhrase = (phrase: string): boolean => {
    const words = phrase.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length < 5) {
      setFroggyPhraseError('Froggy Phrase must contain at least five words');
      return false;
    }
    setFroggyPhraseError('');
    return true;
  };

  const handleFroggyPhraseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFroggyPhrase(value);
    if (value.trim()) {
      validateFroggyPhrase(value);
    } else {
      setFroggyPhraseError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !title.trim() || !description.trim()) {
      toast.error('All fields are required');
      return;
    }

    if (!froggyPhrase.trim()) {
      setFroggyPhraseError('Froggy Phrase is required');
      toast.error('Froggy Phrase is required');
      return;
    }

    if (!validateFroggyPhrase(froggyPhrase)) {
      toast.error('Froggy Phrase must contain at least five words');
      return;
    }

    if (!bannerImageFile) {
      setBannerImageError('Please upload a banner image for your pond.');
      toast.error('Please upload a banner image for your pond.');
      return;
    }

    if (!profileImageFile) {
      setProfileImageError('Please upload a profile image for your pond.');
      toast.error('Please upload a profile image for your pond.');
      return;
    }

    const pondName = name.toLowerCase().replace(/\s+/g, '-');

    try {
      // Convert banner image file to bytes
      const bannerArrayBuffer = await bannerImageFile.arrayBuffer();
      const bannerBytes = new Uint8Array(bannerArrayBuffer);
      const bannerImageBlob = ExternalBlob.fromBytes(bannerBytes);

      // Convert profile image file to bytes
      const profileArrayBuffer = await profileImageFile.arrayBuffer();
      const profileBytes = new Uint8Array(profileArrayBuffer);
      const profileImageBlob = ExternalBlob.fromBytes(profileBytes);

      createPond(
        { 
          name: pondName, 
          title, 
          description, 
          image: bannerImageBlob, 
          profileImage: profileImageBlob,
          bannerImage: bannerImageBlob,
          froggyPhrase: froggyPhrase.trim()
        },
        {
          onSuccess: () => {
            toast.success('Pond created successfully! You are now the admin.');
            navigate({ to: '/pond/$name', params: { name: pondName } });
          },
          onError: (error) => {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create pond';
            if (errorMessage.includes('Froggy Phrase')) {
              setFroggyPhraseError(errorMessage);
            }
            toast.error(errorMessage);
          },
        }
      );
    } catch (error) {
      toast.error('Failed to process images');
    }
  };

  return (
    <div className="lg:container py-8">
      <div className="max-w-2xl lg:mx-auto px-4 lg:px-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Start a New Pond</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Pond Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., funny-frogs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ fontSize: '1rem' }}
                />
                <p className="text-sm text-muted-foreground">
                  This will be used in the URL. Use lowercase letters, numbers, and hyphens.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Pond Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Funny Frogs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{ fontSize: '1rem' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this pond is about..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                  style={{ fontSize: '1rem' }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="froggyPhrase">Froggy Phrase *</Label>
                <Input
                  id="froggyPhrase"
                  type="text"
                  placeholder="Enter at least 5 words to secure your pond admin access"
                  value={froggyPhrase}
                  onChange={handleFroggyPhraseChange}
                  required
                  style={{ fontSize: '1rem' }}
                />
                <p className="text-sm text-muted-foreground">
                  Create a memorable phrase with at least 5 words. This grants you admin rights to manage your pond.
                </p>
                {froggyPhraseError && (
                  <p className="text-sm text-destructive">{froggyPhraseError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileImage">Pond Profile Picture *</Label>
                {!profileImagePreview ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="profileImage"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                    />
                    <label htmlFor="profileImage" className="cursor-pointer">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload profile picture
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="relative flex justify-center">
                    <div className="relative">
                      <img
                        src={profileImagePreview}
                        alt="Profile preview"
                        className="w-32 h-32 object-cover rounded-full border-4 border-primary/20"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                        onClick={handleRemoveProfileImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {profileImageError && (
                  <p className="text-sm text-destructive">{profileImageError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannerImage">Pond Banner Image *</Label>
                {!bannerImagePreview ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="bannerImage"
                      accept="image/*"
                      onChange={handleBannerImageChange}
                      className="hidden"
                    />
                    <label htmlFor="bannerImage" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload banner image
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={bannerImagePreview}
                      alt="Banner preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveBannerImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {bannerImageError && (
                  <p className="text-sm text-destructive">{bannerImageError}</p>
                )}
              </div>

              <div className="flex gap-4 pt-2">
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? 'Creating...' : 'Start Pond'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: '/' })}
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
