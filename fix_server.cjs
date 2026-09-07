const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const rpID = 'localhost'; // In production, this should be the domain",
  `const getRpID = (req) => req.hostname;`
);

code = code.replace(
  /rpID,/g,
  "rpID: getRpID(req),"
);

code = code.replace(
  /expectedRPID: rpID,/g,
  "expectedRPID: getRpID(req),"
);

code = code.replace(
  "const expectedOrigin = [",
  "const getExpectedOrigin = (req) => `${req.protocol}://${req.get('host')}`;\nconst expectedOrigin = ["
);

code = code.replace(
  /expectedOrigin,/g,
  "expectedOrigin: getExpectedOrigin(req),"
);

fs.writeFileSync('server.ts', code);
console.log("server.ts dynamically configured rpID");
