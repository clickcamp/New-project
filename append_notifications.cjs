const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeDashboard.tsx', 'utf8');

const targetStr = `              {leaveRequests.filter((l) => l.status !== "Pending").map((l) => (
                <div
                  key={l.id}
                  className="bg-black/40 border border-white/5 p-4 rounded-xl"
                >
                  <div className="text-xs text-gray-500 mb-1">Leave Update</div>
                  <div className="text-sm text-white">
                    Your leave request for{" "}
                    <span className="font-bold">
                      {format(parseISO(l.startDate), "MMM d")}
                    </span>{" "}
                    was{" "}
                    <span
                      className={
                        l.status === "Approved"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }
                    >
                      {l.status}
                    </span>
                    .
                  </div>
                </div>
              ))}`;

const addAccounts = `
              {accounts.filter((a) => a.status !== "Pending Verification").map((a) => (
                <div key={a.id} className="bg-black/40 border border-white/5 p-4 rounded-xl">
                  <div className="text-xs text-gray-500 mb-1">Account Verification</div>
                  <div className="text-sm text-white">Account <span className="font-bold">{a.clientName}</span> was <span className={a.status === 'Verified' ? 'text-emerald-400' : 'text-red-400'}>{a.status}</span>.</div>
                </div>
              ))}
`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, targetStr + addAccounts);
  fs.writeFileSync('src/components/EmployeeDashboard.tsx', code);
  console.log("Replaced!");
} else {
  console.log("Not found.");
}
