const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationCenter.tsx', 'utf8');

code = code.replace(
  `import { User } from "../types";`,
  `import { User } from "../types";\nimport { collection, query, where, onSnapshot } from "firebase/firestore";\nimport { db } from "../lib/firebase";`
);

code = code.replace(
  `  const [isOpen, setIsOpen] = useState(false);`,
  `  const [isOpen, setIsOpen] = useState(false);\n  const [appNotifications, setAppNotifications] = useState<any[]>([]);`
);

code = code.replace(
  `  // Close dropdown on click outside`,
  `  useEffect(() => {
    if (!currentUser.id) return;
    const q = query(collection(db, "appNotifications"), where("userId", "==", currentUser.id));
    const unsub = onSnapshot(q, (snapshot) => {
      const notifs: any[] = [];
      snapshot.forEach(doc => notifs.push({ id: doc.id, ...doc.data() }));
      setAppNotifications(notifs);
    });
    return () => unsub();
  }, [currentUser.id]);

  // Close dropdown on click outside`
);

code = code.replace(
  `  const notifications = [`,
  `  const mappedAppNotifs = appNotifications.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    icon: n.type === 'reminder' ? AlertCircle : Info,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    createdAt: n.createdAt
  })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const notifications = [
    ...mappedAppNotifs,`
);

fs.writeFileSync('src/components/NotificationCenter.tsx', code);
console.log("NotificationCenter updated.");
