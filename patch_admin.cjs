const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  'import { CRMModule } from "./CRMModule";',
  'import { CRMModule } from "./CRMModule";\nimport { BiometricApprovalModule } from "./BiometricApprovalModule";'
);

code = code.replace(
  '{/* ClickCamp Technologies Specific Modules */}',
  '<div className="mb-6"><BiometricApprovalModule /></div>\n      {/* ClickCamp Technologies Specific Modules */}'
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("AdminDashboard.tsx patched");
