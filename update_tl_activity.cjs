const fs = require('fs');
let code = fs.readFileSync('src/components/TeamLeaderDashboard.tsx', 'utf8');

if (!code.includes('ActivityFeedWidget')) {
  code = code.replace(
    `import jsPDF from "jspdf";`,
    `import { ActivityFeedWidget } from "./ActivityFeedWidget";\nimport jsPDF from "jspdf";`
  );

  code = code.replace(
    `            {/* Pipeline & CRM Oversight */}`,
    `            {/* Activity Feed */}\n            <ActivityFeedWidget userIds={teamMembers.map(m => m.id)} />\n\n            {/* Pipeline & CRM Oversight */}`
  );
  
  // also change the layout from 2 cols to something else? Wait, there are 2 divs already in that grid: Live Team Activity Board and Pipeline & CRM Oversight.
  // The grid is grid-cols-1 lg:grid-cols-2 gap-6. Adding a third one will wrap. That's fine.
  
  fs.writeFileSync('src/components/TeamLeaderDashboard.tsx', code);
  console.log("TeamLeaderDashboard.tsx updated with Activity Feed");
}
