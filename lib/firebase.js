import { initializeApp, getApps, getApp } from "firebase/app"
import { getAnalytics, isSupported } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyDvI65IoKzZKlA4a5sKP5e-vfsP96qQTwg",
  authDomain: "dono-school.firebaseapp.com",
  projectId: "dono-school",
  storageBucket: "dono-school.firebasestorage.app",
  messagingSenderId: "884455511138",
  appId: "1:884455511138:web:75bd954279bfd8d4616d3b",
  measurementId: "G-ZGHNQL5J3N",
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const initAnalytics = async () => {
  if (typeof window === "undefined") return null
  const supported = await isSupported()
  if (!supported) return null
  return getAnalytics(firebaseApp)
}
