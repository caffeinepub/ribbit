import { toast } from 'sonner';

/**
 * Share a lily using the Web Share API or clipboard fallback
 * @param lilyId - The ID of the lily to share
 */
export async function shareLily(lilyId: string): Promise<void> {
  const url = `${window.location.origin}/lily/${lilyId}`;

  // Try Web Share API first (mobile/supported browsers)
  if (navigator.share) {
    try {
      await navigator.share({ url });
      return;
    } catch (error: any) {
      // User cancelled or share failed
      if (error.name === 'AbortError') {
        // User cancelled, don't show error
        return;
      }
      // Fall through to clipboard copy
    }
  }

  // Fallback to clipboard copy
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } else {
      // Final fallback: create temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (success) {
        toast.success('Link copied to clipboard');
      } else {
        toast.error('Failed to copy link');
      }
    }
  } catch (error) {
    console.error('Failed to copy link:', error);
    toast.error('Failed to copy link');
  }
}
