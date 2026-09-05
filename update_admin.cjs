const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Update filters to include Team Leader
code = code.replace(
  `const [roleFilter, setRoleFilter] = useState<"All" | "Employee" | "HR" | "Pending">("All");`,
  `const [roleFilter, setRoleFilter] = useState<"All" | "Employee" | "HR" | "Team Leader" | "Pending">("All");`
);

code = code.replace(
  `const employeeCount = users.filter(u => u.role === "Employee").length;`,
  `const employeeCount = users.filter(u => u.role === "Employee").length;\n  const tlCount = users.filter(u => u.role === "Team Leader").length;`
);

code = code.replace(
  `if (roleFilter === "Employee" && user.role !== "Employee") return false;`,
  `if (roleFilter === "Employee" && user.role !== "Employee") return false;\n    if (roleFilter === "Team Leader" && user.role !== "Team Leader") return false;`
);

// Add Team Leader stats
code = code.replace(
  `        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{hrCount}</p>
            <p className="text-xs text-gray-500 font-medium">HR Personnel</p>
          </div>
        </div>`,
  `        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{hrCount}</p>
            <p className="text-xs text-gray-500 font-medium">HR Personnel</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{tlCount}</p>
            <p className="text-xs text-gray-500 font-medium">Team Leaders</p>
          </div>
        </div>`
);

// Add Add Team Leader button
code = code.replace(
  `            <Plus className="h-4 w-4" />
            Add Employee
          </button>`,
  `            <Plus className="h-4 w-4" />
            Add Employee
          </button>
          <button 
            onClick={() => {
              setNewEmp({ firstName: "", lastName: "", role: "Team Leader", department: "Sales", autoApprove: true, password: "" });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors shadow-sm text-sm"
          >
            <Plus className="h-4 w-4" />
            Add TL
          </button>`
);

// Add Team Leader filter
code = code.replace(
  `              <button
                onClick={() => setRoleFilter("HR")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors",
                  roleFilter === "HR" ? "bg-white text-purple-700 shadow-sm font-semibold" : "text-gray-600 hover:text-gray-900"
                )}
              >
                HR ({hrCount})
              </button>`,
  `              <button
                onClick={() => setRoleFilter("HR")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors",
                  roleFilter === "HR" ? "bg-white text-purple-700 shadow-sm font-semibold" : "text-gray-600 hover:text-gray-900"
                )}
              >
                HR ({hrCount})
              </button>
              <button
                onClick={() => setRoleFilter("Team Leader")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors",
                  roleFilter === "Team Leader" ? "bg-white text-amber-700 shadow-sm font-semibold" : "text-gray-600 hover:text-gray-900"
                )}
              >
                TLs ({tlCount})
              </button>`
);

// Table role pill
code = code.replace(
  `                          user.role === "HR"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "Admin"
                            ? "bg-slate-100 text-slate-800"
                            : "bg-blue-100 text-blue-800"`,
  `                          user.role === "HR"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "Team Leader"
                            ? "bg-amber-100 text-amber-800"
                            : user.role === "Admin"
                            ? "bg-slate-100 text-slate-800"
                            : "bg-blue-100 text-blue-800"`
);

// Update Modal Form to include Team Leader option
code = code.replace(
  `                  <button
                    type="button"
                    onClick={() => setNewEmp({ ...newEmp, role: "HR", department: "Human Resources" })}`,
  `                  <button
                    type="button"
                    onClick={() => setNewEmp({ ...newEmp, role: "Team Leader", department: "Sales" })}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      newEmp.role === "Team Leader"
                        ? "border-amber-600 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/20"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    )}
                  >
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-amber-600" />
                      Team Leader
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">Manage teams & targets</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEmp({ ...newEmp, role: "HR", department: "Human Resources" })}`
);

// Add TL assignment handler
code = code.replace(
  `  const handleApprove = async (id: string) => {`,
  `  const handleAssignTL = async (userId: string, tlId: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await updateDoc(doc(db, "users", userId), { teamLeaderId: tlId });
      await fetchData();
      refreshUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (id: string) => {`
);

// Add Team Leader selection in the table
code = code.replace(
  `<td className="px-6 py-4 text-gray-700 font-medium">
                        {user.department || "General"}
                      </td>`,
  `<td className="px-6 py-4 text-gray-700 font-medium">
                        {user.department || "General"}
                        {user.role === "Employee" && (
                          <div className="mt-1">
                            <select
                              className="text-xs border border-gray-200 rounded p-1"
                              value={user.teamLeaderId || ""}
                              onChange={(e) => handleAssignTL(user.id, e.target.value)}
                            >
                              <option value="">No TL Assigned</option>
                              {users.filter(u => u.role === "Team Leader").map(tl => (
                                <option key={tl.id} value={tl.id}>{tl.firstName} {tl.lastName}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>`
);

code = code.replace(
  `grid-cols-2 gap-2.5`,
  `grid-cols-3 gap-2.5`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
console.log("AdminDashboard updated.");
