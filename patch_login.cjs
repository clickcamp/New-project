const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPortal.tsx', 'utf8');

// Remove setup2FA state and qrCodeData
code = code.replace(/const \[setup2FA, setSetup2FA\] = useState\(false\);\n/, '');
code = code.replace(/const \[qrCodeData, setQrCodeData\] = useState\(""\);\n/, '');

// In handleLoginSubmit, remove setup2FA logic
const oldSubmit = `      if (data.verified) {
        onLogin(data.user);
      } else if (data.setup2FA) {
        setQrCodeData(data.qrCodeData);
        setSetup2FA(true);
      } else if (data.require2FA) {
        setRequire2FA(true);
      }`;

const newSubmit = `      if (data.verified) {
        onLogin(data.user);
      } else if (data.require2FA) {
        setRequire2FA(true);
      }`;
code = code.replace(oldSubmit, newSubmit);

// In JSX, remove setup2FA check and block
const jsxSearch = `          {!require2FA && !setup2FA ? (`;
const jsxReplace = `          {!require2FA ? (`;
code = code.replace(jsxSearch, jsxReplace);

const oldSetupBlockRegex = /          \) : setup2FA \? \([\s\S]*?          \) : \(/;
code = code.replace(oldSetupBlockRegex, "          ) : (");

// Remove QRCode import
code = code.replace("import QRCode from 'react-qr-code';\n", "");

fs.writeFileSync('src/components/LoginPortal.tsx', code);
console.log('LoginPortal.tsx updated.');
