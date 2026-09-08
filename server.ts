import { createServer as createHttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { randomUUID } from "crypto";
import multer from "multer";
import fs from "fs";



import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { OTP } from "otplib";
const authenticator = new OTP();

const fbConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const fbApp = initializeApp(fbConfig);
const db = getFirestore(fbApp, fbConfig.firestoreDatabaseId);

function euclideanDistance(desc1, desc2) {
  return Math.sqrt(desc1.reduce((sum, val, i) => sum + Math.pow(val - desc2[i], 2), 0));
}

const app = express();
const PORT = 3000;

app.use(express.json());

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
});

app.post('/api/auth/verify-2fa', async (req, res) => {
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
});

// Configure storage for documents
const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Simulated Database Collections
let dmsDocuments: any[] = [];
let dmsAuditLogs: any[] = [];

// 1. Upload Document API
app.post('/api/dms/upload', upload.single('file'), (req, res) => {
    try {
        const { title, category, uploadedBy } = req.body;
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const newDoc = {
            id: 'DOC-' + Date.now(),
            title: title || req.file.originalname,
            filename: req.file.filename,
            category: category || 'General',
            uploadedBy: uploadedBy || 'Unknown User',
            uploadDate: new Date().toISOString(),
            version: 1,
            path: req.file.path
        };

        dmsDocuments.push(newDoc);

        // Log the tracking action
        dmsAuditLogs.push({
            action: 'UPLOAD',
            docId: newDoc.id,
            performedBy: uploadedBy || 'Unknown User',
            timestamp: new Date().toISOString()
        });

        res.status(201).json({ message: "Document uploaded successfully", document: newDoc });
    } catch (err) {
        res.status(500).json({ error: "Failed to upload document" });
    }
});

// 2. Track & Fetch Document Logs API
app.get('/api/dms/logs', (req, res) => {
    res.json(dmsAuditLogs);
});

// Fetch all documents
app.get('/api/dms/documents', (req, res) => {
    res.json(dmsDocuments);
});

// 3. Track Document View / Download Activity
app.get('/api/dms/download/:id', (req, res) => {
    const docId = req.params.id;
    const doc = dmsDocuments.find(d => d.id === docId);

    if (!doc) return res.status(404).json({ error: "Document not found" });

    // Log download tracking event
    dmsAuditLogs.push({
        action: 'DOWNLOAD',
        docId: doc.id,
        performedBy: req.query.user || 'Guest',
        timestamp: new Date().toISOString()
    });

    res.download(doc.path, doc.title);
});

// In-memory data store
let users = [
  {
    id: "admin-1",
    firstName: "System",
    lastName: "Admin",
    role: "Admin",
    status: "Approved",
    email: "system.admin@clickcamp.site",
    department: "IT",
    password: "malik123"
  },
  {
    id: "hr-1",
    firstName: "HR",
    lastName: "Manager",
    role: "HR",
    status: "Approved",
    email: "hr.manager@clickcamp.site",
    department: "Human Resources",
    password: "hr123"
  },
  {
    id: "emp-1",
    firstName: "Umama",
    lastName: "Sheikh",
    role: "HR",
    status: "Approved",
    email: "umama.sheikh@clickcamp.site",
    department: "Human Resources",
    password: "malikbaby123"
  },
  {
    id: "emp-2",
    firstName: "John",
    lastName: "Doe",
    role: "Employee",
    status: "Approved",
    email: "john.doe@clickcamp.site",
    department: "Engineering",
    password: "password123"
  }
];

let timeLogs: any[] = [];
let leaveRequests: any[] = [];

// Login API
app.post("/api/login", (req, res) => {
  const { userId, password } = req.body;
  const user = users.find((u) => u.id === userId);
  
  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }
  
  if (user.password !== password) {
    return res.status(400).json({ error: "Invalid password" });
  }
  
  res.json(user);
});

// Update password API
app.put("/api/users/:id/password", (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  user.password = password;
  res.json({ message: "Password updated successfully", user });
});

// Get all leave requests
app.get("/api/leave-requests", (req, res) => {
  res.json(leaveRequests);
});

