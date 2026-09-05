const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('ActivityLog')) {
  code += `
export interface ActivityLog {
  id: string;
  action: string;
  entityId: string;
  entityType: 'Lead' | 'ClientAccount';
  performedBy: string;
  performedByName: string;
  timestamp: string;
  details?: string;
}
`;
  fs.writeFileSync('src/types.ts', code);
  console.log("types.ts updated");
}
