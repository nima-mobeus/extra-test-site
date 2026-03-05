'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { ComponentTemplate } from '@/types';
import { useVoiceSessionStore } from '@/lib/stores/voice-session-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import BarChart from '@/components/BarChart';

interface DynamicComponentRendererProps {
  template: ComponentTemplate;
  data?: Record<string, unknown> | null;
}

function mergeTemplateData(
  defaultData: Record<string, unknown> | undefined,
  overrideData: Record<string, unknown> | undefined
) {
  return {
    ...(defaultData || {}),
    ...(overrideData || {}),
  };
}

function getMissingRequiredFields(
  schema: Record<string, any> | undefined,
  data: Record<string, any>
) {
  const required = Array.isArray(schema?.required) ? schema?.required : [];
  return required.filter((field: string) => data[field] === undefined || data[field] === '');
}

function getAccentColor(uiConfig: Record<string, any> | undefined) {
  return uiConfig?.accentColor || '#2563eb';
}

function renderProductCard(template: ComponentTemplate, data: Record<string, any>) {
  const uiConfig = template.uiConfig || {};
  const accentColor = getAccentColor(uiConfig);

  const tags: string[] = Array.isArray(data.tags) ? data.tags : [];
  const rating = typeof data.rating === 'number' ? data.rating : null;

  return (
    <Card className="w-full border" style={{ borderColor: accentColor }}>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{data.name}</CardTitle>
            {data.badge && (
              <Badge style={{ backgroundColor: accentColor }} className="text-white">
                {data.badge}
              </Badge>
            )}
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold" style={{ color: accentColor }}>
              {data.price}
            </div>
            {data.currency && (
              <div className="text-xs text-muted-foreground">{data.currency}</div>
            )}
          </div>
        </div>
        {data.description && (
          <p className="text-sm text-muted-foreground">{data.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {data.imageUrl && (
          <div className="w-full overflow-hidden rounded-md border">
            <img
              src={data.imageUrl}
              alt={data.name || 'Product image'}
              className="h-40 w-full object-cover"
            />
          </div>
        )}

        {uiConfig.showRating && rating !== null && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{rating.toFixed(1)} ★</span>
            {typeof data.reviewCount === 'number' && (
              <span className="text-muted-foreground">({data.reviewCount} reviews)</span>
            )}
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {data.ctaUrl && (
          <Button asChild style={{ backgroundColor: accentColor }}>
            <a href={data.ctaUrl} target="_blank" rel="noopener noreferrer">
              {data.ctaLabel || 'Learn more'}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function renderImageGallery(template: ComponentTemplate, data: Record<string, any>) {
  const uiConfig = template.uiConfig || {};
  const layout = data.layout === 'grid' ? 'grid' : 'carousel';
  const columns = typeof data.columns === 'number' ? data.columns : 3;
  const images: Array<Record<string, any>> = Array.isArray(data.images) ? data.images : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{data.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {layout === 'grid' ? (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {images.map((image, index) => (
              <div key={`${image.id || image.url || 'image'}-${index}`} className="space-y-2">
                <img
                  src={image.url}
                  alt={image.alt || 'Gallery image'}
                  className="h-32 w-full rounded-md object-cover"
                />
                {uiConfig.showCaptions && image.caption && (
                  <p className="text-xs text-muted-foreground">{image.caption}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <div key={`${image.id || image.url || 'image'}-${index}`} className="min-w-[220px] space-y-2">
                <img
                  src={image.url}
                  alt={image.alt || 'Gallery image'}
                  className="h-32 w-full rounded-md object-cover"
                />
                {uiConfig.showCaptions && image.caption && (
                  <p className="text-xs text-muted-foreground">{image.caption}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FormRenderer({ template, data }: { template: ComponentTemplate; data: Record<string, any> }) {
  const submitForm = useVoiceSessionStore((state) => state.submitForm);
  const uiConfig = template.uiConfig || {};
  const accentColor = getAccentColor(uiConfig);

  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    if (Array.isArray(data.fields)) {
      data.fields.forEach((field: any) => {
        if (field.defaultValue !== undefined) {
          initial[field.name] = field.defaultValue;
        } else if (field.type === 'checkbox') {
          initial[field.name] = false;
        } else {
          initial[field.name] = '';
        }
      });
    }
    return initial;
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await submitForm(template.id, data.id || template.id, values);
    setSubmitted(true);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{data.title}</CardTitle>
        {data.description && (
          <p className="text-sm text-muted-foreground">{data.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {Array.isArray(data.fields) &&
            data.fields.map((field: any, index: number) => {
              const id = `${template.id}-${field.name}`;
              const commonProps = {
                id,
                name: field.name,
                required: field.required,
                placeholder: field.placeholder,
                value: values[field.name] ?? '',
                onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  handleChange(field.name, event.target.value),
              };

              return (
                <div key={`${field.name}-${index}`} className="space-y-1">
                  <label htmlFor={id} className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <Textarea {...commonProps} rows={3} />
                  ) : field.type === 'select' ? (
                    <select
                      id={id}
                      name={field.name}
                      required={field.required}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={values[field.name] ?? ''}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                    >
                      <option value="">Select...</option>
                      {(field.options || []).map((option: string) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <div className="flex items-center gap-2">
                      <input
                        id={id}
                        type="checkbox"
                        checked={Boolean(values[field.name])}
                        onChange={(event) => handleChange(field.name, event.target.checked)}
                      />
                      <span className="text-sm text-muted-foreground">{field.helpText}</span>
                    </div>
                  ) : (
                    <Input {...commonProps} type={field.type || 'text'} />
                  )}
                  {field.helpText && field.type !== 'checkbox' && (
                    <p className="text-xs text-muted-foreground">{field.helpText}</p>
                  )}
                </div>
              );
            })}

          <Button
            type="submit"
            disabled={submitted}
            style={{ backgroundColor: accentColor }}
            className={cn(submitted && 'opacity-60')}
          >
            {submitted ? 'Submitted' : data.submitLabel || 'Submit'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function renderHelloWorld(data: Record<string, any>) {
  const accentColor = data.accentColor || '#2563eb';
  const name = data.name ? `, ${data.name}` : '';
  const emoji = data.emoji || '👋';

  return (
    <Card className="w-full border-2 text-center" style={{ borderColor: accentColor }}>
      <CardHeader>
        <CardTitle className="text-2xl" style={{ color: accentColor }}>
          {emoji} Hello{name}!
        </CardTitle>
        {data.message && (
          <p className="text-sm text-muted-foreground leading-relaxed">{data.message}</p>
        )}
      </CardHeader>
      <CardContent>
        <div
          className="inline-block rounded-full px-3 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: accentColor }}
        >
          Mobeus Component Discovery ✓
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Generic fallback renderer for auto-discovered component types.
 * Iterates schema properties (required first) and renders each field
 * as a label: value pair, so any component registered via the
 * component-discovery-service renders immediately without code changes.
 */
function renderGenericComponent(template: ComponentTemplate, data: Record<string, any>) {
  const uiConfig = (template.uiConfig || {}) as Record<string, any>;
  const accentColor = getAccentColor(uiConfig);
  const schema = (template.schema || {}) as Record<string, any>;
  const properties: Record<string, any> = schema.properties || {};
  const required: string[] = Array.isArray(schema.required) ? schema.required : [];

  // Sort keys: required first, then the rest
  const allKeys = Object.keys(properties).length > 0
    ? [
        ...required.filter((k) => k in properties),
        ...Object.keys(properties).filter((k) => !required.includes(k)),
      ]
    : Object.keys(data).filter((k) => k !== 'id');

  const displayKeys = allKeys.length > 0 ? allKeys : Object.keys(data).filter((k) => k !== 'id');

  if (displayKeys.length === 0 && !template.name) return null;

  return (
    <Card className="w-full border" style={{ borderColor: accentColor }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base" style={{ color: accentColor }}>
            {template.name}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {template.type}
          </Badge>
        </div>
        {(template as any).description && (
          <p className="text-xs text-muted-foreground">{(template as any).description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {displayKeys.map((key) => {
          const value = data[key];
          if (value === undefined || value === null || value === '') return null;
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
          const isRequired = required.includes(key);

          return (
            <div key={key} className="flex items-start gap-2 text-sm">
              <span className="min-w-24 font-medium text-muted-foreground">
                {label}{isRequired && <span className="text-red-500">*</span>}
              </span>
              {Array.isArray(value) ? (
                <div className="flex flex-wrap gap-1">
                  {value.map((v, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {typeof v === 'object' && v !== null
                        ? Object.entries(v).map(([k, val]) => `${k}: ${val}`).join(', ')
                        : String(v)}
                    </Badge>
                  ))}
                </div>
              ) : typeof value === 'boolean' ? (
                <Badge variant={value ? 'default' : 'outline'} className="text-xs">
                  {value ? 'Yes' : 'No'}
                </Badge>
              ) : (
                <span className="text-foreground">{String(value)}</span>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function DynamicComponentRenderer({ template, data }: DynamicComponentRendererProps) {
  const mergedData = useMemo(() => {
    return mergeTemplateData(
      template.defaultData as Record<string, unknown>,
      (data || undefined) as Record<string, unknown>
    );
  }, [template, data]);

  if (!template) return null;

  const missingFields = getMissingRequiredFields(
    template.schema as Record<string, any>,
    mergedData as Record<string, any>
  );

  let rendered = null;

  if (template.type === 'ProductCard') {
    rendered = renderProductCard(template, mergedData as Record<string, any>);
  }

  if (template.type === 'Form') {
    rendered = <FormRenderer template={template} data={mergedData as Record<string, any>} />;
  }

  if (template.type === 'ImageGallery') {
    rendered = renderImageGallery(template, mergedData as Record<string, any>);
  }

  if (template.type === 'HelloWorld') {
    rendered = renderHelloWorld(mergedData as Record<string, any>);
  }

  if (template.type === 'BarChart') {
    const d = mergedData as Record<string, any>;
    rendered = (
      <BarChart
        title={d.title}
        bars={Array.isArray(d.bars) ? d.bars : []}
        unit={d.unit}
        maxValue={d.maxValue}
        showValues={d.showValues}
        accentColor={d.accentColor}
      />
    );
  }

  // Generic fallback: renders any auto-discovered component type as a structured data card.
  // This ensures components registered via the component-discovery-service display immediately
  // without requiring a new template rebuild.
  if (!rendered) {
    rendered = renderGenericComponent(template, mergedData as Record<string, any>);
  }

  return (
    <div className="space-y-2">
      {missingFields.length > 0 && (
        <div className="text-xs text-red-600">
          Missing required fields: {missingFields.join(', ')}
        </div>
      )}
      {rendered}
    </div>
  );
}
