"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Custom marker icon for dark theme
const icon = L.divIcon({
  className: "custom-marker",
  html: `<div class="w-4 h-4 bg-indigo-500 rounded-full border-2 border-white shadow-lg"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8],
})

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