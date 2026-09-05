const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

if (!code.includes('OpsPerformanceWidget')) {
  code = code.replace(
    `import { cn, formatIST } from "../utils";`,
    `import { cn, formatIST } from "../utils";\nimport { OpsPerformanceWidget } from "./OpsPerformanceWidget";`
  );

  code = code.replace(
    `<LeaderboardModule currentUser={currentUser} users={users} />
        <ResourceLibraryModule currentUser={currentUser} />`,
    `<LeaderboardModule currentUser={currentUser} users={users} />
        <div className="space-y-6">
          <ResourceLibraryModule currentUser={currentUser} />
          <OpsPerformanceWidget users={users} />
        </div>`
  );

  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log("AdminDashboard.tsx updated with Ops widget");
}
