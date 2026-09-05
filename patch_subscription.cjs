const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeDashboard.tsx', 'utf8');

const target = `
        // Leads
        unsubs.push(
          onSnapshot(
            query(
              collection(db, "crmLeads"),`;

const replacement = `
        // Top Performers
        unsubs.push(
          onSnapshot(
            query(
              collection(db, "clientAccounts"),
              where("status", "==", "Verified"),
            ),
            (snap) => {
              const counts: Record<string, number> = {};
              snap.forEach((doc) => {
                const data = doc.data();
                counts[data.submittedBy] = (counts[data.submittedBy] || 0) + 1;
              });
              const sorted = Object.entries(counts)
                .map(([id, count]) => ({ id, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);
              setTopPerformers(sorted);
            },
          ),
        );

        // Leads
        unsubs.push(
          onSnapshot(
            query(
              collection(db, "crmLeads"),`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/EmployeeDashboard.tsx', code);
  console.log("Subscription injected");
} else {
  console.log("Subscription target not found");
}
