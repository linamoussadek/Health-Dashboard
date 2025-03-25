// Dashboard component - Main view for health monitoring
"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mountain, Activity, Thermometer, MapPin, Zap, Code, AlertCircle, AlertTriangle, AlertOctagon } from "lucide-react"
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
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { AlertModal } from "@/components/alert-modal"
import { AlertCard } from "@/components/alert-card"

interface Reading {
  ButtonState: string;
  BPM: string;
  InternalTemperature: string;
  ExternalTemperature: string;
  altitude: string;
  humidity: string;
  latitudeDegrees: string;
  longitudeDegrees: string;
  movement: string;
  speed: string;
  timestamp: string;
  EtatDeLalpiniste: string;
  ScoreDeGravite: string;
  tempsDimmobilite: string;
  GPSdate: string;
  GPStime: string;
}

interface DashboardData {
  heartRate: number;
  internalTemp: number;
  externalTemp: number;
  altitude: number;
  humidity: number;
  latitudeDegrees: number;
  longitudeDegrees: number;
  movement: boolean;
  speed: number;
  timestamp: Date;
  healthStatus: string;
  gravityScore: number;
  immobileTime: number;
  GPSdate: string;
  GPStime: string;
  EtatDeLalpiniste: string;
}

interface HeartRateData {
  value: number;
  time: string;
}

interface TemperatureData {
  internal: number;
  external: number;
  time: string;
}

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

function determinerEtatSante(Tc: number, FC: number, Te: number, immobile: number, movement: boolean): string {
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
      (immobile <= 15 || movement)) {
    return "État physiologique stable";
  }

  // Combinaison des conditions non critiques
  if (conditions.length > 0) {
    return conditions.join(" avec ");
  }

  return "État indéterminé";
}

