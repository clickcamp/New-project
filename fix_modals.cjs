const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeDashboard.tsx', 'utf8');

const targetStr = `{/* Global hide scrollbar styles */}`;

const modalsCode = `
      {/* Bottom Sheet Modals */}
      {showLogAccount && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
          <div className="bg-[#111116] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white">Log New Account</h3>
              <button
                onClick={() => setShowLogAccount(false)}
                className="text-gray-400 hover:text-white bg-white/5 rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLogAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Client Name
                </label>
                <input
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Platform / Product
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm appearance-none"
                >
                  <option>ClickCamp Pro</option>
                  <option>ClickCamp Enterprise</option>
                  <option>Custom API Integration</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-4 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50"
              >
                Submit for Verification
              </button>
            </form>
          </div>
        </div>
      )}

      {showAddLead && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
          <div className="bg-[#111116] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white">Add New Lead</h3>
              <button
                onClick={() => setShowAddLead(false)}
                className="text-gray-400 hover:text-white bg-white/5 rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddLead} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Lead Name
                </label>
                <input
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="e.g. John Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Company Name
                </label>
                <input
                  required
                  value={leadCompany}
                  onChange={(e) => setLeadCompany(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="e.g. Globex Inc"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-4 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                Save Lead
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global hide scrollbar styles */}`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, modalsCode);
  fs.writeFileSync('src/components/EmployeeDashboard.tsx', code);
  console.log("Injected Modals successfully!");
} else {
  console.log("Target string not found!");
}
