const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'authenticator: {',
  'credential: {'
);
code = code.replace(
  'credentialID: new Uint8Array(Buffer.from(authenticator.credentialID, \'base64url\')),',
  'id: authenticator.credentialID,'
);
code = code.replace(
  'credentialPublicKey: new Uint8Array(Buffer.from(authenticator.credentialPublicKey, \'base64url\')),',
  'publicKey: new Uint8Array(Buffer.from(authenticator.credentialPublicKey, \'base64\')),'
);

fs.writeFileSync('server.ts', code);
console.log('Fixed credential mapping');
