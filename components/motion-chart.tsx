"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"

interface MotionChartProps {
  data: { value: number; time: string }[]
}

export function MotionChart({ data }: MotionChartProps) {
  return (
    <div className="h-[200px] w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="time" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} minTickGap={15} />
          <YAxis
            stroke="#cbd5e1"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            tickFormatter={(value) => value.toFixed(2)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              borderColor: "#475569",
              color: "#f8fafc",
              fontSize: "12px",
              borderRadius: "4px",
            }}
            labelStyle={{ color: "#e2e8f0" }}
            formatter={(value: number) => [value.toFixed(2), "Activity Level"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            fill="url(#colorMotion)"
            strokeWidth={2}
            activeDot={{ r: 4, fill: "#10b981", stroke: "#064e3b" }}
          />
          <defs>
            <linearGradient id="colorMotion" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

