const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeDashboard.tsx', 'utf8');

const target = `{/* Top Performers (mock) */}
            <div className="shrink-0 w-64 bg-[#111116] border border-white/10 rounded-2xl p-4 snap-start shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <TargetIcon className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Top Performers</h4>
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-[#111116] flex items-center justify-center text-[10px] font-bold"
                  >
                    U{i}
                  </div>
                ))}
              </div>
            </div>`;

const replacement = `{/* Top Performers */}
            <div className="shrink-0 w-64 bg-[#111116] border border-white/10 rounded-2xl p-4 snap-start shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <TargetIcon className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Top Performers</h4>
              </div>
              <div className="flex -space-x-2">
                {topPerformers.length > 0 ? topPerformers.map((tp, idx) => {
                  const user = users.find((u) => u.id === tp.id);
                  const initials = user
                    ? \`\${user.firstName[0]}\${user.lastName[0]}\`
                    : \`U\${idx + 1}\`;
                  return (
                    <div
                      key={tp.id}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 border-2 border-[#111116] flex items-center justify-center text-[10px] font-bold text-white relative z-10 hover:z-20 hover:scale-110 transition-transform"
                      title={user ? \`\${user.firstName} \${user.lastName} - \${tp.count} Accounts\` : \`\${tp.count} Accounts\`}
                    >
                      {initials}
                    </div>
                  );
                }) : (
                  <span className="text-xs text-gray-500">No records</span>
                )}
              </div>
            </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/EmployeeDashboard.tsx', code);
  console.log("UI updated");
} else {
  console.log("UI target not found");
}
