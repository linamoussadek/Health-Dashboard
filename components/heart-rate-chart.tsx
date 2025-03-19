"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"

interface HeartRateChartProps {
  data: { value: number; time: string }[]
}

export function HeartRateChart({ data }: HeartRateChartProps) {
  return (
    <div className="h-[200px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
          <XAxis dataKey="time" stroke="#d1d5db" fontSize={10} tickLine={false} axisLine={false} minTickGap={15} />
          <YAxis
            stroke="#d1d5db"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={[40, 120]}
            ticks={[40, 60, 80, 100, 120]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              borderColor: "#4b5563",
              color: "#f9fafb",
              fontSize: "12px",
              borderRadius: "4px",
            }}
            labelStyle={{ color: "#e5e7eb" }}
            formatter={(value: number) => [value, "BPM"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#ef4444"
            fill="url(#colorHeartRate)"
            strokeWidth={2}
            activeDot={{ r: 4, fill: "#ef4444", stroke: "#991b1b" }}
          />
          <defs>
            <linearGradient id="colorHeartRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

