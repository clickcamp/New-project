const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeDashboard.tsx', 'utf8');

if (!code.includes('clientPhone')) {
  code = code.replace(
    `const [platform, setPlatform] = useState("ClickCamp Pro");`,
    `const [platform, setPlatform] = useState("ClickCamp Pro");
  const [clientPhone, setClientPhone] = useState("");
  const [referenceId, setReferenceId] = useState("");`
  );

  code = code.replace(
    `        submittedByName: \`\${currentUser.firstName} \${currentUser.lastName}\`,
        submittedAt: new Date().toISOString(),
      });
      setClientName("");`,
    `        submittedByName: \`\${currentUser.firstName} \${currentUser.lastName}\`,
        submittedAt: new Date().toISOString(),
        clientPhone,
        referenceId,
      });
      setClientName("");
      setClientPhone("");
      setReferenceId("");`
  );

  const newFields = `
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Client Phone
                </label>
                <input
                  required
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm"
                  placeholder="10-digit mobile"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Reference ID
                </label>
                <input
                  required
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm font-mono"
                  placeholder="e.g. U-1928374"
                />
              </div>
`;

  code = code.replace(
    `              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Target Platform`,
    newFields + `              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Target Platform`
  );

  fs.writeFileSync('src/components/EmployeeDashboard.tsx', code);
  console.log("EmployeeDashboard form updated with phone and ref ID");
} else {
  console.log("Already updated");
}
