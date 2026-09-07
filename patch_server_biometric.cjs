const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add imports
const imports = `
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { authenticator } from "otplib";

const fbConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const fbApp = initializeApp(fbConfig);
const db = getFirestore(fbApp, fbConfig.firestoreDatabaseId);

function euclideanDistance(desc1, desc2) {
  return Math.sqrt(desc1.reduce((sum, val, i) => sum + Math.pow(val - desc2[i], 2), 0));
}
`;

code = code.replace('const app = express();', imports + '\nconst app = express();');

const apiRoutes = `
app.post('/api/biometric/register', async (req, res) => {
  try {
    const { userId, descriptor, userEmail } = req.body;
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(userEmail, 'ClickCamp', secret);
    
    await updateDoc(doc(db, "users", userId), {
      face_status: 'pending',
      face_descriptor: descriptor,
      totp_secret: secret
    });
    
    res.json({ secret, otpauthUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/biometric/approve', async (req, res) => {
  try {
    const { userId } = req.body;
    await updateDoc(doc(db, "users", userId), {
      face_status: 'active'
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/biometric/login', async (req, res) => {
  try {
    const { descriptor } = req.body;
    const usersSnap = await getDocs(collection(db, "users"));
    let bestMatch = null;
    let minDistance = 0.5; // Threshold
    
    usersSnap.forEach(uDoc => {
      const data = uDoc.data();
      if (data.face_status === 'active' && data.face_descriptor) {
        const distance = euclideanDistance(descriptor, data.face_descriptor);
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = { id: uDoc.id, ...data };
        }
      }
    });
    
    if (bestMatch) {
      res.json({ require2FA: true, tempUserId: bestMatch.id });
    } else {
      res.status(401).json({ error: "Face not recognized or pending approval." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/biometric/verify-2fa', async (req, res) => {
  try {
    const { tempUserId, token } = req.body;
    const uDoc = await getDoc(doc(db, "users", tempUserId));
    if (!uDoc.exists()) return res.status(404).json({ error: "User not found" });
    
    const data = uDoc.data();
    const isValid = authenticator.check(token, data.totp_secret);
    
    if (isValid) {
      res.json({ verified: true, user: { id: uDoc.id, ...data } });
    } else {
      res.status(401).json({ error: "Invalid 2FA token" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
`;

code = code.replace('app.post(\'/api/webauthn/generate-registration-options\',', apiRoutes + '\napp.post(\'/api/webauthn/generate-registration-options\',');

fs.writeFileSync('server.ts', code);
console.log("server.ts patched");
