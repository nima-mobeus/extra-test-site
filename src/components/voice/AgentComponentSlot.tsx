'use client';

import { useMemo } from 'react';
import { useVoiceSessionStore } from '@/lib/stores/voice-session-store';
import { DynamicComponentRenderer } from './DynamicComponentRenderer';

export function AgentComponentSlot() {
  const uiComponents = useVoiceSessionStore((state) => state.uiComponents);
  const templates = useVoiceSessionStore((state) => state.templates);

  const templateMap = useMemo(() => {
    return new Map(templates.map((template) => [template.id, template]));
  }, [templates]);

  if (uiComponents.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-10">
      <div className="mb-4 text-sm font-medium text-muted-foreground">
        Agent recommendations
      </div>
      <div className="space-y-4">
        {uiComponents.map((component) => {
          const template = templateMap.get(component.templateId);
          if (!template) return null;
          return (
            <DynamicComponentRenderer
              key={component.id}
              template={template}
              data={component.data}
            />
          );
        })}
      </div>
    </section>
  );
}
