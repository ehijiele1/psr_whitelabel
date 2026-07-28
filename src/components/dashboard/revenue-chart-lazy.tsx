"use client"

import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const RevenueChart = dynamic(() => import("./revenue-chart"), {
  ssr: false,
  loading: () => <ChartSkeleton title="Revenue Overview" />,
})

interface RevenueChartWrapperProps {
  data: Array<{ month: string; revenue: number }>
}

export default function RevenueChartWrapper(props: RevenueChartWrapperProps) {
  return <RevenueChart {...props} />
}

export { RevenueChartWrapper as RevenueChartLazy }

function ChartSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-[2/1] w-full animate-pulse rounded-md bg-muted" />
      </CardContent>
    </Card>
  )
}
