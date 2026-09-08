const fs = require('fs');

// Update server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');

const targetCheck = `    // Password is valid. Now check 2FA.
    if (!userData.totp_secret) {`;

const replacementCheck = `    // Password is valid. Now check 2FA.
    if (userData.role !== 'Admin') {
      return res.json({ verified: true, user: { id: userDoc.id, ...userData } });
    }

    if (!userData.totp_secret) {`;

serverCode = serverCode.replace(targetCheck, replacementCheck);
fs.writeFileSync('server.ts', serverCode);
console.log('server.ts updated for Role-based 2FA');

// Update LoginPortal.tsx
let portalCode = fs.readFileSync('src/components/LoginPortal.tsx', 'utf8');

const targetPortal = `      if (data.setup2FA) {
        setQrCodeData(data.qrCodeData);
        setSetup2FA(true);
      } else if (data.require2FA) {
        setRequire2FA(true);
      }`;

const replacementPortal = `      if (data.verified) {
        onLogin(data.user);
      } else if (data.setup2FA) {
        setQrCodeData(data.qrCodeData);
        setSetup2FA(true);
      } else if (data.require2FA) {
        setRequire2FA(true);
      }`;

portalCode = portalCode.replace(targetPortal, replacementPortal);
fs.writeFileSync('src/components/LoginPortal.tsx', portalCode);
console.log('LoginPortal.tsx updated for Role-based 2FA bypass');
