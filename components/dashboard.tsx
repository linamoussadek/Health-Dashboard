// Dashboard component - Main view for health monitoring
"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mountain, Activity, Thermometer, MapPin, Zap, Code } from "lucide-react"
import { type VitalData } from "@/lib/data-generator"
import { Badge } from "@/components/ui/badge"
import { TemperatureGauge } from "@/components/temperature-gauge"
import { LocationMap } from "@/components/location-map"
import { MotionIndicator } from "@/components/motion-indicator"
import { database } from "@/lib/firebase"
import { ref, onValue, off } from "firebase/database"
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, Line, ResponsiveContainer } from "recharts"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, AlertOctagon } from "lucide-react"

// Health status calculation functions
function scoreFrequenceCardiaqueTempTS(Tc: number, FC: number): number {
  if (FC < 40 && Tc < 32) return 1;  // Situation critique : risque vital
  if (FC > 120 && Tc >= 32 && Tc < 35) return 0.9;  // Hypothermie compensatoire
  if (FC > 140 || (FC < 50 && Tc >= 32 && Tc < 36)) return 0.8;  // Tachycardie ou bradycardie modérée
  if (FC >= 100 && FC <= 140 && Tc >= 35 && Tc < 36) return 0.7;  // Risque léger
  if (FC >= 50 && FC < 100 && Tc >= 36 && Tc <= 38.5) return 0.5;  // Valeurs normales
  if (FC > 180 || Tc > 40) return 1;  // Hyperthermie ou crise cardiaque
  return 0;  // Aucun risque détecté
}

function scoreImmobiliteTS(M: boolean, tImmobile: number): number {
  if (!M && tImmobile > 30) return 1;  // Immobilité critique
  if (!M && tImmobile > 20) return 0.8;  // Immobilité prolongée avec risque élevé
  if (!M && tImmobile > 10) return 0.5;  // Surveillance nécessaire
  return 0;  // Personne en mouvement
}

function scoreTemperatureEnvironnementTS(Tc: number, Te: number, FC: number): number {
  let score = 0;
  if (Tc < 32 || Tc > 40) score = 1;  // Hypothermie ou hyperthermie critique
  else if (Tc >= 32 && Tc < 35 && Te < -10) score = 0.9;  // Hypothermie sévère dans un environnement froid
  else if (Tc >= 35 && Tc < 36 && Te < -15) score = 0.8;  // Risque d'hypothermie rapide
  else if (Tc >= 36 && Tc < 37 && Te < -10) score = 0.7;  // Début d'impact du froid
  else if (Tc >= 37 && Tc <= 38.5) score = 0.5;  // Température corporelle normale
  else if (Tc > 39 && FC > 150) score = 0.9;  // Coup de chaleur potentiel
  
  if (Te < -15) score += 0.2;  // Risque aggravé en cas de température extérieure très basse
  
  return Math.min(1, score);
}

function scoreInteractionMedicaleTS(Tc: number, FC: number, tImmobile: number): number {
  if (Tc < 32 && FC < 40 && tImmobile > 20) return 1;  // Risque vital
  if (Tc < 35 && FC > 120 && tImmobile > 15) return 0.8;  // Tachycardie avec hypothermie
  if (Tc < 35 || tImmobile > 15) return 0.5;  // Risque modéré
  return 0;  // Aucun risque identifié
}

function calculerScoreGraviteTS(Tc: number, FC: number, M: boolean, tImmobile: number, Te: number): number {
  const w1 = 0.3, w2 = 0.3, w3 = 0.2, w4 = 0.2;

  const scoreFc = scoreFrequenceCardiaqueTempTS(Tc, FC);
  const scoreM = scoreImmobiliteTS(M, tImmobile);
  const scoreTc = scoreTemperatureEnvironnementTS(Tc, Te, FC);
  const scoreInter = scoreInteractionMedicaleTS(Tc, FC, tImmobile);

  const SG = (w1 * scoreFc) + (w2 * scoreM) + (w3 * scoreTc) + (w4 * scoreInter);
  return Math.min(1, SG);
}

function evaluerNiveauGraviteTS(SG: number): string {
  if (SG < 0.3) return "Situation normale";
  if (SG >= 0.3 && SG < 0.6) return "Pré-alerte : Risque modéré";
  if (SG >= 0.6 && SG < 0.8) return "Alerte sérieuse : Confirmation requise";
  return "ALERTE CRITIQUE : Envoi SOS automatique";
}

