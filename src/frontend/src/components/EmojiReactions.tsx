import { useState } from 'react';
import { Button } from '@/components/ui/button';

export enum EmojiType {
  Heart = 'heart',
  Laugh = 'laugh',
  Fire = 'fire',
  Frog = 'frog',
  Wow = 'wow',
}

interface EmojiReactionsProps {
  reactions: Record<EmojiType, number>;
  selectedEmoji?: EmojiType | null;
  onReact: (emoji: EmojiType) => void;
  className?: string;
}

const emojiMap: Record<EmojiType, string> = {
  [EmojiType.Heart]: '❤️',
  [EmojiType.Laugh]: '😂',
  [EmojiType.Fire]: '🔥',
  [EmojiType.Frog]: '🐸',
  [EmojiType.Wow]: '😮',
};

export default function EmojiReactions({ reactions, selectedEmoji, onReact, className = '' }: EmojiReactionsProps) {
  const [hoveredEmoji, setHoveredEmoji] = useState<EmojiType | null>(null);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Object.entries(emojiMap).map(([type, emoji]) => {
        const emojiType = type as EmojiType;
        const count = reactions[emojiType] || 0;
        const isSelected = selectedEmoji === emojiType;
        const isHovered = hoveredEmoji === emojiType;

        return (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => onReact(emojiType)}
            onMouseEnter={() => setHoveredEmoji(emojiType)}
            onMouseLeave={() => setHoveredEmoji(null)}
            className={`h-8 px-2 transition-all ${
              isSelected
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'hover:bg-accent'
            } ${isHovered ? 'scale-110' : 'scale-100'}`}
          >
            <span className="text-base mr-1">{emoji}</span>
            {count > 0 && (
              <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                {count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
