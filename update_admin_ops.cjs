const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  `useState<"All" | "Employee" | "HR" | "Team Leader" | "Pending">("All");`,
  `useState<"All" | "Employee" | "HR" | "Team Leader" | "Operations" | "Pending">("All");`
);

code = code.replace(
  `const hrCount = users.filter(u => u.role === "HR").length;`,
  `const hrCount = users.filter(u => u.role === "HR").length;\n  const opsCount = users.filter(u => u.role === "Operations").length;`
);

code = code.replace(
  `if (roleFilter === "HR" && user.role !== "HR") return false;`,
  `if (roleFilter === "HR" && user.role !== "HR") return false;\n    if (roleFilter === "Operations" && user.role !== "Operations") return false;`
);

code = code.replace(
  `TLs ({tlCount})
              </button>`,
  `TLs ({tlCount})
              </button>
              <button
                onClick={() => setRoleFilter("Operations")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors",
                  roleFilter === "Operations" ? "bg-white text-emerald-700 shadow-sm font-semibold" : "text-gray-600 hover:text-gray-900"
                )}
              >
                Ops ({opsCount})
              </button>`
);

code = code.replace(
  `                            : user.role === "Team Leader"
                            ? "bg-amber-100 text-amber-800"`,
  `                            : user.role === "Team Leader"
                            ? "bg-amber-100 text-amber-800"
                            : user.role === "Operations"
                            ? "bg-emerald-100 text-emerald-800"`
);

code = code.replace(
  `                  <button
                    type="button"
                    onClick={() => setNewEmp({ ...newEmp, role: "HR", department: "Human Resources" })}`,
  `                  <button
                    type="button"
                    onClick={() => setNewEmp({ ...newEmp, role: "Operations", department: "Verification" })}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      newEmp.role === "Operations"
                        ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    )}
                  >
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-emerald-600" />
                      Operations
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">QA & Verification</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEmp({ ...newEmp, role: "HR", department: "Human Resources" })}`
);

code = code.replace(
  `grid-cols-3 gap-2.5`,
  `grid-cols-4 gap-2.5`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("AdminDashboard.tsx updated for Operations");
