'use client';

/**
 * HelloWorld — Demo component for testing the Mobeus component discovery pipeline.
 *
 * When pushed to this repo, the component-discovery-service analyzes this file,
 * extracts the Props interface into a JSON Schema, and auto-registers it as a
 * ComponentTemplate in the platform.  The voice agent can then call show_component
 * with type "HelloWorld" to render this card inside the VoiceOverlay.
 */

interface Props {
  /** Main message to display */
  message: string;
  /** Recipient name for the greeting */
  name?: string;
  /** Hex accent color for the border and heading */
  accentColor?: string;
  /** Optional emoji to show next to the heading */
  emoji?: string;
}

export default function HelloWorld({
  message,
  name,
  accentColor = '#2563eb',
  emoji = '👋',
}: Props) {
  return (
    <div
      className="rounded-xl border-2 bg-white p-6 shadow-sm text-center space-y-3"
      style={{ borderColor: accentColor }}
    >
      <h2 className="text-2xl font-bold" style={{ color: accentColor }}>
        {emoji} Hello{name ? `, ${name}` : ''}!
      </h2>
      <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
      <div
        className="inline-block rounded-full px-3 py-1 text-xs font-medium text-white"
        style={{ backgroundColor: accentColor }}
      >
        Mobeus Component Discovery ✓
      </div>
    </div>
  );
}
