const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'const options = generateRegistrationOptions({',
  'const options = await generateRegistrationOptions({'
);
code = code.replace(
  /app.post\('\/api\/webauthn\/generate-registration-options', \(req, res\) => {/g,
  "app.post('/api/webauthn/generate-registration-options', async (req, res) => {"
);

code = code.replace(
  'const options = generateAuthenticationOptions({',
  'const options = await generateAuthenticationOptions({'
);
code = code.replace(
  /app.post\('\/api\/webauthn\/generate-authentication-options', \(req, res\) => {/g,
  "app.post('/api/webauthn/generate-authentication-options', async (req, res) => {"
);

fs.writeFileSync('server.ts', code);
console.log('Fixed awaits');
