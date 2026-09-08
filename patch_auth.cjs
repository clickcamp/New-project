const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const oldLoginBlock = `app.post('/api/auth/login', async (req, res) => {
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
    if (userData.role !== 'Admin') {
      return res.json({ verified: true, user: { id: userDoc.id, ...userData } });
    }

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
});`;

const newLoginBlock = `app.post('/api/auth/login', async (req, res) => {
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
    if (userData.is_2fa_enabled) {
      if (!userData['2fa_secret']) {
        return res.status(400).json({ error: "2FA is enabled but not configured. Contact admin." });
      }
      return res.json({ require2FA: true, tempUserId: userId });
    } else {
      // 2FA not enabled
      return res.json({ verified: true, user: { id: userDoc.id, ...userData } });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});`;

serverCode = serverCode.replace(oldLoginBlock, newLoginBlock);

const oldVerifyBlock = `app.post('/api/auth/verify-2fa', async (req, res) => {
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
});`;

const newVerifyBlock = `app.post('/api/auth/verify-2fa', async (req, res) => {
  try {
    const { userId, token } = req.body;
    const uDoc = await getDoc(doc(db, "users", userId));
    if (!uDoc.exists()) return res.status(404).json({ error: "User not found" });
    
    const data = uDoc.data();
    if (!data.is_2fa_enabled || !data['2fa_secret']) return res.status(400).json({ error: "2FA not set up for this user" });

    const result = await authenticator.verify({ token, secret: data['2fa_secret'] });
    
    if (result.valid) {
      res.json({ verified: true, user: { id: uDoc.id, ...data } });
    } else {
      res.status(401).json({ error: "Invalid 2FA token" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint to generate 2FA for a user
app.post('/api/admin/2fa-setup', async (req, res) => {
  try {
    const { targetUserId } = req.body;
    // In a real app we would check req.user to ensure they are an admin
    const uDoc = await getDoc(doc(db, "users", targetUserId));
    if (!uDoc.exists()) return res.status(404).json({ error: "User not found" });
    
    const userData = uDoc.data();
    const secret = authenticator.generateSecret();
    const userEmail = userData.email || 'user@clickcamp.site';
    const otpauthUrl = authenticator.generateURI({ issuer: 'ClickCamp', label: userEmail, secret });
    
    await updateDoc(doc(db, "users", targetUserId), {
      is_2fa_enabled: true,
      '2fa_secret': secret
    });
    
    res.json({ secret, qrCodeData: otpauthUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint to disable 2FA for a user
app.post('/api/admin/2fa-disable', async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const uDoc = await getDoc(doc(db, "users", targetUserId));
    if (!uDoc.exists()) return res.status(404).json({ error: "User not found" });
    
    await updateDoc(doc(db, "users", targetUserId), {
      is_2fa_enabled: false,
      '2fa_secret': null
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`;

serverCode = serverCode.replace(oldVerifyBlock, newVerifyBlock);
fs.writeFileSync('server.ts', serverCode);
console.log('server.ts updated.');
