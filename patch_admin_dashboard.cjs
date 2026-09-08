const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Add import
const importStatement = `import { SecurityAdminPanel } from "./SecurityAdminPanel";\n`;
if (!code.includes("SecurityAdminPanel")) {
  code = code.replace('import { CRMModule } from "./CRMModule";', importStatement + 'import { CRMModule } from "./CRMModule";');
  
  // Add component
  const target = `<CRMModule currentUser={currentUser} />`;
  const replacement = `<SecurityAdminPanel users={users} />\n        <CRMModule currentUser={currentUser} />`;
  code = code.replace(target, replacement);
  
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log('AdminDashboard.tsx updated.');
} else {
  console.log('Already imported.');
}
