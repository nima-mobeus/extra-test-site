'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  X,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Power,
  Loader2,
  Send,
} from 'lucide-react';
import { useVoiceSessionStore, type SessionState } from '@/lib/stores/voice-session-store';

export function VoiceOverlay() {
  const {
    sessionState,
    agentState,
    isOverlayVisible,
    isOverlayExpanded,
    isMuted,
    isVolumeMuted,
    transcripts,
    currentAgentName,
    avatarEnabled,
    avatarVisible,
    avatarAvailable,
    avatarTogglePending,
    avatarVideoTrack,
    toggleMute,
    toggleVolume,
    toggleAvatarVisible,
    toggleAvatarHard,
    sendTextMessage,
    connect,
    disconnect,
    setOverlayExpanded,
  } = useVoiceSessionStore();

  // Separate refs for different video elements
  const expandedVideoRef = useRef<HTMLVideoElement>(null);
  const minimizedVideoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [textInput, setTextInput] = useState('');

  const handleSend = async () => {
    const message = textInput.trim();
    if (!message) return;
    await sendTextMessage(message);
    setTextInput('');
  };

  // Attach video track to the appropriate video element based on current view
  useEffect(() => {
    if (!avatarVideoTrack || !avatarVisible) {
      if (avatarVideoTrack && !avatarVisible) {
        avatarVideoTrack.detach();
      }
      return;
    }

    let targetRef: React.RefObject<HTMLVideoElement | null>;
    if (isFullScreen) {
      targetRef = fullscreenVideoRef;
    } else if (isOverlayExpanded) {
      targetRef = expandedVideoRef;
    } else {
      targetRef = minimizedVideoRef;
    }

    const videoElement = targetRef.current;
    if (!videoElement) return;

    avatarVideoTrack.detach();
    avatarVideoTrack.attach(videoElement);

    return () => {
      avatarVideoTrack.detach(videoElement);
    };
  }, [avatarVideoTrack, avatarVisible, isOverlayExpanded, isFullScreen]);

  // Auto-scroll transcripts
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcripts]);

  // When idle, show a floating connect bubble in the bottom-right corner
  if (sessionState === 'idle') {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button
          onClick={connect}
          className="flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-colors hover:scale-105"
          title="Start voice chat"
        >
          <Mic className="w-6 h-6 text-white" />
        </button>
      </motion.div>
    );
  }

  // Show connecting spinner
  if (sessionState === 'connecting') {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <div className="flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full shadow-lg">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
      </motion.div>
    );
  }

  if (!isOverlayVisible) {
    return null;
  }

  const getStateLabel = () => {
    switch (agentState) {
      case 'listening': return 'Listening...';
      case 'thinking': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      default: return 'Connected';
    }
  };

  const getStatusColor = () => {
    switch (sessionState as SessionState) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getLiveKitLabel = () => {
    switch (sessionState as SessionState) {
      case 'connected': return 'LiveKit: Connected';
      case 'connecting': return 'LiveKit: Connecting...';
      case 'disconnecting': return 'LiveKit: Disconnecting...';
      case 'error': return 'LiveKit: Error';
      default: return 'LiveKit: Idle';
    }
  };

  const getAvatarLabel = () => {
    if (!avatarAvailable) return 'Avatar: Unavailable';
    if (!avatarEnabled) return 'Avatar: Off';
    if (avatarVideoTrack) return 'Avatar: On';
    return 'Avatar: Connecting...';
  };

  const hasAvatar = avatarEnabled && avatarVideoTrack && avatarVisible;
  const showAvatarVideo = hasAvatar;

  // Full screen avatar mode
  if (isFullScreen && hasAvatar) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <video
          ref={fullscreenVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div
            ref={transcriptRef}
            className="max-h-32 overflow-y-auto mb-4 text-white/90"
          >
            {transcripts.slice(-5).map((t) => (
              <div key={t.id} className={`text-sm ${t.participant === 'agent' ? 'text-blue-300' : ''}`}>
                <span className="font-medium">{t.participant === 'agent' ? currentAgentName : 'You'}:</span>{' '}
                {t.text}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-white/20'} hover:bg-white/30 transition-colors`}
            >
              {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
            </button>
            <button
              onClick={toggleVolume}
              className={`p-4 rounded-full ${isVolumeMuted ? 'bg-red-500' : 'bg-white/20'} hover:bg-white/30 transition-colors`}
            >
              {isVolumeMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
            </button>
            {avatarAvailable && (
              <button
                onClick={toggleAvatarHard}
                className={`p-4 rounded-full ${avatarEnabled ? 'bg-green-500' : 'bg-white/20'} hover:bg-white/30 transition-colors`}
                title={avatarEnabled ? 'Turn avatar off (hard)' : 'Turn avatar on (hard)'}
                disabled={avatarTogglePending}
              >
                {avatarTogglePending ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Power className="w-6 h-6 text-white" />}
              </button>
            )}
            {avatarAvailable && (
              <button
                onClick={toggleAvatarVisible}
                className={`p-4 rounded-full ${avatarVisible ? 'bg-white/20' : 'bg-white/30'} hover:bg-white/30 transition-colors`}
                disabled={!avatarEnabled}
                title={avatarVisible ? 'Hide avatar (soft)' : 'Show avatar (soft)'}
              >
                {avatarVisible ? <Eye className="w-6 h-6 text-white" /> : <EyeOff className="w-6 h-6 text-white" />}
              </button>
            )}
            <button
              onClick={() => setIsFullScreen(false)}
              className="p-4 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <Minimize2 className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={disconnect}
              className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="absolute top-4 left-4 space-y-1 text-white">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
            <span className="text-sm">{getLiveKitLabel()}</span>
          </div>
          <div className="text-xs text-white/80">Agent: {getStateLabel()}</div>
        </div>
        <div className="absolute top-4 right-4 text-xs text-white/80 bg-black/40 px-2 py-1 rounded">
          {getAvatarLabel()}
        </div>
      </div>
    );
  }

  // Minimized mode
  if (!isOverlayExpanded) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button
          onClick={() => setOverlayExpanded(true)}
          className="relative flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-colors overflow-hidden"
        >
          <div className={`absolute top-0 right-0 w-4 h-4 rounded-full ${getStatusColor()} border-2 border-white z-10`} />

          {hasAvatar ? (
            <div className="w-full h-full relative">
              <video
                ref={minimizedVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button>

        <div className="absolute -top-2 -left-2 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            className={`p-1.5 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} text-white`}
          >
            {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); disconnect(); }}
            className="p-1.5 rounded-full bg-gray-700 text-white hover:bg-red-500"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Expanded mode
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              <span className="text-xs text-gray-500">{getLiveKitLabel()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{currentAgentName || 'Voice Assistant'}</span>
              {!avatarAvailable && (
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                  Avatar unavailable
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasAvatar && (
              <button
                onClick={() => setIsFullScreen(true)}
                className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                title="Full screen"
              >
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
            )}
            <button
              onClick={() => setOverlayExpanded(false)}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            >
              <Minimize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Avatar Video or Placeholder */}
        <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
          {showAvatarVideo ? (
            <video
              ref={expandedVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`w-20 h-20 rounded-full bg-white/20 flex items-center justify-center
                  ${agentState === 'speaking' ? 'animate-pulse' : ''}
                `}
              >
                <span className="text-4xl">🎙️</span>
              </div>
              {avatarEnabled && !avatarVideoTrack && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
                  Waiting for avatar...
                </div>
              )}
              {avatarEnabled && avatarVideoTrack && !avatarVisible && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
                  Avatar hidden
                </div>
              )}
            </div>
          )}

          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
            Agent: {getStateLabel()}
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
            {getAvatarLabel()}
          </div>
        </div>

        {/* Transcript */}
        <div
          ref={transcriptRef}
          className="h-48 overflow-y-auto p-3 text-sm space-y-2 bg-gray-50 flex flex-col"
        >
          {transcripts.length === 0 ? (
            <p className="text-gray-400 text-center my-auto">Conversation will appear here...</p>
          ) : (
            transcripts.map((t) => (
              <div key={t.id} className={t.participant === 'agent' ? 'text-blue-600' : 'text-gray-800'}>
                <span className="font-medium">{t.participant === 'agent' ? currentAgentName : 'You'}:</span>{' '}
                {t.text}
              </div>
            ))
          )}
        </div>

        {/* Text input */}
        <div className="border-t bg-white p-3">
          <div className="flex items-center gap-2">
            <input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sessionState !== 'connected'}
            />
            <button
              onClick={handleSend}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={sessionState !== 'connected' || textInput.trim().length === 0}
              title="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 p-3 border-t bg-white">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition-colors ${
                isMuted
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isMuted ? 'Unmute mic' : 'Mute mic'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleVolume}
              className={`p-3 rounded-full transition-colors ${
                isVolumeMuted
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isVolumeMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isVolumeMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {avatarAvailable && (
              <button
                onClick={toggleAvatarHard}
                className={`p-3 rounded-full transition-colors ${
                  avatarEnabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={avatarEnabled ? 'Turn avatar off (hard)' : 'Turn avatar on (hard)'}
                disabled={avatarTogglePending}
              >
                {avatarTogglePending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5" />}
              </button>
            )}

            {avatarAvailable && (
              <button
                onClick={toggleAvatarVisible}
                className={`p-3 rounded-full transition-colors ${
                  avatarVisible
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={avatarVisible ? 'Hide avatar (soft)' : 'Show avatar (soft)'}
                disabled={!avatarEnabled}
              >
                {avatarVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            )}
          </div>

          <button
            onClick={disconnect}
            className="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors font-medium"
          >
            End
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
