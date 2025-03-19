"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip } from "recharts"

interface TemperatureGaugeProps {
  value: number
  min: number
  max: number
  type: "internal" | "external"
  history: { value: number; time: string }[]
}

export function TemperatureGauge({ value, min, max, type, history }: TemperatureGaugeProps) {
  const percentage = ((value - min) / (max - min)) * 100
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100)

  const getColor = () => {
    if (type === "internal") {
      if (value < 36) return "#3b82f6" // cold - blue
      if (value > 38) return "#ef4444" // hot - red
      return "#10b981" // normal - green
    } else {
      if (value < -10) return "#3b82f6" // very cold - blue
      if (value > 0) return "#f97316" // warmer - orange
      return "#60a5fa" // cold - light blue
    }
  }

  const color = getColor()

  return (
    <div className="space-y-4">
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full transition-all duration-500 ease-in-out"
          style={{
            width: `${clampedPercentage}%`,
            backgroundColor: color,
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-300">
        <span>{min}°C</span>
        {type === "internal" && <span>Normal</span>}
        <span>{max}°C</span>
      </div>

      <div className="h-[150px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="time" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} minTickGap={15} />
            <YAxis
              stroke="#cbd5e1"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[type === "internal" ? 35 : -20, type === "internal" ? 40 : 10]}
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
              formatter={(value: number) => [`${value.toFixed(1)}°C`, "Temperature"]}
            />
            {type === "internal" && (
              <>
                <ReferenceLine y={36.5} stroke="#475569" strokeDasharray="3 3" />
                <ReferenceLine y={37.5} stroke="#475569" strokeDasharray="3 3" />
              </>
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: "#1e293b" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

