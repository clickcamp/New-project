import React, { useState } from "react";
import { User } from "../types";
import { ArrowLeft, User as UserIcon, Lock, Bell, Settings } from "lucide-react";

export function SettingsApp({ currentUser, onBack }: { currentUser: User, onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-in fade-in">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-gray-600 text-white p-2 rounded-lg">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
        <img src="/logo.svg" alt="Click.camp Logo" className="h-8 w-auto object-contain hidden sm:block" />
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto overflow-hidden mt-6 px-4 md:px-6 gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-white shadow-sm border border-gray-200 text-gray-900 font-medium' : 'text-gray-600 hover:bg-white hover:shadow-sm hover:border-gray-200 border border-transparent'}`}>
            <UserIcon className="w-5 h-5" /> Profile Settings
          </button>
          <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors ${activeTab === 'security' ? 'bg-white shadow-sm border border-gray-200 text-gray-900 font-medium' : 'text-gray-600 hover:bg-white hover:shadow-sm hover:border-gray-200 border border-transparent'}`}>
            <Lock className="w-5 h-5" /> Security & Password
          </button>
          <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors ${activeTab === 'notifications' ? 'bg-white shadow-sm border border-gray-200 text-gray-900 font-medium' : 'text-gray-600 hover:bg-white hover:shadow-sm hover:border-gray-200 border border-transparent'}`}>
            <Bell className="w-5 h-5" /> Notifications
          </button>
          {currentUser.role === 'Admin' && (
            <button onClick={() => setActiveTab('system')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-colors ${activeTab === 'system' ? 'bg-white shadow-sm border border-gray-200 text-gray-900 font-medium' : 'text-gray-600 hover:bg-white hover:shadow-sm hover:border-gray-200 border border-transparent'}`}>
              <Settings className="w-5 h-5" /> System Rules
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-8">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" disabled value={currentUser.firstName} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" disabled value={currentUser.lastName} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" disabled value={currentUser.email || ''} className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-500" />
                </div>
              </div>
              <p className="text-sm text-gray-500 italic">Please contact HR to update core profile details.</p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Change Password</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input type="password" placeholder="••••••••" className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors">
                  Update Password
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Notification Preferences</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-medium text-gray-700">Email notifications for messages</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-medium text-gray-700">Daily attendance reminders</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-medium text-gray-700">Company announcements</span>
                </label>
              </div>
            </div>
          )}
          
          {activeTab === 'system' && currentUser.role === 'Admin' && (
             <div className="space-y-6">
             <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">System Wide Settings (Admin Only)</h2>
             <div className="space-y-4">
               <label className="flex items-center gap-3">
                 <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                 <span className="text-sm font-medium text-gray-700">Allow HR to create accounts directly</span>
               </label>
               <label className="flex items-center gap-3">
                 <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                 <span className="text-sm font-medium text-gray-700">Require complex passwords</span>
               </label>
             </div>
           </div>
          )}
        </div>
      </div>
    </div>
  );
}
