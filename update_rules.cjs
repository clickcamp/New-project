const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

if (!rules.includes('/activityLogs/')) {
  rules = rules.replace(
    'match /{document=**} {',
    'match /activityLogs/{document} {\n      allow read, write: if true;\n    }\n    match /{document=**} {'
  );
  fs.writeFileSync('firestore.rules', rules);
  console.log('firestore.rules updated');
}
