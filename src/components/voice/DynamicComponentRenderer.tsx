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

  if (!rendered) return null;

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
