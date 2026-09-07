const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldAdminLogin = `app.post('/api/admin/login', async (req, res) => {
  const { password, storedHash } = req.body;
  // In a real app, the server would query the DB for the hash.
  // For this prototype, the client queries Firestore and passes the hash to the server to verify.
  const isValid = await bcrypt.compare(password, storedHash);
  if (isValid) {
    res.json({ success: true, token: 'admin-jwt-token-mock' });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});`;

const newAdminLogin = `app.post('/api/admin/login', async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) return res.status(400).json({ error: "Missing fields" });
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return res.status(404).json({ error: "User not found" });
    const userData = userDoc.data();
    
    let storedHash = userData.password_hash;
    if (!storedHash && userData.password) {
       storedHash = await bcrypt.hash(userData.password, 10);
       await updateDoc(doc(db, "users", userId), { password_hash: storedHash });
    }
    
    if (!storedHash) return res.status(401).json({ error: "Invalid password" });
    
    const isValid = await bcrypt.compare(password, storedHash);
    if (isValid) {
      res.json({ success: true, token: 'admin-jwt-token-mock' });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`;

code = code.replace(oldAdminLogin, newAdminLogin);
fs.writeFileSync('server.ts', code);
console.log("Admin login updated in server.ts");
