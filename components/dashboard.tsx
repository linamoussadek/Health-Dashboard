"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mountain, Activity, AlertTriangle, Thermometer, Droplets, MapPin, AlertCircle, Zap } from "lucide-react"
import { generateVitalData, type VitalData } from "@/lib/data-generator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MotionIndicator } from "./motion-indicator"
import { HeartRateChart } from "./heart-rate-chart"
import { TemperatureGauge } from "./temperature-gauge"
import { LocationMap } from "./location-map"
import { HealthStatus } from "./health-status"

export default function Dashboard() {
  const [data, setData] = useState<VitalData>({
    heartRate: 75,
    internalTemp: 37.0,
    externalTemp: -5.0,
    motion: 0.5,
    altitude: 2850,
    timestamp: new Date(),
    healthStatus: "normal",
    humidity: 45,
    movement: true,
    speed: 2.5,
    latitudeDegrees: 47.5622,
    longitudeDegrees: 13.6493,
    GPSdate: new Date().toLocaleDateString(),
    GPStime: new Date().toLocaleTimeString(),
  })

  const [heartRateHistory, setHeartRateHistory] = useState<{ value: number; time: string }[]>([])
  const [tempHistory, setTempHistory] = useState<{ internal: number; external: number; time: string }[]>([])

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
      humidity: 45,
      movement: true,
      speed: 2.5,
      latitudeDegrees: 47.5622,
      longitudeDegrees: 13.6493,
      GPSdate: new Date().toLocaleDateString(),
      GPStime: new Date().toLocaleTimeString(),
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

    setHeartRateHistory(initialHeartRate)
    setTempHistory(initialTemp)

    // Set up interval for live data updates
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = generateVitalData(prevData)
        const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        
        setHeartRateHistory(prev => [...prev.slice(-19), { value: Math.floor(Math.random() * 20) + 65, time: timeString }])
        setTempHistory(prev => [
          ...prev.slice(-19),
          {
            internal: newData.internalTemp,
            external: newData.externalTemp,
            time: timeString,
          },
        ])
        
        return newData
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="container flex h-20 items-center justify-center px-6 max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <Mountain className="h-8 w-8 text-indigo-400" />
            <h1 className="text-2xl font-bold text-zinc-100">Moniteur de Santé Alpine</h1>
          </div>
          <div className="absolute right-6 flex items-center gap-6">
            <Badge variant="outline" className="gap-1 border-zinc-800 px-4 py-1.5 bg-zinc-950/50 text-base">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Données en Direct
            </Badge>
            <Button variant="outline" size="lg" className="border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 text-base">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Urgence
            </Button>
          </div>
        </div>
      </header>

      <main className="container flex-1 px-6 py-8 max-w-[1800px] mx-auto">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card className="col-span-full border-zinc-800 bg-zinc-950/50 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-3xl font-bold text-zinc-100">État de Santé</CardTitle>
              <CardDescription className="text-lg text-zinc-400">Signes vitaux et données environnementales en temps réel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-rose-400" />
                    <span className="text-base text-zinc-400">Rythme Cardiaque</span>
                  </div>
                  <div className="text-3xl font-bold text-zinc-100">75 BPM</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-emerald-400" />
                    <span className="text-base text-zinc-400">Temp. Interne</span>
                  </div>
                  <div className="text-3xl font-bold text-zinc-100">{data.internalTemp.toFixed(1)}°C</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-amber-400" />
                    <span className="text-base text-zinc-400">Temp. Externe</span>
                  </div>
                  <div className="text-3xl font-bold text-zinc-100">{data.externalTemp.toFixed(1)}°C</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-400" />
                    <span className="text-base text-zinc-400">Humidité</span>
                  </div>
                  <div className="text-3xl font-bold text-zinc-100">{data.humidity.toFixed(1)}%</div>
                </div>
              </div>
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-rose-400" />
                    <span className="text-base text-zinc-400">Score de Gravité</span>
                  </div>
                  <span className="text-base font-medium text-zinc-100">
                    {Math.round((data.altitude / 8848) * 100)}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(data.altitude / 8848) * 100}%`,
                      background: "linear-gradient(to right, #22c55e, #eab308, #ef4444)"
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-950/50 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="space-y-1">
                <CardTitle className="text-xl text-zinc-100">Rythme Cardiaque</CardTitle>
                <CardDescription className="text-base text-zinc-400">Battements par minute</CardDescription>
              </div>
              <Activity className="h-6 w-6 text-rose-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-zinc-100">75 BPM</div>
              <HeartRateChart data={heartRateHistory} />
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-950/50 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="space-y-1">
                <CardTitle className="text-xl text-zinc-100">Température Corporelle</CardTitle>
                <CardDescription className="text-base text-zinc-400">Interne (°C)</CardDescription>
              </div>
              <Thermometer className="h-6 w-6 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-zinc-100">{data.internalTemp.toFixed(1)}°C</div>
              <TemperatureGauge
                value={data.internalTemp}
                min={35}
                max={40}
                type="internal"
                history={tempHistory.map((h) => ({ value: h.internal, time: h.time }))}
              />
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-950/50 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="space-y-1">
                <CardTitle className="text-xl text-zinc-100">Température Externe</CardTitle>
                <CardDescription className="text-base text-zinc-400">Environnement (°C)</CardDescription>
              </div>
              <Thermometer className="h-6 w-6 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-zinc-100">{data.externalTemp.toFixed(1)}°C</div>
              <TemperatureGauge
                value={data.externalTemp}
                min={-20}
                max={10}
                type="external"
                history={tempHistory.map((h) => ({ value: h.external, time: h.time }))}
              />
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-950/50 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="space-y-1">
                <CardTitle className="text-xl text-zinc-100">Mouvement & Vitesse</CardTitle>
                <CardDescription className="text-base text-zinc-400">État du mouvement et vitesse</CardDescription>
              </div>
              <Zap className="h-6 w-6 text-violet-400" />
            </CardHeader>
            <CardContent>
              <MotionIndicator active={data.movement} speed={data.speed} />
            </CardContent>
          </Card>

          <Card className="col-span-full border-zinc-800 bg-zinc-950/50 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="space-y-1">
                <CardTitle className="text-xl text-zinc-100">Localisation & Suivi</CardTitle>
                <CardDescription className="text-base text-zinc-400">Coordonnées GPS, altitude et position en temps réel</CardDescription>
              </div>
              <MapPin className="h-6 w-6 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-base text-zinc-400">Altitude</div>
                    <div className="text-3xl font-bold text-zinc-100">{data.altitude.toFixed(0)} m</div>
                  </div>
                  <div>
                    <div className="text-base text-zinc-400">Coordonnées</div>
                    <div className="text-base font-medium text-zinc-100">
                      {data.latitudeDegrees.toFixed(6)}° N, {data.longitudeDegrees.toFixed(6)}° E
                    </div>
                  </div>
                  <div>
                    <div className="text-base text-zinc-400">Heure GPS</div>
                    <div className="text-base font-medium text-zinc-100">{data.GPStime}</div>
                  </div>
                  <div>
                    <div className="text-base text-zinc-400">Date GPS</div>
                    <div className="text-base font-medium text-zinc-100">{data.GPSdate}</div>
                  </div>
                </div>
                <div className="lg:col-span-2 h-[250px] w-full rounded-lg overflow-hidden border border-zinc-800">
                  <LocationMap
                    latitude={data.latitudeDegrees}
                    longitude={data.longitudeDegrees}
                    altitude={data.altitude}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-full border-zinc-800 bg-zinc-950/50 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="space-y-1">
                <CardTitle className="text-xl text-zinc-100">État de Santé</CardTitle>
                <CardDescription className="text-base text-zinc-400">État de santé et données de santé</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <HealthStatus
                heartRate={data.heartRate}
                internalTemp={data.internalTemp}
                externalTemp={data.externalTemp}
                humidity={data.humidity}
                altitude={data.altitude}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 