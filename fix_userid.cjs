const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'userID: userId,',
  'userID: new Uint8Array(Buffer.from(userId, "utf-8")),'
);

fs.writeFileSync('server.ts', code);
console.log('Fixed userID type');
