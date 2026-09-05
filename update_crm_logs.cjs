const fs = require('fs');
let code = fs.readFileSync('src/components/CRMModule.tsx', 'utf8');

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
  `  const handleAddLead = async (e: React.FormEvent) => {`,
  activityLogger + `\n  const handleAddLead = async (e: React.FormEvent) => {`
);

code = code.replace(
  `await addDoc(collection(db, "leads"), {`,
  `const leadDoc = await addDoc(collection(db, "leads"), {`
);

code = code.replace(
  `      setShowAddModal(false);`,
  `      await logActivity(\`added a new lead \${newLead.clientName}\`, leadDoc.id, 'Lead');\n      setShowAddModal(false);`
);

code = code.replace(
  `      await updateDoc(doc(db, "leads", leadId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });`,
  `      await updateDoc(doc(db, "leads", leadId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      await logActivity(\`moved lead to \${newStatus}\`, leadId, 'Lead');`
);

fs.writeFileSync('src/components/CRMModule.tsx', code);
console.log("CRMModule.tsx updated with Activity Logging");
