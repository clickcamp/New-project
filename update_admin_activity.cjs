const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

if (!code.includes('ActivityFeedWidget')) {
  code = code.replace(
    `import { OpsPerformanceWidget } from "./OpsPerformanceWidget";`,
    `import { OpsPerformanceWidget } from "./OpsPerformanceWidget";\nimport { ActivityFeedWidget } from "./ActivityFeedWidget";`
  );

  code = code.replace(
    `        <div className="space-y-6">
          <ResourceLibraryModule currentUser={currentUser} />
          <OpsPerformanceWidget users={users} />
        </div>`,
    `        <div className="space-y-6">
          <ResourceLibraryModule currentUser={currentUser} />
          <OpsPerformanceWidget users={users} />
          <ActivityFeedWidget />
        </div>`
  );
  
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log("AdminDashboard.tsx updated with Activity Feed");
}
