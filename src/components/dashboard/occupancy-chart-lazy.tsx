"use client"

import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const OccupancyChart = dynamic(() => import("./occupancy-chart"), {
  ssr: false,
  loading: () => <ChartSkeleton title="Occupancy Rate" />,
})

interface OccupancyChartWrapperProps {
  data: Array<{ name: string; value: number; color: string }>
}

export default function OccupancyChartWrapper(props: OccupancyChartWrapperProps) {
  return <OccupancyChart {...props} />
}

export { OccupancyChartWrapper as OccupancyChartLazy }

function ChartSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-40 h-40 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="space-y-1.5">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
