"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { HeartPulse, Thermometer, Mountain, Activity, AlertTriangle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface HealthStatusProps {
  heartRate: number
  internalTemp: number
  externalTemp: number
  motion: number
  altitude: number
  status: string
}

export function HealthStatus({ heartRate, internalTemp, externalTemp, motion, altitude, status }: HealthStatusProps) {
  const [healthScore, setHealthScore] = useState(85)

  useEffect(() => {
    // Calculate health score based on vital signs
    let score = 100

    // Heart rate penalties
    if (heartRate < 50 || heartRate > 110) score -= 20
    else if (heartRate < 60 || heartRate > 100) score -= 10

    // Temperature penalties
    if (internalTemp < 36 || internalTemp > 38) score -= 20
    else if (internalTemp < 36.5 || internalTemp > 37.5) score -= 5

    // External temperature impact
    if (externalTemp < -15) score -= 10

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score))

    setHealthScore(score)
  }, [heartRate, internalTemp, externalTemp, motion])

  const getStatusColor = () => {
    if (healthScore >= 80) return "text-green-500"
    if (healthScore >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getStatusIcon = () => {
    if (healthScore >= 80) return <CheckCircle2 className="h-6 w-6 text-green-500" />
    if (healthScore >= 60) return <AlertTriangle className="h-6 w-6 text-yellow-500" />
    return <AlertTriangle className="h-6 w-6 text-red-500" />
  }

  const getStatusText = () => {
    if (healthScore >= 80) return "Good Condition"
    if (healthScore >= 60) return "Exercise Caution"
    return "Immediate Attention Required"
  }

  const getProgressColor = () => {
    if (healthScore >= 80) return "bg-green-500"
    if (healthScore >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Calculate gravity score based on altitude
  const gravityScore = Math.max(0, Math.min(100, (altitude / 3000) * 100))

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h2 className="text-xl font-bold">
            <span className={getStatusColor()}>{getStatusText()}</span>
          </h2>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "px-3 py-1 text-sm font-medium",
            status === "normal"
              ? "border-green-500/50 bg-green-500/10 text-green-500"
              : status === "caution"
                ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-500"
                : "border-red-500/50 bg-red-500/10 text-red-500",
          )}
        >
          {status === "normal" ? "Normal" : status === "caution" ? "Caution" : "Danger"}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium text-slate-300">Gravity Level</span>
          <span className="text-sm font-medium">{gravityScore.toFixed(1)}%</span>
        </div>
        <Progress value={gravityScore} className="h-2 bg-slate-700">
          <div className="h-full bg-blue-500" style={{ width: `${gravityScore}%` }} />
        </Progress>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-slate-700/50 bg-slate-800/50">
          <CardContent className="flex flex-col items-center justify-center p-4">
            <HeartPulse className={`mb-2 h-5 w-5 ${heartRate > 100 ? "text-red-400" : "text-blue-400"}`} />
            <div className="text-center">
              <p className="text-xs text-slate-300">Heart Rate</p>
              <p
                className={`text-xl font-bold ${
                  heartRate < 60 || heartRate > 100
                    ? "text-yellow-400"
                    : (heartRate < 50 || heartRate > 110)
                      ? "text-red-400"
                      : "text-slate-50"
                }`}
              >
                {heartRate} BPM
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/50 bg-slate-800/50">
          <CardContent className="flex flex-col items-center justify-center p-4">
            <Thermometer
              className={`mb-2 h-5 w-5 ${
                internalTemp > 38 ? "text-red-400" : internalTemp < 36 ? "text-blue-400" : "text-green-400"
              }`}
            />
            <div className="text-center">
              <p className="text-xs text-slate-300">Body Temp</p>
              <p
                className={`text-xl font-bold ${
                  internalTemp < 36.5 || internalTemp > 37.5
                    ? "text-yellow-400"
                    : (internalTemp < 36 || internalTemp > 38)
                      ? "text-red-400"
                      : "text-slate-50"
                }`}
              >
                {internalTemp.toFixed(1)}°C
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/50 bg-slate-800/50">
          <CardContent className="flex flex-col items-center justify-center p-4">
            <Activity className="mb-2 h-5 w-5 text-green-400" />
            <div className="text-center">
              <p className="text-xs text-slate-300">Activity</p>
              <p className="text-xl font-bold">{motion.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700/50 bg-slate-800/50">
          <CardContent className="flex flex-col items-center justify-center p-4">
            <Mountain className="mb-2 h-5 w-5 text-blue-400" />
            <div className="text-center">
              <p className="text-xs text-slate-300">Altitude</p>
              <p className="text-xl font-bold">{altitude}m</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

