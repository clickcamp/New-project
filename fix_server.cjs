const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');
const lines = code.split('\n');
const startIndex = lines.findIndex(l => l.includes("import { generateRegistrationOptions"));
const endIndex = lines.findIndex(l => l.includes("// Configure storage for documents"));

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex);
  
  const unifiedAuthEndpoints = `
app.post('/api/auth/login', async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) return res.status(400).json({ error: "Missing fields" });
  
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return res.status(404).json({ error: "User not found" });
    const userData = userDoc.data();
    
    // Auto-migrate standard password to password_hash if needed for the prototype
    let storedHash = userData.password_hash;
    if (!storedHash && userData.password) {
       const bcrypt = await import("bcryptjs");
       storedHash = await bcrypt.default.hash(userData.password, 10);
       await updateDoc(doc(db, "users", userId), { password_hash: storedHash });
    }
    
    if (!storedHash) return res.status(401).json({ error: "Invalid password" });
    
    const bcryptModule = await import("bcryptjs");
    const isValid = await bcryptModule.default.compare(password, storedHash);
    
    if (!isValid) return res.status(401).json({ error: "Invalid password" });

    // Password is valid. Now check 2FA.
    if (!userData.totp_secret) {
      const secret = authenticator.generateSecret();
      const userEmail = userData.email || 'user@clickcamp.site';
      const otpauthUrl = authenticator.generateURI({ issuer: 'ClickCamp', label: userEmail, secret });
      
      // Save secret to user
      await updateDoc(doc(db, "users", userId), { totp_secret: secret });
      
      return res.json({ setup2FA: true, qrCodeData: otpauthUrl, tempUserId: userId });
    } else {
      return res.json({ require2FA: true, tempUserId: userId });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/verify-2fa', async (req, res) => {
  try {
    const { userId, token } = req.body;
    const uDoc = await getDoc(doc(db, "users", userId));
    if (!uDoc.exists()) return res.status(404).json({ error: "User not found" });
    
    const data = uDoc.data();
    if (!data.totp_secret) return res.status(400).json({ error: "2FA not set up for this user" });

    const result = await authenticator.verify({ token, secret: data.totp_secret });
    
    if (result.valid) {
      res.json({ verified: true, user: { id: uDoc.id, ...data } });
    } else {
      res.status(401).json({ error: "Invalid 2FA token" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
`;
  lines.splice(startIndex, 0, unifiedAuthEndpoints);
  fs.writeFileSync('server.ts', lines.join('\n'));
  console.log("Fixed server.ts successfully");
} else {
  console.log("Could not find boundaries", startIndex, endIndex);
}
