const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

if (!code.includes('SystemTrackingModule')) {
  code = code.replace(
    `import { TicketingModule, ExpensesModule } from "./SupportModule";`,
    `import { TicketingModule, ExpensesModule } from "./SupportModule";\nimport { SystemTrackingModule } from "./SystemTrackingModule";`
  );

  code = code.replace(
    `      </div>

      {showAddModal && (`,
    `      </div>

      {/* System & Professional Tracking */}
      <SystemTrackingModule users={users} currentUser={currentUser} />

      {showAddModal && (`
  );
  
  fs.writeFileSync('src/components/AdminDashboard.tsx', code);
  console.log("AdminDashboard.tsx updated with SystemTrackingModule");
}
