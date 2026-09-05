import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');
const renderIndex = lines.findIndex(l => l.includes("4. Render the Workspace App"));

if (renderIndex !== -1) {
  const newContent = lines.slice(0, renderIndex).join('\n') + `
  // 4. Render the Workspace App (default fallback for 'workspace' or others mapped to it)
  if (currentUser.role === "Employee") {
    return (
      <EmployeeDashboard 
        currentUser={currentUser} 
        users={users} 
        onBack={() => setActiveApp(null)} 
        onLogout={() => setCurrentUser(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 animate-in fade-in overflow-x-hidden flex flex-col w-full">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm w-full">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveApp(null)} 
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src="/logo.svg" alt="Click.camp Logo" className="h-8 w-auto object-contain" />
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationCenter currentUser={currentUser} users={users} />
          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
          
          <div className="flex items-center gap-3 mr-2">
             <span className="text-sm font-medium text-gray-700 hidden sm:block">{currentUser.firstName} {currentUser.lastName} ({currentUser.role})</span>
          </div>
          <button
            onClick={() => setCurrentUser(null)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 overflow-x-hidden">
        {currentUser.role === "Admin" && (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 w-full">
            <AdminDashboard currentUser={currentUser} refreshUsers={fetchUsers} />
            <DMSModule currentUser={currentUser} />
          </div>
        )}

        {currentUser.role === "HR" && (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 w-full">
            <HRDashboard currentUser={currentUser} users={users} refreshUsers={fetchUsers} />
            <DMSModule currentUser={currentUser} />
          </div>
        )}
      </main>
    </div>
  );
}
`;
  fs.writeFileSync('src/App.tsx', newContent);
  console.log("Replaced");
} else {
  console.log("Not found");
}
