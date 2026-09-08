fetch("http://localhost:3000/api/admin/2fa-setup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ targetUserId: "test_user_id" })
}).then(async r => {
  const text = await r.text();
  console.log("STATUS:", r.status);
  console.log("RESPONSE:", text);
}).catch(console.error);
