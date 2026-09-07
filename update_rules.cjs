const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

if (!rules.includes('/webAuthnCredentials/')) {
  rules = rules.replace(
    'match /{document=**} {',
    'match /webAuthnCredentials/{document} {\n      allow read, write: if true;\n    }\n    match /{document=**} {'
  );
  fs.writeFileSync('firestore.rules', rules);
  console.log('firestore.rules updated');
}
