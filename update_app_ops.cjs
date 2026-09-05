const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('OperationsDashboard')) {
  code = code.replace(
    `import { TeamLeaderDashboard } from "./components/TeamLeaderDashboard";`,
    `import { TeamLeaderDashboard } from "./components/TeamLeaderDashboard";\nimport { OperationsDashboard } from "./components/OperationsDashboard";`
  );
}

if (!code.includes('currentUser.role === "Operations"')) {
  code = code.replace(
    `        {currentUser.role === "Team Leader" && (`,
    `        {currentUser.role === "Operations" && (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 w-full">
            <OperationsDashboard
              currentUser={currentUser}
              users={users}
            />
          </div>
        )}

        {currentUser.role === "Team Leader" && (`
  );
}

fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx updated for Operations");
