import React, { useState, useEffect } from "react"
import { AlertCircle, AlertTriangle, AlertOctagon, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AlertCardProps {
  type: "pre" | "serious" | "critical" | null
  onClose: () => void
}

export function AlertCard({ type, onClose }: AlertCardProps) {
  const [countdown, setCountdown] = useState<number>(0)
  const [cooldownTimer, setCooldownTimer] = useState<number>(0)

  const alertConfig = {
    pre: {
      title: "Pré-Alerte",
      description: "Risque modéré détecté - Surveillance accrue. Veuillez appuyer sur le bouton physique pour annuler l'alerte.",
      icon: AlertTriangle,
      bgColor: "bg-blue-500",
      textColor: "text-blue-50",
      borderColor: "border-blue-400",
      duration: 30, // 30 seconds
      dismissible: true,
      cooldown: 5, // 5 seconds cooldown
    },
    serious: {
      title: "Alerte Sérieuse",
      description: "Situation sérieuse détectée - Confirmation requise. Veuillez appuyer sur le bouton physique pour annuler l'alerte.",
      icon: AlertOctagon,
      bgColor: "bg-orange-500",
      textColor: "text-orange-50",
      borderColor: "border-orange-400",
      duration: 10, // 10 seconds
      dismissible: true,
      cooldown: 5, // 5 seconds cooldown
    },
    critical: {
      title: "Alerte Critique",
      description: "Situation critique détectée - SOS envoyé automatiquement. Intervention immédiate requise.",
      icon: AlertCircle,
      bgColor: "bg-red-500",
      textColor: "text-red-50",
      borderColor: "border-red-400",
      duration: 0, // No auto-close
      dismissible: false,
      cooldown: 0, // No cooldown for critical alerts
    },
  }

  if (!type) return null

  const config = alertConfig[type]
  const Icon = config.icon

  useEffect(() => {
    if (!type) return

    if (config.duration > 0) {
      setCountdown(config.duration)
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 0) {
            clearInterval(timer)
            onClose()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [type, config.duration, onClose])

  useEffect(() => {
    if (cooldownTimer > 0) {
      const timer = setInterval(() => {
        setCooldownTimer(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [cooldownTimer])

  const handleClose = () => {
    if (cooldownTimer > 0) return
    onClose()
    if (config.cooldown > 0) {
      setCooldownTimer(config.cooldown)
    }
  }

  return (
    <Card className={`${config.bgColor} border-2 ${config.borderColor} shadow-lg`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Icon className={`w-6 h-6 ${config.textColor} animate-pulse`} />
          <span className={config.textColor}>{config.title}</span>
        </CardTitle>
        {config.dismissible && (
          <button 
            onClick={handleClose}
            className={`${config.textColor} hover:opacity-70 transition-opacity ${
              cooldownTimer > 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={cooldownTimer > 0}
          >
            <X size={20} />
          </button>
        )}
      </CardHeader>
      <CardContent>
        <p className={`${config.textColor} text-sm mb-4`}>
          {config.description}
        </p>

        {config.duration > 0 && (
          <div className="space-y-2">
            <div className="h-1.5 w-full rounded-full bg-white/20">
              <div 
                className="h-full rounded-full bg-white/40 transition-all duration-1000"
                style={{ width: `${(countdown / config.duration) * 100}%` }}
              />
            </div>
            <p className={`text-center ${config.textColor} text-sm`}>
              {countdown} secondes restantes
            </p>
          </div>
        )}

        {cooldownTimer > 0 && (
          <p className={`text-center ${config.textColor} text-xs mt-2 opacity-75`}>
            Réactivation possible dans {cooldownTimer} secondes
          </p>
        )}
      </CardContent>
    </Card>
  )
} 