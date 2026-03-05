'use client';

import { useVoiceSessionStore } from '@/lib/stores/voice-session-store';
import { Button } from '@/components/ui/button';
import { Phone, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceConnectButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function VoiceConnectButton({
  className,
  variant = 'default',
  size = 'default',
}: VoiceConnectButtonProps) {
  const { sessionState, connect, setOverlayExpanded } = useVoiceSessionStore();

  const isConnected = sessionState === 'connected';
  const isConnecting = sessionState === 'connecting';
  const isIdle = sessionState === 'idle' || sessionState === 'error';

  const handleClick = async () => {
    if (isConnected) {
      // Already connected, just expand the overlay
      setOverlayExpanded(true);
    } else if (isIdle) {
      // Start new connection (agent determined by API key)
      try {
        await connect();
      } catch (error) {
        console.error('Failed to connect:', error);
      }
    }
  };

  if (isConnected) {
    return (
      <Button
        variant="outline"
        size={size}
        className={cn('gap-2', className)}
        onClick={handleClick}
      >
        <Phone className="h-4 w-4 text-green-600" />
        View Conversation
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('gap-2', className)}
      onClick={handleClick}
      disabled={isConnecting}
    >
      {isConnecting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Phone className="h-4 w-4" />
          Start Voice Chat
        </>
      )}
    </Button>
  );
}
