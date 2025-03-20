"use client"

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

interface MapComponentProps {
  latitude: number
  longitude: number
  altitude: number
}

export default function MapComponent({ latitude, longitude, altitude }: MapComponentProps) {
  return (
    <div className="h-[300px] w-full rounded-lg overflow-hidden border border-zinc-800">
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Marker position={[latitude, longitude]} icon={icon}>
          <Popup>
            <div className="text-sm space-y-1 text-zinc-100">
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