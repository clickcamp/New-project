import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCbv1QmUsukzttaGAwxLEaIrDhZQICM97I",
  authDomain: "ceremonial-sublime-xp928.firebaseapp.com",
  projectId: "ceremonial-sublime-xp928",
  storageBucket: "ceremonial-sublime-xp928.firebasestorage.app",
  messagingSenderId: "332745415785",
  appId: "1:332745415785:web:d1f3cf7e1c41a6b38ed6f8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-clickcampistwork-7c8225fa-82a8-4a69-a85d-387dfdb49492");
