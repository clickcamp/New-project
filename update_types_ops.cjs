const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes("'Operations'")) {
  code = code.replace(
    /export type Role = (.*?);/,
    (match, p1) => `export type Role = ${p1} | 'Operations';`
  );
}

if (!code.includes('lockedBy?')) {
  code = code.replace(
    /submittedAt: string;/,
    `submittedAt: string;
  referenceId?: string;
  clientPhone?: string;
  lockedBy?: string;
  lockedByName?: string;
  lockedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewNotes?: string;
  verifiedAt?: string;`
  );
}

fs.writeFileSync('src/types.ts', code);
console.log("types.ts updated for Operations");
