export interface ComponentTemplate {
  id: string;
  name: string;
  type: string;
  schema: Record<string, unknown>;
  defaultData: Record<string, unknown>;
  uiConfig: Record<string, unknown>;
  isActive?: boolean;
  version?: number;
}

export interface SessionDefaults {
  avatarEnabled: boolean;
  avatarVisible: boolean;
  micMuted: boolean;
  volumeMuted: boolean;
  avatarAvailable?: boolean;
}
