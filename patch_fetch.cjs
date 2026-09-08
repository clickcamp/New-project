const fs = require('fs');

function patchFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  // Replace `const data = await resp.json();`
  // with safe parsing
  code = code.replace(/const data = await resp\.json\(\);/g, `const contentType = resp.headers.get("content-type");
      let data;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await resp.json();
      } else {
        const text = await resp.text();
        throw new Error(\`Server error: \${text.substring(0, 50)}\`);
      }`);
  fs.writeFileSync(file, code);
}

patchFile('src/components/LoginPortal.tsx');
patchFile('src/components/SecurityAdminPanel.tsx');
console.log('patched');