// Get user leave requests
app.get("/api/users/:id/leave-requests", (req, res) => {
  const { id } = req.params;
  const requests = leaveRequests.filter(req => req.userId === id);
  res.json(requests);
});

// Create leave request
app.post("/api/leave-requests", (req, res) => {
  const { userId, startDate, endDate, reason } = req.body;
  const newRequest = {
    id: randomUUID(),
    userId,
    startDate,
    endDate,
    reason,
    status: "Pending",
  };
  leaveRequests.push(newRequest);
  res.json(newRequest);
});

// Update leave request status
app.put("/api/leave-requests/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const request = leaveRequests.find(req => req.id === id);
  if (!request) {
    return res.status(404).json({ error: "Leave request not found" });
  }
  request.status = status;
  res.json(request);
});

// Get all users
app.get("/api/users", (req, res) => {
  res.json(users);
});

// Add new user (Employee, HR, Admin)
app.post("/api/users", (req, res) => {
  const { firstName, lastName, role, department, autoApprove, password } = req.body;
  const status = autoApprove ? "Approved" : "Pending";
  const email = autoApprove 
    ? `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}@clickcamp.site` 
    : undefined;

  const newUser = {
    id: randomUUID(),
    firstName,
    lastName,
    role: role || "Employee",
    department: department || "General",
    status,
    email,
    password: password || "clickcamp123"
  };
  users.push(newUser as any);
  res.json(newUser);
});

// Delete user (Employee or HR)
app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  const deletedUser = users[index];
  users.splice(index, 1);

  // Clean up associated time logs and leave requests
  timeLogs = timeLogs.filter((log) => log.userId !== id);
  leaveRequests = leaveRequests.filter((lr) => lr.userId !== id);

  res.json({ message: "User deleted successfully", user: deletedUser });
});

// Approve user
app.post("/api/users/:id/approve", (req, res) => {
  const { id } = req.params;
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  user.status = "Approved";
  user.email = `${user.firstName.toLowerCase()}.${user.lastName.toLowerCase()}@clickcamp.site`;
  
  res.json(user);
});

// Get time logs
app.get("/api/time-logs", (req, res) => {
  res.json(timeLogs);
});

// Get user time logs
app.get("/api/users/:id/time-logs", (req, res) => {
  const { id } = req.params;
  const logs = timeLogs.filter(log => log.userId === id);
  res.json(logs);
});

// Clock In
app.post("/api/time-logs/clock-in", (req, res) => {
  const { userId } = req.body;
  
  // Check if already clocked in and not clocked out
  const activeLog = timeLogs.find(log => log.userId === userId && !log.clockOut);
  if (activeLog) {
    return res.status(400).json({ error: "Already clocked in" });
  }

  const newLog = {
    id: randomUUID(),
    userId,
    clockIn: new Date().toISOString(),
  };
  timeLogs.push(newLog);
  res.json(newLog);
});

// Clock Out
app.post("/api/time-logs/:id/clock-out", (req, res) => {
  const { id } = req.params;
  const log = timeLogs.find((l) => l.id === id);
  
  if (!log) {
    return res.status(404).json({ error: "Time log not found" });
  }
  if (log.clockOut) {
    return res.status(400).json({ error: "Already clocked out" });
  }

  log.clockOut = new Date().toISOString();
  
  // Calculate total hours
  const start = new Date(log.clockIn).getTime();
  const end = new Date(log.clockOut).getTime();
  const hours = (end - start) / (1000 * 60 * 60);
  log.totalHours = hours;

  res.json(log);
});


// Vite middleware for development
async function startServer() {
  const httpServer = createHttpServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*" }
  });

  // Basic in-memory chat history
  let chatMessages: any[] = [];

  io.on("connection", (socket) => {
    // Send previous messages
    socket.emit("chat_history", chatMessages);

    socket.on("send_message", (data) => {
      const msg = {
        id: randomUUID(),
        ...data,
        timestamp: new Date().toISOString()
      };
      chatMessages.push(msg);
      io.emit("new_message", msg);
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