export default function Dashboard() {
  const { toast } = useToast()
  const [data, setData] = useState<DashboardData>({
    heartRate: 0,
    internalTemp: 0,
    externalTemp: 0,
    altitude: 0,
    humidity: 0,
    latitudeDegrees: 0,
    longitudeDegrees: 0,
    movement: false,
    speed: 0,
    timestamp: new Date(),
    healthStatus: "normal",
    gravityScore: 0,
    immobileTime: 0,
    GPSdate: "",
    GPStime: "",
    EtatDeLalpiniste: "Situation normale"
  })

  const [heartRateHistory, setHeartRateHistory] = useState<{ value: number; time: string }[]>([])
  const [tempHistory, setTempHistory] = useState<{ internal: number; external: number; time: string }[]>([])
  const [showRawData, setShowRawData] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertType, setAlertType] = useState<"pre" | "serious" | "critical" | null>(null)
  const previousAlertType = useRef<string>("")
  const [previousButtonState, setPreviousButtonState] = useState<string>("0")
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; type: "pre" | "serious" | "critical" }>({
    isOpen: false,
    type: "pre",
  })

  // Function to handle alerts based on risk level
  const handleRiskLevel = (riskLevel: string) => {
    if (riskLevel !== previousAlertType.current) {
      setShowAlert(true)
      setAlertType(riskLevel as "pre" | "serious" | "critical" | null)
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
    const readingsRef = ref(database, 'UsersData/UWSJMXimYdNU9QiUS0KN90Uel7g2/readings')
    console.log("Firebase reference created:", readingsRef)
    
    const unsubscribe = onValue(readingsRef, (snapshot) => {
      console.log('Received data from Firebase:', snapshot.val())
      const firebaseData = snapshot.val()
      
      if (firebaseData) {
        // Get the latest reading by finding the most recent timestamp
        const readings = Object.entries(firebaseData).map(([key, value]) => ({
          timestamp: key,
          ...value as Reading
        }))
        const latest = readings.reduce((latest, current) => {
          return parseInt(current.timestamp) > parseInt(latest.timestamp) ? current : latest
        }, readings[0])

        console.log('Latest reading:', latest)

        // Check for button press cycle (0->1->0)
        const currentButtonState = latest.ButtonState
        if (currentButtonState === "0" && previousButtonState === "1") {
          // Button was just released (completed the cycle)
          if (alertType !== "critical") {
            setAlertType(null)
          }
        }
        setPreviousButtonState(currentButtonState)

        // Check gravity score for alerts
        const gravityScore = parseFloat(latest.ScoreDeGravite)
        const buttonState = latest.ButtonState === "1"

        // Only show new alert if button state is 0 (not acknowledged) and no current alert
        if (!buttonState && !alertType) {
          if (gravityScore >= 0.8) {
            setAlertType("critical")
            console.log("SOS signal sent automatically")
          } else if (gravityScore >= 0.6) {
            setAlertType("serious")
          } else if (gravityScore >= 0.3) {
            setAlertType("pre")
          }
        }

        // Update dashboard with latest reading
        setData(currentData => ({
          ...currentData,
          heartRate: parseFloat(latest.BPM) || 0,
          internalTemp: parseFloat(latest.InternalTemperature),
          externalTemp: parseFloat(latest.ExternalTemperature),
          altitude: parseFloat(latest.altitude),
          humidity: parseFloat(latest.humidity),
          latitudeDegrees: parseFloat(latest.latitudeDegrees),
          longitudeDegrees: parseFloat(latest.longitudeDegrees),
          movement: latest.movement === "1",
          speed: parseFloat(latest.speed),
          timestamp: new Date(parseInt(latest.timestamp) * 1000),
          healthStatus: determinerEtatSante(
            parseFloat(latest.InternalTemperature),
            parseFloat(latest.BPM),
            parseFloat(latest.ExternalTemperature),
            parseFloat(latest.tempsDimmobilite) || 0,
            latest.movement === "1"
          ),
          gravityScore: parseFloat(latest.ScoreDeGravite) || 0,
          immobileTime: parseFloat(latest.tempsDimmobilite) || 0,
          GPSdate: latest.GPSdate || "",
          GPStime: latest.GPStime || "",
          EtatDeLalpiniste: latest.EtatDeLalpiniste || "Situation normale"
        }))

        // Update history with consistent time format
        const timeString = new Date(parseInt(latest.timestamp) * 1000).toLocaleTimeString('en-US', { 
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
        
        setHeartRateHistory(prev => [...prev.slice(-19), { 
          value: parseFloat(latest.BPM), 
          time: timeString 
        }])
        
        setTempHistory(prev => [
          ...prev.slice(-19),
          {
            internal: parseFloat(latest.InternalTemperature),
            external: parseFloat(latest.ExternalTemperature),
            time: timeString,
          },
        ])
      } else {
        console.log("No readings found in the snapshot")
      }
    }, (error) => {
      console.error("Error fetching data:", error)
    })

    return () => {
      console.log("Cleaning up Firebase connection")
      unsubscribe()
    }
  }, [alertType, previousButtonState])

  // Remove the test data simulation since we're using real Firebase data
  useEffect(() => {
    if (!data.movement) {
      const timer = setInterval(() => {
        setData(prev => ({
          ...prev,
          immobileTime: prev.immobileTime + 1
        }))
      }, 1000)
      return () => clearInterval(timer)
    } else {
      setData(prev => ({
        ...prev,
        immobileTime: 0
      }))
    }
  }, [data.movement])

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
      data.immobileTime / 60,
      data.movement
    );
    
    if (conditionMedicale !== data.healthStatus) {
      setData(prev => ({
        ...prev,
        healthStatus: conditionMedicale
      }));
    }
  }, [data.internalTemp, data.heartRate, data.movement, data.immobileTime, data.externalTemp]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 relative overflow-x-hidden">
      <Toaster />
      <AlertModal 
        isOpen={alertModal.isOpen}
        type={alertModal.type}
        onClose={() => setAlertModal({ isOpen: false, type: "pre" })}
      />
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
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-zinc-100">État de Santé</h1>
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
                  </div>

                  {/* Alert Status Integration */}
                  <div className="w-[300px] border-l border-zinc-800 pl-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl font-semibold text-zinc-100">État d&apos;Alerte</span>
                      {data.EtatDeLalpiniste === "Situation normale" ? (
                        <Activity className="h-6 w-6 text-emerald-400" />
                      ) : data.EtatDeLalpiniste === "Pre-alerte : Risque modere" ? (
                        <AlertTriangle className="h-6 w-6 text-blue-400 animate-pulse" />
                      ) : data.EtatDeLalpiniste === "Alerte serieuse : Confirmation requise" ? (
                        <AlertOctagon className="h-6 w-6 text-orange-400 animate-pulse" />
                      ) : data.EtatDeLalpiniste === "Alerte critique" ? (
                        <AlertCircle className="h-6 w-6 text-red-400 animate-pulse" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-zinc-400" />
                      )}
                    </div>
                    
                    <div className={`text-2xl font-bold mb-2 ${
                      data.EtatDeLalpiniste === "Situation normale" ? "text-emerald-400" :
                      data.EtatDeLalpiniste === "Pre-alerte : Risque modere" ? "text-blue-400" :
                      data.EtatDeLalpiniste === "Alerte serieuse : Confirmation requise" ? "text-orange-400" :
                      data.EtatDeLalpiniste === "Alerte critique" ? "text-red-400" :
                      "text-zinc-400"
                    }`}>
                      {data.EtatDeLalpiniste === "Situation normale" ? "Situation Normale" :
                       data.EtatDeLalpiniste === "Pre-alerte : Risque modere" ? "Pré-Alerte" :
                       data.EtatDeLalpiniste === "Alerte serieuse : Confirmation requise" ? "Alerte Sérieuse" :
                       data.EtatDeLalpiniste === "Alerte critique" ? "ALERTE CRITIQUE" :
                       "État Indéterminé"}
                    </div>
                    
                    <div className={`p-3 rounded-lg mb-2 ${
                      data.EtatDeLalpiniste === "Situation normale" ? "bg-emerald-500/20 border-2 border-emerald-500/30" :
                      data.EtatDeLalpiniste === "Pre-alerte : Risque modere" ? "bg-blue-500/20 border-2 border-blue-500/30" :
                      data.EtatDeLalpiniste === "Alerte serieuse : Confirmation requise" ? "bg-orange-500/20 border-2 border-orange-500/30" :
                      data.EtatDeLalpiniste === "Alerte critique" ? "bg-red-500/20 border-2 border-red-500/30" :
                      "bg-zinc-800/50 border-2 border-zinc-700/30"
                    }`}>
                      <div className="flex flex-col gap-1">
                        <p className="text-sm text-zinc-100">
                          {data.EtatDeLalpiniste === "Situation normale" ? 
                            "Tous les paramètres sont normaux." :
                           data.EtatDeLalpiniste === "Pre-alerte : Risque modere" ? 
                            "Surveillance accrue recommandée." :
                           data.EtatDeLalpiniste === "Alerte serieuse : Confirmation requise" ? 
                            "Appuyez sur le bouton d'urgence" :
                           data.EtatDeLalpiniste === "Alerte critique" ? 
                            "APPEL D'URGENCE EN COURS (911)" :
                            "État du système non disponible"}
                        </p>
                        {data.EtatDeLalpiniste === "Alerte serieuse : Confirmation requise" && (
                          <div className="flex items-center gap-2">
                            <div className={`text-lg font-mono ${
                              Math.max(0, 10 - Math.floor(data.immobileTime)) <= 3 ? "text-red-400 animate-pulse" : "text-orange-400"
                            }`}>
                              {Math.max(0, 10 - Math.floor(data.immobileTime))}s
                            </div>
                            <span className="text-xs text-zinc-400">avant l'alerte critique</span>
                          </div>
                        )}
                        {data.EtatDeLalpiniste === "Alerte critique" && (
                          <div className="text-sm font-semibold text-red-400 animate-pulse">
                            SOS envoyé
                          </div>
                        )}
                      </div>
                    </div>
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
                          left: `${Math.min(Math.max(((data.heartRate - 60) / (100 - 60)) * 100, 0), 100)}%`,
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