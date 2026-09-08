const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
`// Login API
app.post("/api/login", (req, res) => {
  const { userId, password } = req.body;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(400).json({ error: "User not found" });
  }

  if (user.password !== password) {
    return res.status(400).json({ error: "Invalid password" });
  }

  res.json(user);
});`, '');
fs.writeFileSync('server.ts', code);
console.log('Removed duplicate login API');
