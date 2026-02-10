import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';

interface RibbitEmojiTrayProps {
  onEmojiSelect: (emoji: string) => void;
}

const emojis = ['👍', '❤️', '😂', '😐', '🔥', '🎉'];

export default function RibbitEmojiTray({ onEmojiSelect }: RibbitEmojiTrayProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1">
          {emojis.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              onClick={() => onEmojiSelect(emoji)}
              className="h-10 w-10 p-0 text-xl hover:scale-110 transition-transform hover:bg-primary/10"
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
