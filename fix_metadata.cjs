const fs = require('fs');
let meta = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
meta.requestFramePermissions = [
    "publickey-credentials-create",
    "publickey-credentials-get"
];
fs.writeFileSync('metadata.json', JSON.stringify(meta, null, 2));
console.log("metadata.json updated");
