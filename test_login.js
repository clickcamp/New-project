fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId: "test", password: "pwd" })
}).then(async r => {
  const text = await r.text();
  console.log("STATUS:", r.status);
  console.log("RESPONSE:", text);
}).catch(console.error);
