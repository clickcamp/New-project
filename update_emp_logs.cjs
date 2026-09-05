const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeDashboard.tsx', 'utf8');

// Helper to add activity log function inside EmployeeDashboard
const activityLogger = `
  const logActivity = async (action: string, entityId: string, entityType: 'Lead' | 'ClientAccount', details?: string) => {
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await addDoc(collection(db, "activityLogs"), {
        action,
        entityId,
        entityType,
        performedBy: currentUser.id,
        performedByName: \`\${currentUser.firstName} \${currentUser.lastName}\`,
        timestamp: new Date().toISOString(),
        details
      });
    } catch(e) { console.error(e); }
  };
`;

code = code.replace(
  `  const updateLeadStatus = async (id: string, status: string) => {`,
  activityLogger + `\n  const updateLeadStatus = async (id: string, status: string) => {`
);

// updateLeadStatus
code = code.replace(
  `await updateDoc(doc(db, "leads", id), { status });`,
  `await updateDoc(doc(db, "leads", id), { status, updatedAt: new Date().toISOString() });\n      await logActivity(\`moved lead to \${status}\`, id, 'Lead');`
);

// handleLogAccount (added a clientAccount)
code = code.replace(
  `      await addDoc(collection(db, "clientAccounts"), {`,
  `      const docRef = await addDoc(collection(db, "clientAccounts"), {`
);
code = code.replace(
  `      setClientName("");`,
  `      await logActivity(\`submitted account \${clientName} for verification\`, docRef.id, 'ClientAccount', \`Platform: \${platform}\`);\n      setClientName("");`
);

// handleAddLead
code = code.replace(
  `await addDoc(collection(db, "leads"), {`,
  `const leadDoc = await addDoc(collection(db, "leads"), {`
);
code = code.replace(
  `setShowAddModal(false);`,
  `await logActivity(\`added a new lead \${newLead.clientName}\`, leadDoc.id, 'Lead');\n      setShowAddModal(false);`
);

// Recovery queue resubmit
code = code.replace(
  `updateDoc(doc(db, "clientAccounts", a.id), { status: "Pending Verification", reviewNotes: "", reviewedBy: null, reviewedByName: null });`,
  `updateDoc(doc(db, "clientAccounts", a.id), { status: "Pending Verification", reviewNotes: "", reviewedBy: null, reviewedByName: null });
                        logActivity(\`resubmitted account \${a.clientName} for verification\`, a.id, 'ClientAccount');`
);

fs.writeFileSync('src/components/EmployeeDashboard.tsx', code);
console.log("EmployeeDashboard.tsx updated with Activity Logging");
