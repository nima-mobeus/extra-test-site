'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVoiceSessionStore } from '@/lib/stores/voice-session-store';

interface VoiceSessionProviderProps {
  children: React.ReactNode;
}

export function VoiceSessionProvider({ children }: VoiceSessionProviderProps) {
  const router = useRouter();
  const disconnect = useVoiceSessionStore((state) => state.disconnect);

  // Listen for agent navigation commands
  useEffect(() => {
    const handleAgentNavigate = (event: CustomEvent) => {
      const { page, params } = event.detail;

      // Build URL with params
      let url = page;
      if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams(params);
        url = `${page}?${searchParams.toString()}`;
      }

      // Use Next.js router for client-side navigation
      // This preserves the voice connection!
      router.push(url);
    };

    window.addEventListener('agent-navigate', handleAgentNavigate as EventListener);

    return () => {
      window.removeEventListener('agent-navigate', handleAgentNavigate as EventListener);
    };
  }, [router]);

  // Cleanup on unmount (app close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnect();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [disconnect]);

  return <>{children}</>;
}
