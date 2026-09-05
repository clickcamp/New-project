const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeDashboard.tsx', 'utf8');

const recoveryUI = `
      {/* Recovery Queue */}
      {accounts.filter(a => a.status === "Rejected").length > 0 && (
        <div className="bg-[#111116] border border-red-500/20 rounded-3xl p-6 sm:p-8 mt-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <AlertCircle className="text-red-500 w-6 h-6" /> Recovery Queue
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.filter(a => a.status === "Rejected").map(a => (
              <div key={a.id} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-white">{a.clientName}</div>
                  <span className="text-[10px] uppercase font-bold px-2 py-1 bg-red-500/20 text-red-400 rounded">Action Required</span>
                </div>
                <div className="text-xs text-gray-400 mb-3">{a.platform} • {formatIST(a.submittedAt, "MMM d")}</div>
                {a.reviewNotes && (
                  <div className="bg-black/50 p-3 rounded-lg border border-red-500/10 text-sm text-gray-300 mb-4">
                    <strong className="text-red-400 block text-xs uppercase mb-1">Ops Note:</strong>
                    {a.reviewNotes}
                  </div>
                )}
                <button 
                  onClick={() => {
                    // Update status back to pending
                    import("firebase/firestore").then(({ doc, updateDoc }) => {
                      import("../lib/firebase").then(({ db }) => {
                        updateDoc(doc(db, "clientAccounts", a.id), { status: "Pending Verification", reviewNotes: "", reviewedBy: null, reviewedByName: null });
                      });
                    });
                  }}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold py-2 rounded-lg transition-colors border border-red-500/30"
                >
                  Mark as Fixed & Resubmit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
`;

code = code.replace(
  `{/* Daily Tasks Module */}`,
  `${recoveryUI}\n\n      {/* Daily Tasks Module */}`
);

fs.writeFileSync('src/components/EmployeeDashboard.tsx', code);
console.log("Recovery queue added to Employee Dashboard");
