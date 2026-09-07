const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// I will extract webAuthn code, and put it after app.use(express.json())
const startIdx = code.indexOf(`import { generateRegistrationOptions`);
const endIdx = code.indexOf(`const app = express();`);
if (startIdx !== -1 && endIdx !== -1) {
   const extracted = code.substring(startIdx, endIdx);
   code = code.substring(0, startIdx) + code.substring(endIdx);
   // now append extracted right after app.use(express.json());
   code = code.replace('app.use(express.json());', 'app.use(express.json());\n' + extracted);
}

fs.writeFileSync('server.ts', code);
console.log('Fixed app declaration order');
