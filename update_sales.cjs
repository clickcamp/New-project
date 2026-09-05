const fs = require('fs');
const content = fs.readFileSync('src/components/SalesMetricsModule.tsx', 'utf-8');

const replacement = `
  const verifiedCount = currentMonthAccounts.length;
  const estimatedEarnings = verifiedCount * BONUS_PER_ACCOUNT;
  
  // Gamification Badges
  const badges = [];
  if (verifiedCount >= 1) badges.push({ name: "First Blood", icon: "🔥", color: "bg-red-100 text-red-800 border-red-200" });
  if (verifiedCount >= 5) badges.push({ name: "Fast Starter", icon: "🚀", color: "bg-blue-100 text-blue-800 border-blue-200" });
  if (verifiedCount >= 10) badges.push({ name: "Century Club", icon: "⭐", color: "bg-amber-100 text-amber-800 border-amber-200" });
  if (verifiedCount >= 20) badges.push({ name: "Rainmaker", icon: "💎", color: "bg-purple-100 text-purple-800 border-purple-200" });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-emerald-50 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-emerald-600" />
          {targetUserId ? 'Employee Earnings' : 'Your Earnings'} (This Month)
        </h3>
      </div>
      <div className="p-6 grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Verified Accounts</span>
          <div className="text-3xl font-black text-gray-900 tabular-nums flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-500" /> {verifiedCount}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Est. Commission</span>
          <div className="text-3xl font-black text-emerald-600 tabular-nums">
            ₹{estimatedEarnings.toLocaleString()}
          </div>
        </div>
      </div>
      
      {badges.length > 0 && (
        <div className="px-6 pb-6 pt-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Earned Badges</p>
          <div className="flex flex-wrap gap-2">
            {badges.map(b => (
              <div key={b.name} className={\`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 shadow-sm \${b.color}\`}>
                <span>{b.icon}</span> {b.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
`;

const updatedContent = content.replace(/  const verifiedCount = currentMonthAccounts\.length;[\s\S]*?}\);\s*}/, replacement);
fs.writeFileSync('src/components/SalesMetricsModule.tsx', updatedContent);
