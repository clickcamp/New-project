const fs = require('fs');
let code = fs.readFileSync('src/components/LoginPortal.tsx', 'utf8');

code = code.replace(
  'const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];',
  `const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];
  const isIframe = window !== window.top;`
);

code = code.replace(
  '<div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">',
  `<div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {isIframe && selectedUser?.role !== 'Admin' && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center text-sm text-blue-400">
            For Face ID / Touch ID, please open this app in a <strong>New Tab</strong> using the ↗ icon at the top right of the preview.
          </div>
        )}`
);

fs.writeFileSync('src/components/LoginPortal.tsx', code);
console.log("LoginPortal.tsx banner patched");
