const fs = require('fs');
let code = fs.readFileSync('src/components/SystemTrackingModule.tsx', 'utf8');

code = code.replace(
  "Red indicates high utilization (> 50 active items)",
  "Red indicates high utilization (&gt; 50 active items)"
);

fs.writeFileSync('src/components/SystemTrackingModule.tsx', code);
