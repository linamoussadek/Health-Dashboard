"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HeartPulse, Thermometer, Mountain, Activity, AlertTriangle } from "lucide-react"
import { HeartRateChart } from "./components/heart-rate-chart"
import { TemperatureGauge } from "./components/temperature-gauge"
import { MotionChart } from "./components/motion-chart"
import { HealthStatus } from "./components/health-status"
import { generateVitalData } from "./lib/data-generator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const [data, setData] = useState({
    heartRate: 0,
    internalTemp: 0,
    externalTemp: 0,
    motion: 0,
    altitude: 0,
    timestamp: new Date(),
    healthStatus: "normal", // normal, caution, danger
  })

  const [heartRateHistory, setHeartRateHistory] = useState<{ value: number; time: string }[]>([])
  const [tempHistory, setTempHistory] = useState<{ internal: number; external: number; time: string }[]>([])
  const [motionHistory, setMotionHistory] = useState<{ value: number; time: string }[]>([])

  useEffect(() => {
    // Initialize with initial data
    const initialData = generateVitalData({
      heartRate: 75,
      internalTemp: 37.0,
      externalTemp: -5.2,
      motion: 0.5,
      altitude: 2850,
      timestamp: new Date(),
      healthStatus: "normal",
    })
    setData(initialData)

    // Initialize with some historical data
    const initialHeartRate = Array.from({ length: 20 }, (_, i) => ({
      value: Math.floor(Math.random() * 20) + 65,
      time: new Date(Date.now() - (19 - i) * 30000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }))

    const initialTemp = Array.from({ length: 20 }, (_, i) => ({
      internal: 36.5 + Math.random() * 1.5,
      external: -8 + Math.random() * 6,
      time: new Date(Date.now() - (19 - i) * 30000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }))

    const initialMotion = Array.from({ length: 20 }, (_, i) => ({
      value: Math.random(),
      time: new Date(Date.now() - (19 - i) * 30000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }))

    setHeartRateHistory(initialHeartRate)
    setTempHistory(initialTemp)
    setMotionHistory(initialMotion)

    // Set up interval for live data updates
    const interval = setInterval(() => {
      const newData = generateVitalData(data)
      setData(newData)

      const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })

      setHeartRateHistory((prev) => [...prev.slice(-19), { value: newData.heartRate, time: timeString }])
      setTempHistory((prev) => [
        ...prev.slice(-19),
        {
          internal: newData.internalTemp,
          external: newData.externalTemp,
          time: timeString,
        },
      ])
      setMotionHistory((prev) => [...prev.slice(-19), { value: newData.motion, time: timeString }])
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-green-500/10 text-green-500"
      case "caution":
        return "bg-yellow-500/10 text-yellow-500"
      case "danger":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-slate-500/10 text-slate-500"
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold">Alpine Health Monitor</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1 border-slate-700 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Data
            </Badge>
            <Button variant="outline" size="sm">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Emergency
            </Button>
          </div>
        </div>
      </header>

      <main className="container flex-1 px-4 py-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="col-span-full border-slate-700/50 bg-slate-800/50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle>Mountaineer Health Status</CardTitle>
              <CardDescription className="text-slate-300">Real-time vital signs and environmental data</CardDescription>
            </CardHeader>
            <CardContent>
              <HealthStatus
                heartRate={data.heartRate}
                internalTemp={data.internalTemp}
                externalTemp={data.externalTemp}
                motion={data.motion}
                altitude={data.altitude}
                status={data.healthStatus}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-700/50 bg-slate-800/50 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base">Heart Rate</CardTitle>
                <CardDescription className="text-slate-300">Beats per minute</CardDescription>
              </div>
              <HeartPulse className={`h-5 w-5 ${data.heartRate > 100 ? "text-red-400" : "text-blue-400"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.heartRate} BPM</div>
              <HeartRateChart data={heartRateHistory} />
            </CardContent>
          </Card>

          <Card className="border-slate-700/50 bg-slate-800/50 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base">Body Temperature</CardTitle>
                <CardDescription className="text-slate-300">Internal (°C)</CardDescription>
              </div>
              <Thermometer
                className={`h-5 w-5 ${
                  data.internalTemp > 38 ? "text-red-400" : data.internalTemp < 36 ? "text-blue-400" : "text-green-400"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.internalTemp.toFixed(1)}°C</div>
              <TemperatureGauge
                value={data.internalTemp}
                min={35}
                max={40}
                type="internal"
                history={tempHistory.map((h) => ({ value: h.internal, time: h.time }))}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-700/50 bg-slate-800/50 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base">External Temperature</CardTitle>
                <CardDescription className="text-slate-300">Environment (°C)</CardDescription>
              </div>
              <Thermometer
                className={`h-5 w-5 ${
                  data.externalTemp > 0
                    ? "text-orange-400"
                    : data.externalTemp < -10
                      ? "text-blue-400"
                      : "text-blue-300"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.externalTemp.toFixed(1)}°C</div>
              <TemperatureGauge
                value={data.externalTemp}
                min={-20}
                max={10}
                type="external"
                history={tempHistory.map((h) => ({ value: h.external, time: h.time }))}
              />
            </CardContent>
          </Card>

          <Card className="border-slate-700/50 bg-slate-800/50 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base">Motion & Activity</CardTitle>
                <CardDescription className="text-slate-300">Movement intensity</CardDescription>
              </div>
              <Activity className="h-5 w-5 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.motion.toFixed(2)}</div>
              <MotionChart data={motionHistory} />
            </CardContent>
          </Card>

          <Card className="col-span-full border-slate-700/50 bg-slate-800/50 shadow-lg md:col-span-2 lg:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle>Expedition Details</CardTitle>
              <CardDescription className="text-slate-300">Current location and conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Altitude</span>
                    <span className="font-medium">{data.altitude} m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">External Temperature</span>
                    <span className="font-medium">{data.externalTemp.toFixed(1)}°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Wind Speed</span>
                    <span className="font-medium">32 km/h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Weather</span>
                    <span className="font-medium">Light Snow</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Location</span>
                    <span className="font-medium">North Ridge</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Coordinates</span>
                    <span className="font-medium">47.5622° N, 13.6493° E</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Last Update</span>
                    <span className="font-medium">{data.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status</span>
                    <Badge className={getStatusColor(data.healthStatus)}>
                      {data.healthStatus.charAt(0).toUpperCase() + data.healthStatus.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

