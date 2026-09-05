const fs = require('fs');
let code = fs.readFileSync('src/components/TeamLeaderDashboard.tsx', 'utf8');

if (!code.includes('jsPDF')) {
  code = code.replace(
    `import { cn, formatIST } from "../utils";`,
    `import { cn, formatIST } from "../utils";\nimport jsPDF from "jspdf";\nimport autoTable from "jspdf-autotable";\nimport { startOfWeek, endOfWeek, isWithinInterval, format, subWeeks, addWeeks } from "date-fns";`
  );
  code = code.replace(
    `FileText\n} from "lucide-react";`,
    `FileText,\n  Download,\n  ChevronLeft,\n  ChevronRight\n} from "lucide-react";`
  );
}

if (!code.includes('selectedDate')) {
  code = code.replace(
    `  const [nudgeLoading, setNudgeLoading] = useState<string | null>(null);`,
    `  const [nudgeLoading, setNudgeLoading] = useState<string | null>(null);\n  const [selectedDate, setSelectedDate] = useState(new Date());`
  );
}

if (!code.includes('generatePDFReport')) {
  const func = `
  const generatePDFReport = () => {
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);
    
    const weekAccounts = clientAccounts.filter(a => {
      if (!a.submittedAt) return false;
      const d = new Date(a.submittedAt);
      return isWithinInterval(d, { start, end });
    });

    const weekVerified = weekAccounts.filter(a => a.status === "Verified");
    const conversionRate = weekAccounts.length ? ((weekVerified.length / weekAccounts.length) * 100).toFixed(1) + "%" : "0%";

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Team Performance Report", 14, 15);
    doc.setFontSize(11);
    doc.text(\`Week: \${format(start, 'MMM d, yyyy')} - \${format(end, 'MMM d, yyyy')}\`, 14, 23);
    
    doc.text(\`Total Accounts Submitted: \${weekAccounts.length}\`, 14, 33);
    doc.text(\`Verified Accounts: \${weekVerified.length}\`, 14, 40);
    doc.text(\`Conversion Rate: \${conversionRate}\`, 14, 47);

    const tableData = teamMembers.map(member => {
      const memberAccounts = weekAccounts.filter(a => a.submittedBy === member.id);
      const mVerified = memberAccounts.filter(a => a.status === "Verified").length;
      const mConv = memberAccounts.length ? ((mVerified / memberAccounts.length) * 100).toFixed(1) + "%" : "0%";
      return [
        \`\${member.firstName} \${member.lastName}\`,
        memberAccounts.length.toString(),
        mVerified.toString(),
        mConv
      ];
    });

    autoTable(doc, {
      startY: 55,
      head: [['Team Member', 'Total Submitted', 'Verified', 'Conversion Rate']],
      body: tableData,
    });

    doc.save(\`Team_Report_\${format(start, 'yyyy-MM-dd')}.pdf\`);
  };
`;
  code = code.replace(
    `  // Determine today's logs for attendance`,
    func + `\n  // Determine today's logs for attendance`
  );
}

if (!code.includes('generatePDFReport()')) {
  const ui = `
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <div className="flex items-center bg-[#111116] rounded-xl border border-white/10 p-1">
            <button onClick={() => setSelectedDate(subWeeks(selectedDate, 1))} className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-sm font-medium text-white whitespace-nowrap">
              {format(startOfWeek(selectedDate), 'MMM d')} - {format(endOfWeek(selectedDate), 'MMM d')}
            </div>
            <button onClick={() => setSelectedDate(addWeeks(selectedDate, 1))} className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={generatePDFReport}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-amber-500/50 shadow-lg"
          >
            <Download className="w-4 h-4" />
            PDF Report
          </button>
        </div>
`;
  code = code.replace(
    `          <p className="text-gray-400 mt-1">Monitor team performance, floor coverage, and pipeline metrics.</p>
        </div>
      </div>`,
    `          <p className="text-gray-400 mt-1">Monitor team performance, floor coverage, and pipeline metrics.</p>
        </div>${ui}
      </div>`
  );
}

fs.writeFileSync('src/components/TeamLeaderDashboard.tsx', code);
console.log("TeamLeaderDashboard.tsx updated with PDF export!");
