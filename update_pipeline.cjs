const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeDashboard.tsx', 'utf8');

code = code.replace(/targetCount = currentUser\.target \|\| 50/g, 'targetCount = currentUser.target || 10');
code = code.replace(/Q3 Performance/g, 'Monthly Goal');
code = code.replace(/status: "New"/g, 'status: "Lead"');
code = code.replace(/\["New", "Documents Submitted", "Rejected", "Account Opened"\]/g, '["Lead", "Documents Submitted", "Rejected", "Account Active"]');
code = code.replace(/status !== "Account Opened"/g, 'status !== "Account Active"');
code = code.replace(/updateLeadStatus\(lead\.id, "Account Opened"\)/g, 'updateLeadStatus(lead.id, "Account Active")');

fs.writeFileSync('src/components/EmployeeDashboard.tsx', code);
console.log("Updated");
