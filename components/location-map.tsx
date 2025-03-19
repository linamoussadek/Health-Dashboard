"use client"

import { useEffect, useState } from "react"
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

interface LocationMapProps {
  latitude: number
  longitude: number
  altitude: number
}

export function LocationMap({ latitude, longitude, altitude }: LocationMapProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-800">
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={icon}>
          <Popup>
            <div className="text-sm space-y-1">
              <p className="font-medium">Altitude: {altitude}m</p>
              <p>Lat: {latitude.toFixed(6)}° N</p>
              <p>Lon: {longitude.toFixed(6)}° E</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
} 