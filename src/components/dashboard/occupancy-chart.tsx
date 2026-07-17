"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface OccupancyItem {
  name: string
  value: number
  color: string
}

interface OccupancyChartProps {
  data: OccupancyItem[]
}

const chartConfig = {
  occupied: { label: "Occupied", color: "#1e3a5f" },
  vacant: { label: "Vacant", color: "#e2e6ee" },
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-md text-xs">
      <p className="font-medium">{item.name}</p>
      <p className="font-semibold" style={{ color: item.color }}>{item.value} units</p>
    </div>
  )
}

export default function OccupancyChart({ data }: OccupancyChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const occupiedPercent = total > 0 ? ((data[0]?.value / total) * 100).toFixed(0) : "0"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Occupancy Rate</CardTitle>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No units yet</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ChartContainer config={chartConfig} className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="space-y-3">
                <div>
                  <p className="text-3xl font-bold">{occupiedPercent}%</p>
                  <p className="text-xs text-muted-foreground">of units occupied</p>
                </div>
                <div className="space-y-1.5">
                  {data.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                      <span className="text-sm font-medium ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
