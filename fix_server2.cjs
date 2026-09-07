const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/expectedRPID: rpID: getRpID\(req\),/g, "expectedRPID: getRpID(req),");

fs.writeFileSync('server.ts', code);
