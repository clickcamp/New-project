const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'import { authenticator } from "otplib";',
  'import { OTP } from "otplib";\nconst authenticator = new OTP();'
);

code = code.replace(
  'authenticator.keyuri(userEmail, \'ClickCamp\', secret)',
  'authenticator.generateURI({ issuer: \'ClickCamp\', label: userEmail, secret })'
);

code = code.replace(
  'const isValid = authenticator.check(token, data.totp_secret);',
  'const result = await authenticator.verify({ token, secret: data.totp_secret });\n    const isValid = result.valid;'
);

fs.writeFileSync('server.ts', code);
console.log('patched server.ts for otplib v13');
