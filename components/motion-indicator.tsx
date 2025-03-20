"use client"

import { Activity, Pause } from "lucide-react"

interface MotionIndicatorProps {
  active: boolean
  speed: number
}

export function MotionIndicator({ active, speed }: MotionIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[200px]">
      <div
        className={`relative flex items-center justify-center w-32 h-32 rounded-full ${
          active ? "bg-violet-500/10" : "bg-gray-700/50"
        }`}
      >
        <div
          className={`absolute inset-0 rounded-full ${active ? "animate-ping bg-violet-500/30" : ""}`}
          style={{ animationDuration: `${3 - Math.min(2, speed)}s` }}
        ></div>
        <div className="z-10 flex items-center justify-center w-24 h-24 rounded-full bg-gray-800">
          {active ? <Activity className="h-12 w-12 text-violet-400" /> : <Pause className="h-12 w-12 text-gray-400" />}
        </div>
      </div>
      <div className="mt-6 text-center">
        <div className="text-3xl font-bold text-zinc-100">{speed.toFixed(1)} km/h</div>
        <div className="text-sm text-gray-300 mt-1">{active ? "En mouvement" : "Immobile"}</div>
      </div>
    </div>
  )
} 