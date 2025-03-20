"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip } from "recharts"

interface TemperatureGaugeProps {
  value: number
  type: "internal" | "external"
  history: { value: number; time: string }[]
}

export function TemperatureGauge({ value, type, history }: TemperatureGaugeProps) {
  const getGradientColor = (position: number) => {
    // Convert position (0-100) to RGB values between blue and red
    const blue = { r: 59, g: 130, b: 246 } // blue-500
    const red = { r: 239, g: 68, b: 68 }   // red-500
    
    const r = Math.round(blue.r + (red.r - blue.r) * (position / 100))
    const g = Math.round(blue.g + (red.g - blue.g) * (position / 100))
    const b = Math.round(blue.b + (red.b - blue.b) * (position / 100))
    
    return `rgb(${r}, ${g}, ${b})`
  }

  const getCursorPosition = () => {
    if (type === "internal") {
      const clampedValue = Math.min(Math.max(value, 30), 40)
      return ((clampedValue - 30) / (40 - 30)) * 100
    } else {
      const clampedValue = Math.min(Math.max(value, -10), 40)
      return ((clampedValue - (-10)) / (40 - (-10))) * 100
    }
  }

  const clampValue = (val: number) => {
    if (type === "internal") {
      return Math.min(Math.max(val, 30), 40)
    } else {
      return Math.min(Math.max(val, -10), 40)
    }
  }

  const cursorPosition = getCursorPosition()
  const color = getGradientColor(cursorPosition)
  const clampedHistory = history.map(item => ({
    ...item,
    value: clampValue(item.value)
  }))

  return (
    <div className="space-y-4">
      <div className="mt-6">
        <div className="h-2 w-full rounded-full bg-gradient-to-r from-blue-500 to-red-500 relative">
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-full transition-all duration-500"
            style={{
              left: `${cursorPosition}%`,
            }}
          />
        </div>

        <div className="flex justify-between text-xs text-slate-300 mt-2">
          <span>{type === "internal" ? "30°C" : "-10°C"}</span>
          {type === "internal" && <span>Normal</span>}
          <span>{type === "internal" ? "40°C" : "40°C"}</span>
        </div>
      </div>

      <div className="h-[150px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={clampedHistory} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="time" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} minTickGap={15} />
            <YAxis
              stroke="#cbd5e1"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[type === "internal" ? 30 : -10, type === "internal" ? 40 : 40]}
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

