import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VoiceSessionProvider } from '@/components/voice/VoiceSessionProvider';
import { VoiceOverlay } from '@/components/voice/VoiceOverlay';
import { AgentComponentSlot } from '@/components/voice/AgentComponentSlot';

const agentName = process.env.NEXT_PUBLIC_AGENT_NAME || 'AI Assistant';

export const metadata: Metadata = {
  title: agentName,
  description: `Talk to ${agentName} - powered by Mobeus`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <VoiceSessionProvider>
          <Header />
          <main>{children}</main>
          <AgentComponentSlot />
          <Footer />
          <VoiceOverlay />
        </VoiceSessionProvider>
      </body>
    </html>
  );
}
