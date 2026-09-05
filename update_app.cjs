const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('TeamLeaderDashboard')) {
  code = code.replace(
    `import { AdminDashboard } from "./components/AdminDashboard";`,
    `import { AdminDashboard } from "./components/AdminDashboard";\nimport { TeamLeaderDashboard } from "./components/TeamLeaderDashboard";`
  );
}

if (!code.includes('currentUser.role === "Team Leader"')) {
  code = code.replace(
    `        {currentUser.role === "HR" && (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 w-full">
            <HRDashboard`,
    `        {currentUser.role === "Team Leader" && (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 w-full">
            <TeamLeaderDashboard
              currentUser={currentUser}
              users={users}
            />
          </div>
        )}

        {currentUser.role === "HR" && (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 w-full">
            <HRDashboard`
  );
}

fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx updated.");
