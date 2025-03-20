// Dashboard component - Main view for health monitoring
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mountain, Activity, Thermometer, MapPin, Zap } from "lucide-react"
import { type VitalData } from "@/lib/data-generator"
import { Badge } from "@/components/ui/badge"
import { TemperatureGauge } from "@/components/temperature-gauge"
import { LocationMap } from "@/components/location-map"
import { MotionIndicator } from "@/components/motion-indicator"
import { database } from "@/lib/firebase"
import { ref, onValue, off } from "firebase/database"
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, Line, ResponsiveContainer } from "recharts"

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
    // Reference to your Firebase data path
    const dataRef = ref(database, '/UsersData/xAG0EpRU4ZPNCvMU8awkfLQMip83/readings')

    // Set up real-time listener
    onValue(dataRef, (snapshot) => {
      const readings = snapshot.val()
      if (readings) {
        // Get the latest reading (last timestamp)
        const timestamps = Object.keys(readings)
        const latestTimestamp = timestamps[timestamps.length - 1]
        const latestReading = readings[latestTimestamp]

        // Convert string values to numbers and update the data state
        setData(currentData => ({
          ...currentData,
          heartRate: parseFloat(latestReading.heartRate) || currentData.heartRate,
          internalTemp: parseFloat(latestReading.InternalTemperature),
          externalTemp: parseFloat(latestReading.ExternalTemperature),
          altitude: parseFloat(latestReading.altitude),
          humidity: parseFloat(latestReading.humidity),
          latitudeDegrees: parseFloat(latestReading.latitudeDegrees),
          longitudeDegrees: parseFloat(latestReading.longitudeDegrees),
          movement: latestReading.movement === "1",
          speed: parseFloat(latestReading.speed),
          timestamp: new Date(parseInt(latestReading.timestamp) * 1000),
          GPSdate: latestReading.GPSdate || new Date().toLocaleDateString(),
          GPStime: latestReading.GPStime || new Date().toLocaleTimeString(),
        }))

        // Update history
        const timeString = new Date(parseInt(latestReading.timestamp) * 1000).toLocaleTimeString([], { 
          hour: "2-digit", 
          minute: "2-digit", 
          second: "2-digit" 
        })
        
        setHeartRateHistory(prev => [...prev.slice(-19), { 
          value: parseFloat(latestReading.heartRate) || data.heartRate, 
          time: timeString 
        }])
        
        setTempHistory(prev => [
          ...prev.slice(-19),
          {
            internal: parseFloat(latestReading.InternalTemperature),
            external: parseFloat(latestReading.ExternalTemperature),
            time: timeString,
          },
        ])
      }
    }, (error) => {
      console.error("Error fetching data:", error)
    })

    // Cleanup subscription on unmount
    return () => {
      off(dataRef)
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="container flex h-20 items-center justify-center px-6 max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <Mountain className="h-8 w-8 text-indigo-400" />
            <h1 className="text-2xl font-bold text-zinc-100">Moniteur de Santé Alpin</h1>
          </div>
          <div className="absolute right-6 flex items-center gap-6">
            <Badge variant="outline" className="gap-1 border-zinc-800 px-4 py-1.5 bg-zinc-950/50 text-base text-white">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Données en Direct
            </Badge>
          </div>
        </div>
      </header>

      <main className="container flex-1 px-6 py-8 max-w-[1800px] mx-auto">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card className="col-span-full border-zinc-800 bg-zinc-950/50 shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-zinc-100">État de Santé</h1>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-zinc-400">En ligne</span>
                </div>
              </div>

              <CardDescription className="text-lg text-zinc-400">Signes vitaux et données environnementales en temps réel</CardDescription>

              <div className="mt-2 mb-1">
                <div className="text-3xl font-bold text-zinc-100">
                  {data.heartRate > 100 ? (
                    <span className="text-red-500">Tachycardie</span>
                  ) : data.heartRate < 60 ? (
                    <span className="text-yellow-500">Bradycardie</span>
                  ) : (
                    <span className="text-green-500">Normal</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
              <div className="space-y-4">
                <div className="text-4xl font-bold text-zinc-100">{data.heartRate.toFixed(0)} BPM</div>
                <div className="mt-6">
                  <div className="h-2 w-full rounded-full bg-gradient-to-r from-blue-500 to-red-500 relative">
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-full transition-all duration-500"
                      style={{
                        left: `${((data.heartRate - 60) / (100 - 60)) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-slate-300 mt-2">
                    <span>60 BPM</span>
                    <span>Normal</span>
                    <span>100 BPM</span>
                  </div>
                </div>

                <div className="h-[150px] w-full pt-4 -mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={heartRateHistory} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="time" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} minTickGap={15} />
                      <YAxis
                        stroke="#cbd5e1"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        domain={[60, 100]}
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
                        formatter={(value: number) => [`${value.toFixed(0)} BPM`, "Rythme Cardiaque"]}
                      />
                      <ReferenceLine y={80} stroke="#475569" strokeDasharray="3 3" />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "#ef4444", stroke: "#1e293b" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
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
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-base text-zinc-400">Altitude</div>
                    <div className="text-3xl font-bold text-zinc-100">{data.altitude.toFixed(0)} m</div>
                  </div>
                  <div>
                    <div className="text-base text-zinc-400">Humidité</div>
                    <div className="text-3xl font-bold text-zinc-100">{data.humidity.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-base text-zinc-400">Latitude</div>
                    <div className="text-base font-medium text-zinc-100">{data.latitudeDegrees.toFixed(6)}° N</div>
                  </div>
                  <div>
                    <div className="text-base text-zinc-400">Longitude</div>
                    <div className="text-base font-medium text-zinc-100">{data.longitudeDegrees.toFixed(6)}° E</div>
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
                <div className="lg:col-span-3 h-[300px] w-full rounded-lg overflow-hidden border border-zinc-800">
                  <LocationMap
                    latitude={data.latitudeDegrees}
                    longitude={data.longitudeDegrees}
                    altitude={data.altitude}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 