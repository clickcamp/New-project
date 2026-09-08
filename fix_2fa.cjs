const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  "const otpauthUrl = authenticator.generateURI({ issuer: 'ClickCamp', label: userEmail, secret });",
  "const otpauthUrl = authenticator.generateURI({ issuer: 'ClickCamp', account: userEmail, secret });"
);
fs.writeFileSync('server.ts', code);
console.log('Fixed 2FA generateURI');
