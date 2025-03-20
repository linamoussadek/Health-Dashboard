import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

// Your Firebase configuration
const firebaseConfig = {
  databaseURL: "https://alpisafe-ce734-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Function to generate random sensor data
function generateSensorData() {
  return {
    ExternalTemperature: (20 + Math.random() * 2).toFixed(2),
    InternalTemperature: (20 + Math.random() * 0.5).toFixed(2),
    altitude: "0.00",
    humidity: (35 + Math.random() * 5).toFixed(2),
    latitudeDegrees: "0.00",
    longitudeDegrees: "0.00",
    movement: Math.random() > 0.8 ? "1" : "0", // 20% chance of movement
    speed: "0.00",
    timestamp: Math.floor(Date.now() / 1000).toString(),
    GPSdate: new Date().toLocaleDateString(),
    GPStime: new Date().toLocaleTimeString(),
    heartRate: Math.floor(70 + Math.random() * 20).toString() // Random heart rate between 70-90
  };
}

// Function to send data to Firebase
async function sendData() {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const data = generateSensorData();
  
  try {
    await set(ref(database, `UsersData/xAG0EpRU4ZPNCvMU8awkfLQMip83/readings/${timestamp}`), data);
    console.log('Data sent successfully:', data);
  } catch (error) {
    console.error('Error sending data:', error);
  }
}

// Send data every 5 seconds
setInterval(sendData, 5000);

// Send initial data
sendData();

console.log('Test script running. Press Ctrl+C to stop.'); 