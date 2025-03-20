export type VitalData = {
  heartRate: number
  internalTemp: number
  externalTemp: number
  motion: number
  altitude: number
  timestamp: Date
  healthStatus: string
  humidity: number
  movement: boolean
  speed: number
  latitudeDegrees: number
  longitudeDegrees: number
  GPSdate: string
  GPStime: string
  gravityScore: number
  immobileTime: number
}

export function generateVitalData(previousData: VitalData) {
  // Create small random variations
  const heartRateChange = Math.random() * 6 - 3 // -3 to +3 BPM
  const internalTempChange = (Math.random() * 0.4 - 0.2) / 10 // -0.02 to +0.02 °C
  const externalTempChange = (Math.random() * 0.6 - 0.3) / 10 // -0.03 to +0.03 °C
  const motionChange = (Math.random() * 0.4 - 0.2) / 10 // -0.02 to +0.02 units
  const altitudeChange = Math.random() > 0.7 ? Math.floor(Math.random() * 10) - 5 : 0 // Occasional -5 to +5m change
  const humidityChange = (Math.random() * 0.4 - 0.2) / 10 // -0.02 to +0.02 units
  const speedChange = (Math.random() * 0.4 - 0.2) / 10 // -0.02 to +0.02 km/h

  // Calculate new values
  let newHeartRate = previousData.heartRate + heartRateChange
  let newInternalTemp = previousData.internalTemp + internalTempChange
  let newExternalTemp = previousData.externalTemp + externalTempChange
  let newMotion = previousData.motion + motionChange
  let newAltitude = previousData.altitude + altitudeChange
  let newHumidity = previousData.humidity + humidityChange
  let newSpeed = previousData.speed + speedChange

  // Add occasional spikes for realism
  if (Math.random() > 0.9) {
    // 10% chance of a spike
    if (Math.random() > 0.5) {
      newHeartRate += 10 // Heart rate spike
      newMotion += 0.3 // Motion spike
    } else {
      newInternalTemp += 0.2 // Temperature spike
    }
  }

  // Ensure values stay within realistic ranges
  newHeartRate = Math.max(45, Math.min(140, newHeartRate))
  newInternalTemp = Math.max(35, Math.min(39.5, newInternalTemp))
  newExternalTemp = Math.max(-20, Math.min(5, newExternalTemp))
  newMotion = Math.max(0, Math.min(1, newMotion))
  newAltitude = Math.max(0, newAltitude)
  newHumidity = Math.max(0, Math.min(100, newHumidity))
  newSpeed = Math.max(0, Math.min(10, newSpeed))

  // Determine health status based on vital signs
  let healthStatus = "normal"

  if (newHeartRate > 120 || newHeartRate < 50 || newInternalTemp > 38.5 || newInternalTemp < 35.5) {
    healthStatus = "danger"
  } else if (
    newHeartRate > 100 ||
    newHeartRate < 60 ||
    newInternalTemp > 37.8 ||
    newInternalTemp < 36.2 ||
    newExternalTemp < -15
  ) {
    healthStatus = "caution"
  }

  return {
    heartRate: Math.round(newHeartRate),
    internalTemp: newInternalTemp,
    externalTemp: newExternalTemp,
    motion: newMotion,
    altitude: newAltitude,
    timestamp: new Date(),
    healthStatus,
    humidity: newHumidity,
    movement: newMotion > 0.1,
    speed: newSpeed,
    latitudeDegrees: previousData.latitudeDegrees,
    longitudeDegrees: previousData.longitudeDegrees,
    GPSdate: new Date().toLocaleDateString(),
    GPStime: new Date().toLocaleTimeString(),
  }
}

