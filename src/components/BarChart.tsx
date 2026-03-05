import React from 'react';

interface BarChartBar {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  title: string;
  bars: BarChartBar[];
  unit?: string;
  maxValue?: number;
  showValues?: boolean;
  accentColor?: string;
}

/**
 * BarChart — renders a horizontal bar chart with labeled bars and optional value display.
 * Used to visualize comparison data like sales figures, survey results, or metrics.
 */
export default function BarChart({
  title,
  bars,
  unit = '',
  maxValue,
  showValues = true,
  accentColor = '#3B82F6',
}: BarChartProps) {
  const max = maxValue ?? Math.max(...bars.map((b) => b.value), 1);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '1rem', maxWidth: 480 }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {bars.map((bar, i) => {
          const pct = Math.min((bar.value / max) * 100, 100);
          const barColor = bar.color || accentColor;
          return (
            <div key={i}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  marginBottom: 2,
                }}
              >
                <span>{bar.label}</span>
                {showValues && (
                  <span style={{ fontWeight: 500 }}>
                    {bar.value}
                    {unit ? ` ${unit}` : ''}
                  </span>
                )}
              </div>
              <div
                style={{
                  height: 20,
                  borderRadius: 4,
                  background: '#e5e7eb',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: barColor,
                    borderRadius: 4,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