function determinerEtatSante(Tc: number, FC: number, Te: number, immobile: number): string {
  // Situations d'urgence vitale immédiate (priorité absolue)
  if (Tc <= 24) {
    if (FC < 40) return "Hypothermie profonde avec bradycardie sévère - Arrêt cardiaque imminent";
    if (FC > 100) return "Hypothermie profonde avec tachycardie paradoxale - Risque d'arythmie fatal";
    return "Hypothermie profonde - Arrêt cardiaque imminent";
  }

  if (Tc >= 41.5) {
    if (FC > 180) return "Hyperthermie maligne avec tachycardie critique - Risque de collapsus cardiovasculaire";
    if (!immobile) return "Hyperthermie maligne avec immobilité - Risque de défaillance multi-organes";
    return "Hyperthermie maligne - Risque vital immédiat";
  }

  // Combinaisons critiques température-rythme cardiaque
  if (Tc <= 28) {
    if (FC < 40) return "Hypothermie sévère avec bradycardie critique - Risque d'asystolie";
    if (FC > 150) return "Hypothermie sévère avec tachycardie paradoxale - Haute instabilité";
    if (!immobile && immobile > 30) return "Hypothermie sévère avec immobilité prolongée - Risque de décès";
    return "Hypothermie sévère - Risque d'arythmie majeur";
  }

  if (Tc <= 32) {
    if (FC < 50) return "Hypothermie modérée avec bradycardie - Risque d'arythmie";
    if (FC > 120) return "Hypothermie modérée avec tachycardie compensatoire - Instabilité";
    if (!immobile && immobile > 20) return "Hypothermie modérée avec immobilité - Aggravation rapide";
    return "Hypothermie modérée";
  }

  // Combinaisons avec température externe extrême
  if (Te < -25) {
    if (Tc <= 35) return "Exposition au froid extrême avec hypothermie - Risque vital";
    if (!immobile && immobile > 15) return "Exposition au froid extrême avec immobilité - Hypothermie imminente";
  }

  // Combinaisons avec immobilité critique
  if (!immobile) {
    if (immobile > 40 && Tc <= 35) return "Immobilité critique avec hypothermie - Pronostic vital engagé";
    if (immobile > 40 && FC < 50) return "Immobilité critique avec bradycardie - Risque de syncope";
    if (immobile > 30 && Te < -20) return "Immobilité prolongée en environnement hostile - Risque majeur";
  }

  // Situations critiques cardiaques
  if (FC > 220) {
    if (Tc >= 39) return "Tachycardie critique avec hyperthermie - Risque de choc";
    return "Tachycardie critique - Risque d'insuffisance cardiaque aiguë";
  }

  if (FC < 35) {
    if (Tc <= 35) return "Bradycardie extrême avec hypothermie - Risque d'arrêt";
    return "Bradycardie extrême - Risque de défaillance circulatoire";
  }

  // Situations sérieuses mais non critiques
  const conditions: string[] = [];

  // Analyse de la température corporelle
  if (Tc <= 35 && Tc > 32) conditions.push("Hypothermie légère");
  else if (Tc >= 38.5 && Tc < 40) conditions.push("Hyperthermie modérée");
  else if (Tc >= 40 && Tc < 41.5) conditions.push("Hyperthermie sévère");

  // Analyse du rythme cardiaque
  if (FC >= 35 && FC < 50) conditions.push("Bradycardie significative");
  else if (FC > 150 && FC <= 180) conditions.push("Tachycardie sévère");
  else if (FC > 180 && FC <= 220) conditions.push("Tachycardie très sévère");

  // Analyse de l'immobilité
  if (!immobile) {
    if (immobile > 20 && immobile <= 30) conditions.push("Immobilité prolongée");
    else if (immobile > 15 && immobile <= 20) conditions.push("Immobilité préoccupante");
  }

  // État stable
  if (conditions.length === 0 && 
      Tc > 35 && Tc < 38.5 && 
      FC >= 50 && FC <= 150 && 
      (immobile <= 15 || data.movement)) {
    return "État physiologique stable";
  }

  // Combinaison des conditions non critiques
  if (conditions.length > 0) {
    return conditions.join(" avec ");
  }

  return "État indéterminé";
}

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
    GPSdate: "",
    GPStime: "",
    gravityScore: 0,
    immobileTime: 0,  // Add this new field
  })

  const [heartRateHistory, setHeartRateHistory] = useState<{ value: number; time: string }[]>([])
  const [tempHistory, setTempHistory] = useState<{ internal: number; external: number; time: string }[]>([])
  const [showRawData, setShowRawData] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertType, setAlertType] = useState<string>("")
  const previousAlertType = useRef<string>("")

  // Function to handle alerts based on risk level
  const handleRiskLevel = (riskLevel: string) => {
    if (riskLevel !== previousAlertType.current) {
      setShowAlert(true)
      setAlertType(riskLevel)
      previousAlertType.current = riskLevel
    }
  }

  // Add useEffect for client-side time updates
  useEffect(() => {
    // Only run on the client side
    if (typeof window === 'undefined') return;

    const updateTime = () => {
      setData(currentData => ({
        ...currentData,
        GPStime: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'UTC'
        }),
        GPSdate: new Date().toLocaleDateString('en-US', {
          timeZone: 'UTC'
        })
      }));
    };

    // Update immediately and then every second
    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log("Setting up Firebase connection...")
    // Reference to your Firebase data path
    const dataRef = ref(database, '/UsersData/xAG0EpRU4ZPNCvMU8awkfLQMip83/readings')
    console.log("Firebase reference created:", dataRef)

    // Set up real-time listener
    onValue(dataRef, (snapshot) => {
      console.log("Received data from Firebase:", snapshot.val())
      const readings = snapshot.val()
      if (readings) {
        console.log("Processing readings:", readings)
        // Get the latest reading (last timestamp)
        const timestamps = Object.keys(readings)
        console.log("Available timestamps:", timestamps)
        const latestTimestamp = timestamps[timestamps.length - 1]
        console.log("Latest timestamp:", latestTimestamp)
        const latestReading = readings[latestTimestamp]
        console.log("Latest reading:", latestReading)

        // Handle risk level alerts
        handleRiskLevel(latestReading.EtatDeLalpiniste)

        // Convert string values to numbers and update the data state
        setData(currentData => {
          const newData = {
            ...currentData,
            heartRate: parseFloat(latestReading.BPM) || currentData.heartRate,
            internalTemp: parseFloat(latestReading.InternalTemperature),
            externalTemp: parseFloat(latestReading.ExternalTemperature),
            altitude: parseFloat(latestReading.altitude),
            humidity: parseFloat(latestReading.humidity),
            latitudeDegrees: parseFloat(latestReading.latitudeDegrees),
            longitudeDegrees: parseFloat(latestReading.longitudeDegrees),
            movement: latestReading.movement === "1",
            speed: parseFloat(latestReading.speed),
            timestamp: new Date(parseInt(latestReading.timestamp) * 1000),
            healthStatus: latestReading.EtatDeLalpiniste || "normal",
            gravityScore: parseFloat(latestReading.ScoreDeGravite) || 0
          }
          console.log("Updated state data:", newData)
          return newData
        })

        // Update history with consistent time format
        const timeString = new Date(parseInt(latestReading.timestamp) * 1000).toLocaleTimeString('en-US', { 
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
        
        setHeartRateHistory(prev => [...prev.slice(-19), { 
          value: parseFloat(latestReading.BPM) || data.heartRate, 
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
      } else {
        console.log("No readings found in the snapshot")
      }
    }, (error) => {
      console.error("Error connecting to Firebase:", error)
    })

    // Cleanup subscription on unmount
    return () => {
      console.log("Cleaning up Firebase connection")
      off(dataRef)
    }
  }, [])

  // Test function to simulate different states
  useEffect(() => {
    if (!database) {
      // Simulate data updates when not connected to Firebase
      const states = [
        {
          // Situation 1: Hypothermie modérée avec début de bradycardie
          EtatDeLalpiniste: "Risque modere",
          BPM: "58",
          InternalTemperature: "35.2",
          ExternalTemperature: "-12.0",
          altitude: "3200",
          humidity: "65",
          latitudeDegrees: "45.5",
          longitudeDegrees: "6.5",
          movement: "1",
          speed: "1.5",
          timestamp: (Date.now() / 1000).toString(),
          GPSdate: "",
          GPStime: "",
          ScoreDeGravite: "0.5"
        },
        {
          // Situation 2: Hypothermie sévère avec bradycardie et immobilité
          EtatDeLalpiniste: "Alerte serieuse: Confirmation Requise",
          BPM: "45",
          InternalTemperature: "31.5",
          ExternalTemperature: "-15.0",
          altitude: "3500",
          humidity: "75",
          latitudeDegrees: "45.5",
          longitudeDegrees: "6.5",
          movement: "0",
          speed: "0",
          timestamp: (Date.now() / 1000).toString(),
          GPSdate: "",
          GPStime: "",
          ScoreDeGravite: "0.75"
        },
        {
          // Situation 3: Hypothermie critique avec bradycardie sévère
          EtatDeLalpiniste: "Alerte critique: SOS Automatique",
          BPM: "38",
          InternalTemperature: "29.5",
          ExternalTemperature: "-18.0",
          altitude: "3800",
          humidity: "80",
          latitudeDegrees: "45.5",
          longitudeDegrees: "6.5",
          movement: "0",
          speed: "0",
          timestamp: (Date.now() / 1000).toString(),
          GPSdate: "",
          GPStime: "",
          ScoreDeGravite: "1.0"
        }
      ];

      let currentIndex = 0;
      const interval = setInterval(() => {
        const reading = states[currentIndex];
        handleRiskLevel(reading.EtatDeLalpiniste);
        
        setData(currentData => ({
          ...currentData,
          heartRate: parseFloat(reading.BPM),
          internalTemp: parseFloat(reading.InternalTemperature),
          externalTemp: parseFloat(reading.ExternalTemperature),
          altitude: parseFloat(reading.altitude),
          humidity: parseFloat(reading.humidity),
          latitudeDegrees: parseFloat(reading.latitudeDegrees),
          longitudeDegrees: parseFloat(reading.longitudeDegrees),
          movement: reading.movement === "1",
          speed: parseFloat(reading.speed),
          timestamp: new Date(parseInt(reading.timestamp) * 1000),
          healthStatus: reading.EtatDeLalpiniste,
          gravityScore: parseFloat(reading.ScoreDeGravite)
        }));

        currentIndex = (currentIndex + 1) % states.length;
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  // Add immobility timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!data.movement) {
      timer = setInterval(() => {
        setData(prev => ({
          ...prev,
          immobileTime: prev.immobileTime + 1
        }));
      }, 1000);
    } else {
      setData(prev => ({
        ...prev,
        immobileTime: 0
      }));
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [data.movement]);

  // Update the health status calculation
  useEffect(() => {
    const score = calculerScoreGraviteTS(
      data.internalTemp,
      data.heartRate,
      data.movement,
      data.immobileTime / 60,
      data.externalTemp
    );
    
    // Calculate actual health condition
    const conditionMedicale = determinerEtatSante(
      data.internalTemp,
      data.heartRate,
      data.externalTemp,
      data.immobileTime / 60
    );
    
    if (conditionMedicale !== data.healthStatus) {
      setData(prev => ({
        ...prev,
        healthStatus: conditionMedicale
      }));
    }
  }, [data.internalTemp, data.heartRate, data.movement, data.immobileTime, data.externalTemp]);

  // Alert component based on risk level
  const renderAlert = () => {
    if (!showAlert) return null

    let alertProps = {
      variant: "default" as const,
      icon: AlertCircle,
      title: "",
      description: "",
      className: ""
    }

    switch (alertType) {
      case "Risque modere":
        alertProps = {
          variant: "default",
          icon: AlertCircle,
          title: "Risque modéré",
          description: "Pré-alerte : Une attention particulière est requise",
          className: "bg-yellow-500/20 border-yellow-500 text-yellow-500"
        }
        break
      case "Alerte serieuse: Confirmation Requise":
        alertProps = {
          variant: "default",
          icon: AlertTriangle,
          title: "Alerte sérieuse",
          description: "Confirmation requise : Veuillez vérifier l'état de l'alpiniste",
          className: "bg-orange-500/20 border-orange-500 text-orange-500"
        }
        break
      case "Alerte critique: SOS Automatique":
        alertProps = {
          variant: "default",
          icon: AlertOctagon,
          title: "Alerte critique",
          description: "SOS automatique envoyé ! Intervention immédiate requise",
          className: "bg-red-500/20 border-red-500 text-red-500"
        }
        break
      default:
        return null
    }

    const AlertIcon = alertProps.icon

    return (
      <Alert 
        variant={alertProps.variant}
        className={`fixed top-24 right-4 w-96 z-50 animate-in slide-in-from-right duration-300 ${alertProps.className}`}
      >
        <AlertIcon className="h-5 w-5" />
        <AlertTitle className="text-lg font-semibold">{alertProps.title}</AlertTitle>
        <AlertDescription className="text-sm mt-1">{alertProps.description}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 relative overflow-x-hidden">
      {renderAlert()}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm w-full">
        <div className="container flex h-20 items-center justify-between px-6 max-w-[1800px] mx-auto">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Mountain className="h-8 w-8 text-indigo-400" />
              <h1 className="text-2xl font-bold text-zinc-100">Moniteur de Santé Alpin</h1>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="raw-mode"
                checked={showRawData}
                onCheckedChange={setShowRawData}
                className="data-[state=checked]:bg-indigo-500"
              />
              <Label htmlFor="raw-mode" className="flex items-center gap-2 text-sm text-zinc-400">
                <Code className="h-4 w-4" />
                Mode Behind the Scenes
              </Label>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Badge variant="outline" className="gap-1 border-zinc-800 px-4 py-1.5 bg-zinc-950/50 text-base text-white">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Données en Direct
            </Badge>
          </div>
        </div>
      </header>

      <main className="container flex-1 px-6 py-8 max-w-[1800px] mx-auto w-full">
        {showRawData ? (
          <Card className="col-span-full border-zinc-800 bg-zinc-950/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-zinc-100">Données Brutes</CardTitle>
              <CardDescription className="text-base text-zinc-400">JSON en temps réel</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="p-4 rounded-lg bg-zinc-900 overflow-auto max-h-[400px] text-sm text-zinc-300">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ) : (
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

                <CardDescription className="text-lg text-zinc-400">Condition médicale actuelle</CardDescription>

                <div className="mt-2 mb-1">
                  <div className="text-3xl font-bold text-zinc-100">
                    {(() => {
                      const status = data.healthStatus.toLowerCase();
                      
                      // Urgences vitales - Rouge vif
                      if (status.includes("arrêt cardiaque") || 
                          status.includes("risque vital") ||
                          status.includes("urgence vitale") ||
                          status.includes("pronostic vital") ||
                          status.includes("défaillance") ||
                          status.includes("asystolie")) {
                        return <span className="text-red-500">{data.healthStatus}</span>;
                      }
                      
                      // Situations très graves - Rouge orangé
                      if (status.includes("critique") ||
                          status.includes("maligne") ||
                          status.includes("collapsus") ||
                          status.includes("risque de décès")) {
                        return <span className="text-red-400">{data.healthStatus}</span>;
                      }

                      // Situations sévères - Orange
                      if (status.includes("sévère") ||
                          status.includes("profonde") ||
                          status.includes("extrême")) {
                        return <span className="text-orange-500">{data.healthStatus}</span>;
                      }

                      // Situations modérées avec risque - Jaune orangé
                      if (status.includes("risque d'arythmie") ||
                          status.includes("instabilité") ||
                          status.includes("aggravation")) {
                        return <span className="text-amber-500">{data.healthStatus}</span>;
                      }

                      // Situations modérées - Jaune
                      if (status.includes("modérée") ||
                          status.includes("compensatoire") ||
                          status.includes("prolongée")) {
                        return <span className="text-yellow-500">{data.healthStatus}</span>;
                      }

                      // Situations légères - Bleu clair
                      if (status.includes("légère") ||
                          status.includes("mineure") ||
                          status.includes("préoccupante")) {
                        return <span className="text-blue-400">{data.healthStatus}</span>;
                      }

                      // État stable - Vert
                      if (status.includes("stable") ||
                          status === "état physiologique stable") {
                        return <span className="text-emerald-400">{data.healthStatus}</span>;
                      }

                      // État par défaut ou indéterminé - Gris
                      return <span className="text-zinc-400">{data.healthStatus}</span>;
                    })()}
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
                      {(data.gravityScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${data.gravityScore * 100}%`,
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
        )}
      </main>
    </div>
  )
} 