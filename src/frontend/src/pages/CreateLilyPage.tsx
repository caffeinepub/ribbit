import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateLily, useGetAllPonds, useGetJoinedPonds, useGetTagSuggestions } from '@/hooks/useQueries';
import { getUsername } from '@/lib/user';
import { toast } from 'sonner';
import { ExternalBlob } from '@/backend';
import { Upload, AlertCircle, Hash } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDebounce } from 'react-use';

type LilyType = 'text' | 'image' | 'link';

export default function CreateLilyPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { pond?: string };
  const username = getUsername();

  const [lilyType, setLilyType] = useState<LilyType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pond, setPond] = useState(search.pond || '');
  const [link, setLink] = useState('');
  const [tag, setTag] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedTag, setDebouncedTag] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { data: ponds } = useGetAllPonds();
  const { data: joinedPonds } = useGetJoinedPonds();
  const { mutate: createLily, isPending } = useCreateLily();

  // Debounce tag input for API calls
  useDebounce(
    () => {
      setDebouncedTag(tag);
    },
    300,
    [tag]
  );

  const { data: tagSuggestions = [], isLoading: isLoadingSuggestions } = useGetTagSuggestions(
    debouncedTag,
    10
  );

  const isPondJoined = (pondName: string) => {
    return joinedPonds?.includes(pondName) || false;
  };

  const selectedPondNotJoined = Boolean(pond && !isPondJoined(pond));

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        tagInputRef.current &&
        !tagInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show suggestions when tag input changes and has value
  useEffect(() => {
    if (tag.trim() && tagSuggestions.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [tag, tagSuggestions]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTagSelect = (selectedTag: string) => {
    setTag(selectedTag);
    setShowSuggestions(false);
    tagInputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !pond) {
      toast.error('Title and pond are required');
      return;
    }

    if (!isPondJoined(pond)) {
      toast.error('You must be a member of this pond to post a Lily.');
      return;
    }

    let imageBlob: ExternalBlob | null = null;
    if (lilyType === 'image' && imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      imageBlob = ExternalBlob.fromBytes(new Uint8Array(arrayBuffer));
    }

    createLily(
      {
        title,
        content,
        image: imageBlob,
        link: lilyType === 'link' ? link : null,
        pond,
        username,
        tag: tag.trim() || null,
      },
      {
        onSuccess: (lilyId) => {
          toast.success('Lily created successfully!');
          navigate({ to: '/lily/$id', params: { id: lilyId } });
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create lily';
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
            <CardTitle className="text-2xl">Create a Lily</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pond">Select Pond</Label>
                <Select value={pond} onValueChange={setPond} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a pond" style={{ fontSize: '1rem' }} />
                  </SelectTrigger>
                  <SelectContent>
                    {ponds?.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.title}
                        {isPondJoined(p.name) && (
                          <span className="ml-2 text-primary" style={{ fontSize: '0.875rem' }}>✓ Joined</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPondNotJoined && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You must be a member of this pond to post a Lily. Please join the pond first.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="tag">Tag your Lily (optional)</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={tagInputRef}
                    id="tag"
                    placeholder="e.g., discussion, meme, question"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    onFocus={() => {
                      if (tag.trim() && tagSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    maxLength={25}
                    className="pl-9"
                    style={{ fontSize: '1rem' }}
                  />
                </div>
                <p className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>
                  Add a tag to categorize your lily (max 25 characters)
                </p>

                {/* Tag Suggestions Dropdown */}
                {showSuggestions && tagSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden"
                  >
                    <div className="py-1">
                      {isLoadingSuggestions ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          Loading suggestions...
                        </div>
                      ) : (
                        <>
                          <div className="px-3 py-1.5 font-medium text-muted-foreground bg-muted/50" style={{ fontSize: '0.875rem' }}>
                            Popular tags
                          </div>
                          {tagSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleTagSelect(suggestion)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10 transition-colors flex items-center gap-2 group"
                            >
                              <Hash className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                              <span className="group-hover:text-primary transition-colors">
                                #{suggestion}
                              </span>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Tabs value={lilyType} onValueChange={(v) => setLilyType(v as LilyType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="text">Text</TabsTrigger>
                  <TabsTrigger value="image">Image</TabsTrigger>
                  <TabsTrigger value="link">Link</TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="What's on your mind?"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      style={{ fontSize: '1rem' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Share your thoughts..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                      style={{ fontSize: '1rem' }}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title-image">Title</Label>
                    <Input
                      id="title-image"
                      placeholder="Give your image a title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      style={{ fontSize: '1rem' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Upload Image</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Image
                      </Button>
                      {imageFile && <span className="text-sm text-muted-foreground">{imageFile.name}</span>}
                    </div>
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="mt-4 max-h-64 rounded-lg object-cover" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content-image">Caption (optional)</Label>
                    <Textarea
                      id="content-image"
                      placeholder="Add a caption..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={4}
                      style={{ fontSize: '1rem' }}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="link" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title-link">Title</Label>
                    <Input
                      id="title-link"
                      placeholder="Give your link a title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      style={{ fontSize: '1rem' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="link">URL</Label>
                    <Input
                      id="link"
                      type="url"
                      placeholder="https://example.com"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      required={lilyType === 'link'}
                      style={{ fontSize: '1rem' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content-link">Description (optional)</Label>
                    <Textarea
                      id="content-link"
                      placeholder="Tell us about this link..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={4}
                      style={{ fontSize: '1rem' }}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={isPending || selectedPondNotJoined} 
                  className="flex-1"
                >
                  {isPending ? 'Creating...' : 'Create Lily'}
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
