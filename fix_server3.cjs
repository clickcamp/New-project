const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/rpID: rpID: getRpID\(req\),/g, "rpID: getRpID(req),");
fs.writeFileSync('server.ts', code);
