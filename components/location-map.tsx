"use client"

import dynamic from "next/dynamic"

// Dynamically import the map component with no SSR
const MapComponent = dynamic(() => import("./map-component"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-zinc-900">
      <div className="text-zinc-400">Chargement de la carte...</div>
    </div>
  ),
})

interface LocationMapProps {
  latitude: number
  longitude: number
  altitude: number
}

export function LocationMap({ latitude, longitude, altitude }: LocationMapProps) {
  return <MapComponent latitude={latitude} longitude={longitude} altitude={altitude} />
} 