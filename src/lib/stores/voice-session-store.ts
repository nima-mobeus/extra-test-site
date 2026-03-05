import { create } from 'zustand';
import {
  Room,
  RoomEvent,
  ConnectionState,
  Track,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  Participant,
  ParticipantKind
} from 'livekit-client';
import { ComponentTemplate } from '@/types';

// Agent state from LiveKit
export type AgentState =
  | 'initializing'
  | 'listening'
  | 'thinking'
  | 'speaking';

// Connection state
export type SessionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'error';

// Transcript entry
export interface TranscriptEntry {
  id: string;
  text: string;
  participant: 'user' | 'agent';
  participantName: string;
  timestamp: Date;
  isFinal: boolean;
  isAgent: boolean;
}

// UI Component from agent RPC
export interface UIComponent {
  id: string;
  templateId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

// Store state
interface VoiceSessionState {
  // Connection
  room: Room | null;
  sessionId: string | null;
  sessionState: SessionState;
  error: string | null;

  // Agent
  agentName: string | null;
  currentAgentName: string | null;
  agentState: AgentState;
  agentParticipant: RemoteParticipant | null;

  // Avatar state
  avatarEnabled: boolean;
  avatarVisible: boolean;
  avatarAvailable: boolean;
  avatarTogglePending: boolean;
  avatarVideoTrack: RemoteTrack | null;
  avatarAudioTrack: RemoteTrack | null;
  agentAudioTrack: RemoteTrack | null;
  avatarParticipant: RemoteParticipant | null;
  avatarAudioElement: HTMLAudioElement | null;
  agentAudioElement: HTMLAudioElement | null;

  // Audio
  isMuted: boolean;
  isVolumeMuted: boolean;

  // Transcripts
  transcripts: TranscriptEntry[];

  // UI Components (from agent RPC)
  uiComponents: UIComponent[];
  templates: ComponentTemplate[];

