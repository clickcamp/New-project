const fs = require('fs');
let code = fs.readFileSync('src/components/EmployeeDashboard.tsx', 'utf8');
const target = `const [regRequests, setRegRequests] = useState<RegularizationRequest[]>([]);`;
const replace = `const [regRequests, setRegRequests] = useState<RegularizationRequest[]>([]);
  const [topPerformers, setTopPerformers] = useState<{id: string; count: number}[]>([]);`;
if (code.includes(target)) {
  code = code.replace(target, replace);
  fs.writeFileSync('src/components/EmployeeDashboard.tsx', code);
  console.log("State injected");
} else {
  console.log("State target not found");
}
