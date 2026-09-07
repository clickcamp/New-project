import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyCbv1QmUsukzttaGAwxLEaIrDhZQICM97I",
  projectId: "ceremonial-sublime-xp928",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-clickcampistwork-7c8225fa-82a8-4a69-a85d-387dfdb49492");
async function test() {
  const snap = await getDocs(collection(db, "users"));
  console.log(snap.size);
}
test().catch(console.error);
