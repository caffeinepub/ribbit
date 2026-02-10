import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreatePost, useGetAllPonds } from '@/hooks/useQueries';
import { getUsername } from '@/lib/user';
import { toast } from 'sonner';
import { Loader2, Image as ImageIcon, Link as LinkIcon, FileText } from 'lucide-react';
import { ExternalBlob } from '@/backend';
import { compressImageFile, revokePreviewUrl } from '@/lib/imageCompression';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [postType, setPostType] = useState<'text' | 'image' | 'link'>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [selectedPond, setSelectedPond] = useState('');
  const [tag, setTag] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressedBytes, setCompressedBytes] = useState<Uint8Array<ArrayBuffer> | null>(null);

  const { data: ponds, isLoading: isLoadingPonds } = useGetAllPonds();
  const createPost = useCreatePost();
  const username = getUsername();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imagePreview) {
      revokePreviewUrl(imagePreview);
    }

    try {
      const result = await compressImageFile(file);
      setImageFile(file);
      setCompressedBytes(result.bytes);
      setImagePreview(result.previewUrl);

      if (result.wasCompressed) {
        const savedPercent = Math.round((1 - result.compressedSize / result.originalSize) * 100);
        if (savedPercent > 0) {
          toast.success(`Image compressed (saved ${savedPercent}%)`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
      toast.error(errorMessage);
      setImageFile(null);
      setCompressedBytes(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!selectedPond) {
      toast.error('Please select a pond');
      return;
    }

    if (postType === 'text' && !content.trim()) {
      toast.error('Please enter content');
      return;
    }

    if (postType === 'link' && !link.trim()) {
      toast.error('Please enter a link');
      return;
    }

    if (postType === 'image' && !compressedBytes) {
      toast.error('Please select an image');
      return;
    }

    try {
      let imageBlob: ExternalBlob | null = null;
      if (postType === 'image' && compressedBytes) {
        imageBlob = ExternalBlob.fromBytes(compressedBytes);
      }

      const postId = await createPost.mutateAsync({
        title,
        content: postType === 'text' ? content : '',
        image: imageBlob,
        link: postType === 'link' ? link : null,
        pond: selectedPond,
        username,
        tag: tag.trim() || null,
      });

      toast.success('Post created successfully!');
      navigate({ to: '/lily/$id', params: { id: postId } });
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Failed to create post');
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create a Post</CardTitle>
          <CardDescription>Share your thoughts with the pond</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pond">Select Pond</Label>
            <Select value={selectedPond} onValueChange={setSelectedPond}>
              <SelectTrigger id="pond">
                <SelectValue placeholder="Choose a pond" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingPonds ? (
                  <SelectItem value="loading" disabled>
                    Loading ponds...
                  </SelectItem>
                ) : (
                  ponds?.map((pond) => (
                    <SelectItem key={pond.name} value={pond.name}>
                      {pond.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={postType} onValueChange={(v) => setPostType(v as typeof postType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text">
                <FileText className="h-4 w-4 mr-2" />
                Text
              </TabsTrigger>
              <TabsTrigger value="image">
                <ImageIcon className="h-4 w-4 mr-2" />
                Image
              </TabsTrigger>
              <TabsTrigger value="link">
                <LinkIcon className="h-4 w-4 mr-2" />
                Link
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tag">Tag (optional)</Label>
                <Input
                  id="tag"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g., discussion, question"
                />
              </div>

              <TabsContent value="text" className="space-y-2 mt-0">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={8}
                />
              </TabsContent>

              <TabsContent value="image" className="space-y-2 mt-0">
                <Label htmlFor="image">Upload Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full h-auto rounded-md border"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="link" className="space-y-2 mt-0">
                <Label htmlFor="link">Link URL</Label>
                <Input
                  id="link"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com"
                />
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => navigate({ to: '/' })}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createPost.isPending}>
              {createPost.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Post'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
