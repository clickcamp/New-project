const fs = require('fs');
let code = fs.readFileSync('src/components/SecurityAdminPanel.tsx', 'utf8');

const handleView2FA = `  const handleView2FA = (user: User) => {
    if (!user['2fa_secret']) {
      setError(\`User \${user.firstName} has 2FA enabled but no secret is stored.\`);
      return;
    }
    const userEmail = user.email || 'user@clickcamp.site';
    const secret = user['2fa_secret'];
    const url = \`otpauth://totp/ClickCamp:\${encodeURIComponent(userEmail)}?secret=\${secret}&issuer=ClickCamp\`;
    setQrCodeData({ userId: user.id, url, secret });
    setSuccessMsg(null);
    setError(null);
  };

  const handleDisable2FA`;

code = code.replace("  const handleDisable2FA", handleView2FA);

const oldButtons = `                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEnable2FA(user.id)}
                            disabled={loadingId === user.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            title="Regenerate Secret"
                          >
                            <QrCode className="w-3.5 h-3.5" />
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
                        </div>`;

const newButtons = `                        <div className="flex items-center gap-2">
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
                        </div>`;

code = code.replace(oldButtons, newButtons);

fs.writeFileSync('src/components/SecurityAdminPanel.tsx', code);
console.log('SecurityAdminPanel.tsx updated.');
