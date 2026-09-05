const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeDashboard.tsx', 'utf8');

code = code.replace(/\\\$\{todayLog\.totalHours\}/g, '${todayLog.totalHours}');
code = code.replace(/\\\$\{formatIST/g, '${formatIST');
code = code.replace(/\\\$\{format/g, '${format');

fs.writeFileSync('src/components/EmployeeDashboard.tsx', code);
console.log("Fixed escaping");
