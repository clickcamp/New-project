const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
code = code.replace(
  '  target?: number;\n}',
  '  target?: number;\n  is_2fa_enabled?: boolean;\n  \'2fa_secret\'?: string;\n}'
);
fs.writeFileSync('src/types.ts', code);
console.log('types.ts updated');
