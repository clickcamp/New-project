const fs = require('fs');
let code = fs.readFileSync('src/components/SystemTrackingModule.tsx', 'utf8');

if (!code.includes('Resource Utilization')) {
  code = code.replace(
    'import { ShieldCheck, Clock, Activity, Server, AlertTriangle, Users, Search, CheckCircle } from "lucide-react";',
    'import { ShieldCheck, Clock, Activity, Server, AlertTriangle, Users, Search, CheckCircle, BarChart2 } from "lucide-react";\nimport { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";'
  );

  const newChart = `
        {/* Resource Utilization (Workload) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col mt-6 lg:mt-0 lg:col-span-1">
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              Resource Utilization
            </h3>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-4 text-center">Active Workload per Department</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: "Sales", activeTasks: 42 },
                  { name: "HR", activeTasks: 18 },
                  { name: "Operations", activeTasks: 65 },
                  { name: "Support", activeTasks: 24 }
                ]}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                  <Bar dataKey="activeTasks" radius={[4, 4, 0, 0]}>
                    {
                      [
                        { name: "Sales", activeTasks: 42 },
                        { name: "HR", activeTasks: 18 },
                        { name: "Operations", activeTasks: 65 },
                        { name: "Support", activeTasks: 24 }
                      ].map((entry, index) => (
                        <Cell key={\`cell-\${index}\`} fill={entry.activeTasks > 50 ? "#ef4444" : "#6366f1"} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">Red indicates high utilization (> 50 active items)</p>
          </div>
        </div>
`;

  // We have:
  // 1. Comprehensive Audit Logs (lg:col-span-2)
  // 2. Server / API Status (lg:col-span-1)
  // Let's add Resource Utilization to the grid or below.
  // Actually, Server/API Status could be moved into another grid row.
  
  // Let's rewrite the grid to fit it nicely.
  code = code.replace(
    '<!-- END OF GRID -->', // wait, I don't have this.
    ''
  );
  
  // Instead of replacing blindly, let's just re-write the file entirely since it's small.
}