  // Overlay state
  isOverlayExpanded: boolean;
  isOverlayVisible: boolean;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  toggleMute: () => void;
  toggleVolume: () => void;
  toggleAvatarVisible: () => void;
  toggleAvatarHard: () => Promise<void>;
  sendTextMessage: (text: string) => Promise<void>;
  setOverlayExpanded: (expanded: boolean) => void;
  setOverlayVisible: (visible: boolean) => void;
  clearTranscripts: () => void;
  addUIComponent: (component: Omit<UIComponent, 'id' | 'timestamp'>) => void;
  removeUIComponent: (id: string) => void;
  clearUIComponents: () => void;
  submitForm: (templateId: string, formId: string, values: Record<string, unknown>) => Promise<void>;
}

const AGENT_STATE_ATTRIBUTE = 'lk.agent.state';

export const useVoiceSessionStore = create<VoiceSessionState>((set, get) => ({
  // Initial state
  room: null,
  sessionId: null,
  sessionState: 'idle',
  error: null,
  agentName: null,
  currentAgentName: null,
  agentState: 'initializing',
  agentParticipant: null,

  // Avatar state
  avatarEnabled: false,
  avatarVisible: true,
  avatarAvailable: false,
  avatarTogglePending: false,
  avatarVideoTrack: null,
  avatarAudioTrack: null,
  agentAudioTrack: null,
  avatarParticipant: null,
  avatarAudioElement: null,
  agentAudioElement: null,

  isMuted: false,
  isVolumeMuted: false,
  transcripts: [],
  uiComponents: [],
  templates: [],
  isOverlayExpanded: false,
  isOverlayVisible: true,

  // Connect to voice session via widget API (no agentId needed — determined by API key)
  connect: async () => {
    const { sessionState, room: existingRoom } = get();

    if (sessionState !== 'idle' && sessionState !== 'error') {
      console.warn('Already connecting or connected');
      return;
    }

    // Clean up any existing room
    if (existingRoom) {
      await existingRoom.disconnect();
    }

    set({
      sessionState: 'connecting',
      error: null,
      transcripts: [],
      uiComponents: [],
      templates: [],
      agentState: 'initializing',
      agentName: null,
      currentAgentName: null,
      // Reset avatar state
      avatarEnabled: false,
      avatarVisible: true,
      avatarAvailable: false,
      avatarTogglePending: false,
      avatarVideoTrack: null,
      avatarAudioTrack: null,
      agentAudioTrack: null,
      avatarParticipant: null,
      avatarAudioElement: null,
      agentAudioElement: null,
      isVolumeMuted: false,
    });

    try {
      // Read env vars injected by deploy service
      const widgetHost = process.env.NEXT_PUBLIC_WIDGET_HOST || 'https://app.mobeus.ai';
      const apiKey = process.env.NEXT_PUBLIC_WIDGET_API_KEY || '';

      if (!apiKey) {
        throw new Error('Widget API key not configured');
      }

      // Create session via widget API
      const response = await fetch(`${widgetHost}/api/widget/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const sessionData = await response.json();

      // API response: { agent: { name }, defaults: { avatarEnabled, avatarVisible, micMuted, volumeMuted, avatarAvailable }, ... }
      const defaults = sessionData.defaults || {};
      const avatarAvailable = Boolean(defaults.avatarAvailable);
      const rawAvatarEnabled =
        typeof defaults.avatarEnabled === 'boolean'
          ? defaults.avatarEnabled
          : false;
      const defaultAvatarEnabled = avatarAvailable ? rawAvatarEnabled : false;
      const defaultAvatarVisible =
        avatarAvailable && typeof defaults.avatarVisible === 'boolean'
          ? defaults.avatarVisible
          : defaultAvatarEnabled;
      const defaultMicMuted =
        typeof defaults.micMuted === 'boolean' ? defaults.micMuted : false;
      const defaultVolumeMuted =
        typeof defaults.volumeMuted === 'boolean' ? defaults.volumeMuted : false;

      const resolvedAgentName = sessionData.agent?.name || 'AI Assistant';

      set({
        avatarEnabled: defaultAvatarEnabled,
        avatarVisible: defaultAvatarVisible,
        avatarAvailable,
        avatarTogglePending: false,
        isMuted: defaultMicMuted,
        isVolumeMuted: defaultVolumeMuted,
        agentName: resolvedAgentName,
        currentAgentName: resolvedAgentName,
      });

      // Store templates for rendering
      if (Array.isArray(sessionData.templates)) {
        set({ templates: sessionData.templates });
      } else {
        set({ templates: [] });
      }

      // Create and configure room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Set up event listeners
      setupRoomEventListeners(room, set, get);

      // Connect to the room
      await room.connect(sessionData.wsUrl || sessionData.livekitUrl, sessionData.token);

      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(!defaultMicMuted);

      // Register RPC handlers for agent UI control
      registerRpcHandlers(room, set, get);

      set({
        room,
        sessionId: sessionData.sessionId,
        sessionState: 'connected',
        isOverlayExpanded: true, // Auto-expand when connected
      });
      applyAudioRouting(get);

      // Note: No PATCH /api/sessions/{id} needed — agent shutdown callback handles persistence

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Connection failed');
      set({
        sessionState: 'error',
        error: error.message,
      });
      console.error(error);
    }
  },

  // Disconnect from session
  disconnect: async () => {
    const { room, avatarAudioElement, agentAudioElement } = get();

    if (!room) return;

    set({ sessionState: 'disconnecting' });

    try {
      // Note: No PATCH /api/sessions/{id} needed — agent shutdown callback handles persistence
      await room.disconnect();

    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      avatarAudioElement?.remove();
      agentAudioElement?.remove();
      set({
        room: null,
        sessionId: null,
        sessionState: 'idle',
        agentState: 'initializing',
        agentParticipant: null,
        isMuted: false,
        isVolumeMuted: false,
        isOverlayExpanded: false,
        avatarEnabled: false,
        avatarVisible: true,
        avatarAvailable: false,
        avatarTogglePending: false,
        avatarVideoTrack: null,
        avatarAudioTrack: null,
        agentAudioTrack: null,
        avatarParticipant: null,
        avatarAudioElement: null,
        agentAudioElement: null,
        uiComponents: [],
        templates: [],
      });
    }
  },

  // Toggle microphone mute
  toggleMute: () => {
    const { room, isMuted } = get();
    if (!room?.localParticipant) return;

    const newMuted = !isMuted;
    room.localParticipant.setMicrophoneEnabled(!newMuted);
    set({ isMuted: newMuted });
  },

  // Toggle output volume (avatar audio or agent audio)
  toggleVolume: () => {
    const { isVolumeMuted } = get();
    const newMuted = !isVolumeMuted;
    set({ isVolumeMuted: newMuted });
    applyAudioRouting(get);
  },

  // Toggle avatar visibility (soft)
  toggleAvatarVisible: () => {
    const { avatarVisible } = get();
    set({ avatarVisible: !avatarVisible });
  },

  // Toggle avatar connection (hard)
  toggleAvatarHard: async () => {
    const { room, agentParticipant, avatarEnabled, avatarAvailable } = get();
    if (!room?.localParticipant || !avatarAvailable) return;

    let targetAgent = agentParticipant;
    if (!targetAgent) {
      for (const participant of room.remoteParticipants.values()) {
        if (
          participant.kind === ParticipantKind.AGENT &&
          !participant.attributes?.['lk.publish_on_behalf']
        ) {
          targetAgent = participant;
          set({ agentParticipant: participant });
          break;
        }
      }
    }

    if (!targetAgent) {
      console.warn('No agent participant available for avatar toggle');
      return;
    }

    const nextEnabled = !avatarEnabled;
    try {
      set({ avatarTogglePending: true });
      const response = await room.localParticipant.performRpc({
        destinationIdentity: targetAgent.identity,
        method: 'avatarToggle',
        payload: JSON.stringify({ enabled: nextEnabled }),
      });

      let parsed: { success?: boolean } = {};
      try {
        parsed = JSON.parse(response || '{}');
      } catch {
        parsed = {};
      }

      if (parsed.success !== false) {
        set({ avatarEnabled: nextEnabled });
        if (nextEnabled) {
          set({ avatarVisible: true });
        }
        applyAudioRouting(get);
      }
    } catch (error) {
      console.error('RPC avatarToggle error:', error);
    } finally {
      set({ avatarTogglePending: false });
    }
  },

  // Send typed text input to the agent
  sendTextMessage: async (text: string) => {
    const { room } = get();
    if (!room?.localParticipant) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      await room.localParticipant.sendText(trimmed, { topic: 'lk.chat' });
      set((state) => ({
        transcripts: [
          ...state.transcripts,
          {
            id: `user-text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: trimmed,
            participant: 'user',
            participantName: 'You',
            timestamp: new Date(),
            isFinal: true,
            isAgent: false,
          },
        ],
      }));
    } catch (error) {
      console.error('Failed to send text input:', error);
    }
  },

  // Overlay controls
  setOverlayExpanded: (expanded) => set({ isOverlayExpanded: expanded }),
  setOverlayVisible: (visible) => set({ isOverlayVisible: visible }),

  // Transcript management
  clearTranscripts: () => set({ transcripts: [] }),

  // UI Component management (for agent RPC)
  addUIComponent: (component) => {
    const newComponent: UIComponent = {
      ...component,
      id: `ui-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    set((state) => ({
      uiComponents: [...state.uiComponents, newComponent],
    }));
  },

  removeUIComponent: (id) => {
    set((state) => ({
      uiComponents: state.uiComponents.filter((c) => c.id !== id),
    }));
  },

  clearUIComponents: () => set({ uiComponents: [] }),

  submitForm: async (templateId, formId, values) => {
    const { room, agentParticipant } = get();
    if (!room?.localParticipant || !agentParticipant) return;

    try {
      await room.localParticipant.performRpc({
        destinationIdentity: agentParticipant.identity,
        method: 'formSubmit',
        payload: JSON.stringify({ templateId, formId, values }),
      });
    } catch (error) {
      console.error('RPC formSubmit error:', error);
    }
  },
}));

function applyAudioRouting(get: () => VoiceSessionState) {
  const {
    avatarEnabled,
    isVolumeMuted,
    avatarAudioElement,
    agentAudioElement,
  } = get();

  const useAvatarAudio = avatarEnabled && !!avatarAudioElement;

  if (agentAudioElement) {
    agentAudioElement.muted = isVolumeMuted || useAvatarAudio;
  }

  if (avatarAudioElement) {
    avatarAudioElement.muted = isVolumeMuted || !useAvatarAudio;
  }
}

// Helper: Set up room event listeners
function setupRoomEventListeners(
  room: Room,
  set: (state: Partial<VoiceSessionState> | ((state: VoiceSessionState) => Partial<VoiceSessionState>)) => void,
  get: () => VoiceSessionState
) {
  // Connection state changes
  room.on(RoomEvent.ConnectionStateChanged, (connectionState: ConnectionState) => {
    console.log('Connection state:', connectionState);
    if (connectionState === ConnectionState.Disconnected) {
      const { avatarAudioElement, agentAudioElement } = get();
      avatarAudioElement?.remove();
      agentAudioElement?.remove();
      set({
        sessionState: 'idle',
        agentState: 'initializing',
        agentParticipant: null,
        room: null,
        avatarEnabled: false,
        avatarVisible: true,
        avatarAvailable: false,
        avatarTogglePending: false,
        avatarVideoTrack: null,
        avatarAudioTrack: null,
        agentAudioTrack: null,
        avatarParticipant: null,
        avatarAudioElement: null,
        agentAudioElement: null,
        isMuted: false,
        isVolumeMuted: false,
        uiComponents: [],
        templates: [],
      });
    }
  });

  // Track subscriptions (for agent/avatar audio and video)
  room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
    console.log('Track subscribed:', track.kind, 'from', participant.identity);

    const publishOnBehalf = participant.attributes?.['lk.publish_on_behalf'];

    if (publishOnBehalf) {
      console.log('Avatar worker track received:', track.kind);

      if (track.kind === Track.Kind.Video) {
        set({
          avatarVideoTrack: track,
          avatarParticipant: participant,
        });
      } else if (track.kind === Track.Kind.Audio) {
        const audioElement = track.attach() as HTMLAudioElement;
        audioElement.id = `audio-avatar-${participant.identity}`;
        audioElement.autoplay = true;
        document.body.appendChild(audioElement);
        audioElement.play().catch((e) => console.warn('Avatar audio autoplay blocked:', e));
        set({ avatarAudioTrack: track, avatarAudioElement: audioElement });
        applyAudioRouting(get);
      }
    } else if (track.kind === Track.Kind.Audio) {
      if (participant.kind === ParticipantKind.AGENT) {
        const audioElement = track.attach() as HTMLAudioElement;
        audioElement.id = `audio-agent-${participant.identity}`;
        audioElement.autoplay = true;
        document.body.appendChild(audioElement);
        audioElement.play().catch((e) => console.warn('Agent audio autoplay blocked:', e));
        set({ agentAudioTrack: track, agentAudioElement: audioElement });
        applyAudioRouting(get);
      }
    }
  });

  room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
    console.log('Track unsubscribed:', track.kind);

    if (track.kind === Track.Kind.Audio) {
      const avatarElementId = `audio-avatar-${participant.identity}`;
      const agentElementId = `audio-agent-${participant.identity}`;
      document.getElementById(avatarElementId)?.remove();
      document.getElementById(agentElementId)?.remove();
    }

    const publishOnBehalf = participant.attributes?.['lk.publish_on_behalf'];
    if (publishOnBehalf) {
      if (track.kind === Track.Kind.Video) {
        set({ avatarVideoTrack: null });
      } else if (track.kind === Track.Kind.Audio) {
        set({ avatarAudioTrack: null, avatarAudioElement: null });
        applyAudioRouting(get);
      }
    } else if (track.kind === Track.Kind.Audio && participant.kind === ParticipantKind.AGENT) {
      set({ agentAudioTrack: null, agentAudioElement: null });
      applyAudioRouting(get);
    }

    track.detach();
  });

  // Participant connected
  room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
    console.log('Participant connected:', participant.identity, 'kind:', participant.kind);

    const publishOnBehalf = participant.attributes?.['lk.publish_on_behalf'];
    if (publishOnBehalf) {
      console.log('Avatar worker connected');
      set({ avatarParticipant: participant });
      return;
    }

    if (participant.kind === ParticipantKind.AGENT) {
      set({ agentParticipant: participant });
      updateAgentStateFromAttributes(participant, set);

      participant.on('attributesChanged', (changedAttributes) => {
        if (AGENT_STATE_ATTRIBUTE in changedAttributes) {
          updateAgentStateFromAttributes(participant, set);
        }
      });
    }
  });

  // Participant disconnected
  room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
    console.log('Participant disconnected:', participant.identity);

    const state = get();
    if (state.avatarParticipant?.identity === participant.identity) {
      set({
        avatarParticipant: null,
        avatarVideoTrack: null,
        avatarAudioTrack: null,
        avatarAudioElement: null,
      });
      applyAudioRouting(get);
    }
  });

  // Participant attribute changes (agent state updates)
  room.on(RoomEvent.ParticipantAttributesChanged, (changedAttributes, participant) => {
    const { agentParticipant } = get();
    if (
      participant.kind === ParticipantKind.AGENT ||
      participant.identity === agentParticipant?.identity
    ) {
      if (participant.attributes?.['lk.publish_on_behalf']) {
        return;
      }
      if (AGENT_STATE_ATTRIBUTE in changedAttributes) {
        updateAgentStateFromAttributes(participant, set);
      }
    }
  });

  // Transcription received
  room.on(RoomEvent.TranscriptionReceived, (segments, participant, publication) => {
    const { agentParticipant } = get();

    for (const segment of segments) {
      const isAgent =
        participant?.kind === ParticipantKind.AGENT ||
        participant?.identity === agentParticipant?.identity;

      const entry: TranscriptEntry = {
        id: segment.id,
        text: segment.text,
        participant: isAgent ? 'agent' : 'user',
        participantName: participant?.name || participant?.identity || 'Unknown',
        timestamp: new Date(),
        isFinal: segment.final,
        isAgent,
      };

      set((state) => {
        const existingIndex = state.transcripts.findIndex((t) => t.id === segment.id);
        if (existingIndex >= 0) {
          const updated = [...state.transcripts];
          updated[existingIndex] = entry;
          return { transcripts: updated };
        }
        return { transcripts: [...state.transcripts, entry] };
      });
    }
  });

  // Disconnection
  room.on(RoomEvent.Disconnected, () => {
    const { avatarAudioElement, agentAudioElement } = get();
    avatarAudioElement?.remove();
    agentAudioElement?.remove();
    set({
      sessionState: 'idle',
      agentState: 'initializing',
      agentParticipant: null,
      room: null,
      avatarEnabled: false,
      avatarVisible: true,
      avatarAvailable: false,
      avatarTogglePending: false,
      avatarVideoTrack: null,
      avatarAudioTrack: null,
      agentAudioTrack: null,
      avatarParticipant: null,
      avatarAudioElement: null,
      agentAudioElement: null,
      isMuted: false,
      isVolumeMuted: false,
      uiComponents: [],
      templates: [],
    });
  });

  // Check for existing agent participants
  for (const participant of room.remoteParticipants.values()) {
    if (participant.attributes?.['lk.publish_on_behalf']) {
      set({ avatarParticipant: participant });
      continue;
    }

    if (participant.kind === ParticipantKind.AGENT) {
      set({ agentParticipant: participant });
      updateAgentStateFromAttributes(participant, set);

      participant.on('attributesChanged', (changedAttributes) => {
        if (AGENT_STATE_ATTRIBUTE in changedAttributes) {
          updateAgentStateFromAttributes(participant, set);
        }
      });
    }
  }
}

// Helper: Update agent state from participant attributes
function updateAgentStateFromAttributes(
  participant: Participant,
  set: (state: Partial<VoiceSessionState>) => void
) {
  const stateAttr = participant.attributes[AGENT_STATE_ATTRIBUTE];
  if (stateAttr) {
    set({ agentState: stateAttr as AgentState });
  }
}

// Helper: Register RPC handlers for agent UI control
function registerRpcHandlers(
  room: Room,
  set: (state: Partial<VoiceSessionState> | ((state: VoiceSessionState) => Partial<VoiceSessionState>)) => void,
  get: () => VoiceSessionState
) {
  const localParticipant = room.localParticipant;

  // Handler: Show UI component
  localParticipant.registerRpcMethod('showComponent', async (data) => {
    try {
      const payload = JSON.parse(data.payload);
      console.log('RPC: showComponent', payload);
      if (!payload.templateId) {
        return JSON.stringify({ success: false, error: 'templateId is required' });
      }

      const componentId =
        typeof payload.id === 'string' && payload.id.length > 0
          ? payload.id
          : `ui-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      set((state) => {
        const existingIndex = state.uiComponents.findIndex((c) => c.id === componentId);
        if (existingIndex >= 0) {
          const updated = [...state.uiComponents];
          updated[existingIndex] = {
            ...updated[existingIndex],
            templateId: payload.templateId,
            data: payload.data || {},
            timestamp: new Date(),
          };
          return { uiComponents: updated };
        }

        return {
          uiComponents: [
            ...state.uiComponents,
            {
              id: componentId,
              templateId: payload.templateId,
              data: payload.data || {},
              timestamp: new Date(),
            },
          ],
        };
      });

      return JSON.stringify({ success: true, id: componentId });
    } catch (error) {
      console.error('RPC showComponent error:', error);
      return JSON.stringify({ success: false, error: String(error) });
    }
  });

  // Handler: Hide/remove UI component
  localParticipant.registerRpcMethod('hideComponent', async (data) => {
    try {
      const payload = JSON.parse(data.payload);
      console.log('RPC: hideComponent', payload);

      set((state) => ({
        uiComponents: state.uiComponents.filter((c) => c.id !== payload.id),
      }));

      return JSON.stringify({ success: true });
    } catch (error) {
      console.error('RPC hideComponent error:', error);
      return JSON.stringify({ success: false, error: String(error) });
    }
  });

  // Handler: Navigate to page (client-side navigation)
  localParticipant.registerRpcMethod('navigate', async (data) => {
    try {
      const payload = JSON.parse(data.payload);
      console.log('RPC: navigate', payload);

      // Use Next.js router for client-side navigation (preserves connection)
      window.dispatchEvent(
        new CustomEvent('agent-navigate', { detail: payload })
      );

      return JSON.stringify({ success: true });
    } catch (error) {
      console.error('RPC navigate error:', error);
      return JSON.stringify({ success: false, error: String(error) });
    }
  });

  // Handler: Clear all UI components
  localParticipant.registerRpcMethod('clearComponents', async () => {
    console.log('RPC: clearComponents');
    set({ uiComponents: [] });
    return JSON.stringify({ success: true });
  });
}
