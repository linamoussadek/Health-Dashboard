"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Activity, Thermometer, Droplets } from "lucide-react"

interface HealthStatusProps {
  heartRate: number
  internalTemp: number
  externalTemp: number
  humidity: number
  altitude: number
}

export function HealthStatus({
  heartRate,
  internalTemp,
  externalTemp,
  humidity,
  altitude,
}: HealthStatusProps) {
  const gravityScore = Math.round((altitude / 8848) * 100)

  return (
    <Card className="col-span-full border-zinc-800 bg-zinc-950/50 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-3xl font-bold text-zinc-100">État de Santé</CardTitle>
        <CardDescription className="text-lg text-zinc-400">Signes vitaux et données environnementales en temps réel</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-400">Score de gravité</div>
              <div className="text-sm font-medium text-zinc-100">{gravityScore}%</div>
            </div>
            <Progress value={gravityScore} className="h-3 bg-zinc-800" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-400" />
              <span className="text-base text-zinc-400">Rythme Cardiaque</span>
            </div>
            <div className="text-3xl font-bold text-zinc-100">{heartRate} BPM</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-emerald-400" />
              <span className="text-base text-zinc-400">Temp. Interne</span>
            </div>
            <div className="text-3xl font-bold text-zinc-100">{internalTemp.toFixed(1)}°C</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-amber-400" />
              <span className="text-base text-zinc-400">Temp. Externe</span>
            </div>
            <div className="text-3xl font-bold text-zinc-100">{externalTemp.toFixed(1)}°C</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-400" />
              <span className="text-base text-zinc-400">Humidité</span>
            </div>
            <div className="text-3xl font-bold text-zinc-100">{humidity.toFixed(1)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

