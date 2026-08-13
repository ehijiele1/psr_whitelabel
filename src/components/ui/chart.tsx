"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type ChartConfig = {
  [k: string]: {
    label?: React.ReactNode
    color?: string
    icon?: React.ComponentType
  }
}

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null)

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { config: ChartConfig }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        {children}
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const css = Object.entries(config)
    .filter(([, cfg]) => cfg.color)
    .map(([key, cfg]) => `--color-${key}: ${cfg.color};`)
    .join("\n")

  if (!css) return null

  return <style>{`[data-chart="${id}"] { ${css} }`}</style>
}

export { ChartContainer, ChartStyle }
