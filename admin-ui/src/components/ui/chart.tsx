'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import { cn } from '../../lib/utils';

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >['children'];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = 'Chart';

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color,
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof THEMES] || itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .filter(Boolean)
  .join('\n')}
}
`,
          )
          .join('\n'),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    active?: boolean;
    payload?: any[];
    label?: string;
    labelFormatter?: (label: any, payload: any) => React.ReactNode;
    labelClassName?: string;
    formatter?: (
      value: any,
      name: any,
      props: any,
      index: any,
      payload: any,
    ) => React.ReactNode;
    color?: string;
    hideLabel?: boolean;
    indicator?: 'line' | 'dot' | 'dashed';
    nameKey?: string;
    labelKey?: string;
  }
>(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      hideLabel = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,

      nameKey,
      labelKey,
    },
    ref,
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item.dataKey || item.name || 'value'}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value =
        !labelKey && typeof label === 'string'
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label;
      if (labelFormatter && typeof value === 'string') {
        return labelFormatter(value, payload);
      }

      return value;
    }, [label, labelFormatter, payload, hideLabel, labelKey, config]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== 'dot';

    const itemContent = (
      <div
        ref={ref}
        className={cn(
          'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700',
          className,
        )}
      >
        {!nestLabel ? (
          <div className={cn('grid gap-1.5', !hideLabel && 'pb-1.5')}>
            {!hideLabel && (
              <div
                className={cn(
                  'font-medium text-foreground text-slate-900 dark:text-slate-100',
                  labelClassName,
                )}
              >
                {tooltipLabel}
              </div>
            )}
            <div className="grid gap-1.5">
              {payload.map((item, index) => {
                const key = `${nameKey || item.name || item.dataKey || 'value'}`;
                const itemConfig = getPayloadConfigFromPayload(
                  config,
                  item,
                  key,
                );
                const date = item?.payload?.date;
                const href = date
                  ? `/orders?date=${encodeURIComponent(date)}`
                  : null;

                const itemContent = (
                  <div
                    className={cn(
                      'flex w-full items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
                      indicator === 'dot' && 'items-center',
                    )}
                  >
                    {formatter && item?.value !== undefined && item.name ? (
                      formatter(item.value, item.name, item, index, payload)
                    ) : (
                      <>
                        <div
                          className={cn(
                            'flex flex-1 justify-between leading-none',
                            nestLabel ? 'items-end' : 'items-center',
                          )}
                        >
                          <div className="grid gap-1.5">
                            {nestLabel ? (
                              <div
                                className={cn(
                                  'font-medium text-foreground text-slate-900 dark:text-slate-100',
                                  labelClassName,
                                )}
                              >
                                {tooltipLabel}
                              </div>
                            ) : null}
                            <div className="flex items-center gap-0.5 text-muted-foreground text-slate-600 dark:text-slate-400">
                              {itemConfig?.label || item.name}
                            </div>
                          </div>
                          {item.value && (
                            <div className="font-mono font-medium tabular-nums text-foreground text-slate-900 dark:text-slate-100">
                              {item.value}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );

                return href ? (
                  <a
                    key={item.dataKey}
                    href={href}
                    className="hover:underline no-underline text-inherit"
                  >
                    {itemContent}
                  </a>
                ) : (
                  <div key={item.dataKey}>{itemContent}</div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );

    return itemContent;
  },
);
ChartTooltipContent.displayName = 'ChartTooltipContent';

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }

  const payloadPayload =
    'payload' in payload &&
    typeof payload.payload === 'object' &&
    payload.payload !== null
      ? payload.payload
      : undefined;

  const configLabelKey: string = key;

  if (key in config || (payloadPayload && configLabelKey in payloadPayload)) {
    return config[configLabelKey];
  }

  return config[key];
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartStyle };
