const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('WebAuthnCredential')) {
  code += `\nexport interface WebAuthnCredential {
  id: string; // credential_id
  userId: string;
  publicKey: string; // base64 or Uint8Array
  counter: number;
  transports?: string[];
}\n`;
  fs.writeFileSync('src/types.ts', code);
  console.log("types.ts updated");
}
