export interface VitalData {
  externalTemp: number
  internalTemp: number
  humidity: number
  movement: boolean
  speed: number
  altitude: number
  latitudeDegrees: number
  longitudeDegrees: number
  GPStime: string
  GPSdate: string
}

export function generateVitalData(prevData: VitalData): VitalData {
  // Internal temperature (body temperature) - normal range: 36.1°C to 37.2°C
  const internalTemp = prevData.internalTemp + (Math.random() - 0.5) * 0.2
  const normalizedInternalTemp = Math.max(36.1, Math.min(37.2, internalTemp))

  // External temperature (environment) - range: -20°C to 10°C
  const externalTemp = prevData.externalTemp + (Math.random() - 0.5) * 0.5
  const normalizedExternalTemp = Math.max(-20, Math.min(10, externalTemp))

  return {
    ...prevData,
    internalTemp: normalizedInternalTemp,
    externalTemp: normalizedExternalTemp,
    humidity: Math.max(0, Math.min(100, prevData.humidity + (Math.random() - 0.5) * 5)),
    movement: Math.random() > 0.5,
    speed: Math.max(0, Math.min(10, prevData.speed + (Math.random() - 0.5) * 0.5)),
    altitude: Math.max(0, Math.min(8848, prevData.altitude + (Math.random() - 0.5) * 10)),
    latitudeDegrees: prevData.latitudeDegrees + (Math.random() - 0.5) * 0.0001,
    longitudeDegrees: prevData.longitudeDegrees + (Math.random() - 0.5) * 0.0001,
    GPStime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    GPSdate: new Date().toLocaleDateString(),
  }
} 