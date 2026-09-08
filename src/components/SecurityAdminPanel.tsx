import React, { useState } from 'react';
import { User } from '../types';
import { ShieldAlert, ShieldCheck, Key, QrCode, X, Check } from 'lucide-react';
import QRCode from 'react-qr-code';

interface SecurityAdminPanelProps {
  users: User[];
}

export function SecurityAdminPanel({ users }: SecurityAdminPanelProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<{ userId: string; url: string; secret: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleEnable2FA = async (userId: string) => {
    setLoadingId(userId);
    setError(null);
    setSuccessMsg(null);
    try {
      const resp = await fetch('/api/admin/2fa-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to setup 2FA');
      
      setQrCodeData({ userId, url: data.qrCodeData, secret: data.secret });
      setSuccessMsg('2FA Secret generated successfully. Please share this QR code or secret with the user.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleView2FA = (user: User) => {
    if (!user['2fa_secret']) {
      setError(`User ${user.firstName} has 2FA enabled but no secret is stored.`);
      return;
    }
    const userEmail = user.email || 'user@clickcamp.site';
    const secret = user['2fa_secret'];
    const url = `otpauth://totp/ClickCamp:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=ClickCamp`;
    setQrCodeData({ userId: user.id, url, secret });
    setSuccessMsg(null);
    setError(null);
  };

  const handleDisable2FA = async (userId: string) => {
    if (!window.confirm("Are you sure you want to disable 2FA for this user?")) return;
    setLoadingId(userId);
    setError(null);
    setSuccessMsg(null);
    try {
      const resp = await fetch('/api/admin/2fa-disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to disable 2FA');
      
      setSuccessMsg('2FA has been disabled for the user.');
      if (qrCodeData?.userId === userId) {
        setQrCodeData(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Security & 2FA Management</h3>
            <p className="text-sm text-gray-500">Manage Two-Factor Authentication for all users</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-3 text-red-700">
          <ShieldAlert className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3 text-emerald-700">
          <Check className="w-5 h-5" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      <div className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-sm text-gray-500">
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">2FA Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="text-sm hover:bg-gray-50/50">
                  <td className="py-4 font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                    <div className="text-xs text-gray-500 font-normal">{user.email}</div>
                  </td>
                  <td className="py-4 text-gray-600">{user.role}</td>
                  <td className="py-4">
                    {user.is_2fa_enabled ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!user.is_2fa_enabled ? (
                        <button
                          onClick={() => handleEnable2FA(user.id)}
                          disabled={loadingId === user.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Key className="w-3.5 h-3.5" />
                          {loadingId === user.id ? 'Generating...' : 'Enable 2FA'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView2FA(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                            title="View QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            View QR
                          </button>
                          <button
                            onClick={() => handleEnable2FA(user.id)}
                            disabled={loadingId === user.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            title="Regenerate Secret"
                          >
                            Regenerate
                          </button>
                          <button
                            onClick={() => handleDisable2FA(user.id)}
                            disabled={loadingId === user.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            {loadingId === user.id ? 'Disabling...' : 'Disable'}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {qrCodeData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 text-center relative">
            <button 
              onClick={() => setQrCodeData(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">2FA Setup QR Code</h3>
              <p className="text-sm text-gray-500 mb-6">Scan this code using an Authenticator app (Google Authenticator, Authy, etc.).</p>
              
              <div className="bg-white p-4 border border-gray-200 rounded-xl inline-block mx-auto mb-6">
                <QRCode value={qrCodeData.url} size={200} />
              </div>
              
              <div className="text-left bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1 font-medium">Or enter setup key manually:</p>
                <code className="text-sm font-mono text-gray-800 break-all select-all">{qrCodeData.secret}</code>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setQrCodeData(null)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
