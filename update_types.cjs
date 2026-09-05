const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('"Team Leader"')) {
  code = code.replace(
    `export type Role = 'Admin' | 'HR' | 'Employee';`,
    `export type Role = 'Admin' | 'HR' | 'Employee' | 'Team Leader';`
  );
}

if (!code.includes('teamLeaderId?')) {
  code = code.replace(
    `  status: Status;`,
    `  status: Status;\n  teamLeaderId?: string;`
  );
}

fs.writeFileSync('src/types.ts', code);
console.log("types.ts updated");
