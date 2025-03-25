import React, { useState, useEffect } from "react"
import { AlertCircle, AlertTriangle, AlertOctagon, X } from "lucide-react"

interface AlertModalProps {
  type: "pre" | "serious" | "critical"
  onClose: () => void
  isOpen: boolean
}

export function AlertModal({ type, onClose, isOpen }: AlertModalProps) {
  const [countdown, setCountdown] = useState<number>(0)
  const [cooldownTimer, setCooldownTimer] = useState<number>(0)

  const alertConfig = {
    pre: {
      title: "Pré-Alerte",
      description: "Risque modéré détecté - Surveillance accrue. Veuillez appuyer sur le bouton physique pour annuler l'alerte.",
      icon: AlertTriangle,
      className: "bg-yellow-500/20 border-yellow-500 text-yellow-500",
      duration: 30, // 30 seconds
      dismissible: true,
      cooldown: 5, // 5 seconds cooldown
    },
    serious: {
      title: "Alerte Sérieuse",
      description: "Situation sérieuse détectée - Confirmation requise. Veuillez appuyer sur le bouton physique pour annuler l'alerte.",
      icon: AlertOctagon,
      className: "bg-orange-500/20 border-orange-500 text-orange-500",
      duration: 10, // 10 seconds
      dismissible: true,
      cooldown: 5, // 5 seconds cooldown
    },
    critical: {
      title: "Alerte Critique",
      description: "Situation critique détectée - SOS envoyé automatiquement. Intervention immédiate requise.",
      icon: AlertCircle,
      className: "bg-red-500/20 border-red-500 text-red-500",
      duration: 0, // No auto-close
      dismissible: false,
      cooldown: 0, // No cooldown for critical alerts
    },
  }

  const config = alertConfig[type]
  const Icon = config.icon

  useEffect(() => {
    if (!isOpen) return

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
  }, [isOpen, config.duration, onClose])

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

  if (!isOpen) return null

  const colorClass = config.className.split(" ")[0].split("/")[0]
  const baseColor = colorClass.split("-")[1]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className={`fixed inset-0 bg-${baseColor}-500/90`} />
      <div className={`relative bg-${baseColor}-500/95 p-8 rounded-lg shadow-2xl max-w-2xl w-full mx-4 border-4 border-${baseColor}-400`}>
        <button 
          onClick={handleClose}
          className={`absolute top-4 right-4 text-white hover:text-gray-200 transition-colors ${
            (!config.dismissible || cooldownTimer > 0) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={!config.dismissible || cooldownTimer > 0}
        >
          <X size={24} />
        </button>
        
        <div className="flex items-center gap-4 mb-6">
          <Icon className="w-12 h-12 text-white animate-pulse" />
          
          <div>
            <h2 className={`text-3xl font-bold text-${baseColor}-100 mb-2`}>
              {config.title}
            </h2>
            <p className={`text-xl text-${baseColor}-100`}>
              {config.description}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <p className={`text-lg text-${baseColor}-100`}>
            {config.description}
          </p>

          {config.duration > 0 && (
            <div className="mt-6">
              <div className="h-2 w-full rounded-full bg-white/20">
                <div 
                  className={`h-full rounded-full bg-${baseColor}-400 transition-all duration-1000`}
                  style={{ width: `${(countdown / config.duration) * 100}%` }}
                />
              </div>
              <p className={`text-center mt-2 text-${baseColor}-100`}>
                {countdown} secondes restantes
              </p>
            </div>
          )}

          {cooldownTimer > 0 && (
            <p className={`text-center mt-2 text-${baseColor}-100 text-sm`}>
              Réactivation possible dans {cooldownTimer} secondes
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 