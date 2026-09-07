const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPortal.tsx', 'utf8');

code = code.replace(
  'setError(err.message || "Failed to register Face ID");',
  `if (err.message && err.message.includes("is not enabled in this document")) {
        setError("Face ID is blocked inside the preview window. Please click the 'Open in New Tab' icon (↗) in the top right corner of the preview to use biometric login.");
      } else {
        setError(err.message || "Failed to register Face ID");
      }`
);

code = code.replace(
  'setError(err.message || "Failed to login with Face ID");',
  `if (err.message && err.message.includes("is not enabled in this document")) {
        setError("Face ID is blocked inside the preview window. Please click the 'Open in New Tab' icon (↗) in the top right corner of the preview to use biometric login.");
      } else {
        setError(err.message || "Failed to login with Face ID");
      }`
);

fs.writeFileSync('src/components/LoginPortal.tsx', code);
console.log("LoginPortal.tsx patched");
