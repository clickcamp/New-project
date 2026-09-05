const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeDashboard.tsx', 'utf8');

code = code.replace(
  `                      >
                        {a.status}
                      </span>
                      .
                    </div>
                  </div>`,
  `                      >
                        {a.status}
                      </span>
                      .
                    </div>
                    {a.status === "Rejected" && a.reviewNotes && (
                      <div className="mt-2 text-xs text-red-300 bg-red-500/10 p-2 rounded border border-red-500/20">
                        <strong>Ops Note:</strong> {a.reviewNotes}
                      </div>
                    )}
                  </div>`
);

fs.writeFileSync('src/components/EmployeeDashboard.tsx', code);
console.log("EmployeeDashboard.tsx updated with ops notes");
