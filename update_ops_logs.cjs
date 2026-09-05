const fs = require('fs');
let code = fs.readFileSync('src/components/OperationsDashboard.tsx', 'utf8');

const activityLogger = `
  const logActivity = async (action: string, entityId: string, entityType: 'Lead' | 'ClientAccount', details?: string) => {
    try {
      const { collection, addDoc } = await import("firebase/firestore");
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
  `  const handleAction = async (action: "Verified" | "Rejected") => {`,
  activityLogger + `\n  const handleAction = async (action: "Verified" | "Rejected") => {`
);

code = code.replace(
  `      setSelectedAccount(null);`,
  `      await logActivity(\`\${action === 'Verified' ? 'approved' : 'rejected'} account \${selectedAccount.clientName}\`, selectedAccount.id, 'ClientAccount', action === 'Rejected' ? rejectReason : '');\n      setSelectedAccount(null);`
);

fs.writeFileSync('src/components/OperationsDashboard.tsx', code);
console.log("OperationsDashboard.tsx updated with Activity Logging");
