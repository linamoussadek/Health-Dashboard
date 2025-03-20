import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  databaseURL: "https://alpisafe-ce734-default-rtdb.firebaseio.com/",
  // Add other Firebase config options if needed
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database }; 