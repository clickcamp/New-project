const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeDashboard.tsx', 'utf8');

const targetButtons = `{status !== "Rejected" && (
                              <button
                                onClick={() =>
                                  updateLeadStatus(lead.id, "Rejected")
                                }
                                className="flex-1 text-xs font-bold text-red-400 bg-red-500/10 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
                              >
                                Issue
                              </button>
                            )}`;

const replacementButtons = `{status !== "Rejected" && status !== "Account Active" && (
                              <button
                                onClick={() =>
                                  updateLeadStatus(lead.id, "Rejected")
                                }
                                className="flex-1 text-xs font-bold text-red-400 bg-red-500/10 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
                              >
                                Issue
                              </button>
                            )}
                            {status === "Rejected" && (
                              <button
                                onClick={() =>
                                  updateLeadStatus(lead.id, "Documents Submitted")
                                }
                                className="flex-1 text-xs font-bold text-yellow-400 bg-yellow-500/10 py-2 rounded-lg hover:bg-yellow-500/20 transition-colors"
                              >
                                Fix KYC
                              </button>
                            )}`;

if (code.includes(targetButtons)) {
  code = code.replace(targetButtons, replacementButtons);
  fs.writeFileSync('src/components/EmployeeDashboard.tsx', code);
  console.log("Updated Fix KYC");
} else {
  console.log("Not found Fix KYC");
}
