import React, { useEffect, useState, useRef } from "react";
import { User, DMSDocument, DMSAuditLog } from "../types";
import { formatIST } from "../utils";
import { FileText, Download, Upload, X, Search, Filter } from "lucide-react";
import { cn } from "../utils";

export function DMSModule({ currentUser }: { currentUser: User }) {
  const [documents, setDocuments] = useState<DMSDocument[]>([]);
  const [logs, setLogs] = useState<DMSAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let unsubscribeDocs: () => void;
    let unsubscribeLogs: () => void;

    const setupRealtime = async () => {
      setLoading(true);
      try {
        const { collection, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        unsubscribeDocs = onSnapshot(collection(db, "dmsDocuments"), (snapshot) => {
          const dData: any[] = [];
          snapshot.forEach(doc => dData.push({ id: doc.id, ...doc.data() }));
          setDocuments(dData);
        });

        unsubscribeLogs = onSnapshot(collection(db, "dmsAuditLogs"), (snapshot) => {
          const lData: any[] = [];
          snapshot.forEach(doc => lData.push({ id: doc.id, ...doc.data() }));
          setLogs(lData);
          setLoading(false);
        });
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };

    setupRealtime();

    return () => {
      if (unsubscribeDocs) unsubscribeDocs();
      if (unsubscribeLogs) unsubscribeLogs();
    };
  }, []);

  const fetchData = async () => {};

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      const newId = 'DOC-' + Date.now();
      const performer = `${currentUser.firstName} ${currentUser.lastName}`;
      
      await setDoc(doc(db, "dmsDocuments", newId), {
        id: newId,
        title: title || file.name,
        filename: file.name,
        category: category || 'General',
        uploadedBy: performer,
        uploadDate: new Date().toISOString(),
        version: 1,
        path: `/simulated/${file.name}`
      });
      
      const logId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);
      await setDoc(doc(db, "dmsAuditLogs", logId), {
        id: logId,
        action: 'UPLOAD',
        docId: newId,
        performedBy: performer,
        timestamp: new Date().toISOString()
      });
      
      await fetchData();
      setShowUpload(false);
      setFile(null);
      setTitle("");
      setCategory("General");
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      const performer = `${currentUser.firstName} ${currentUser.lastName}`;
      const logId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);
      
      await setDoc(doc(db, "dmsAuditLogs", logId), {
        id: logId,
        action: 'DOWNLOAD',
        docId: docId,
        performedBy: performer,
        timestamp: new Date().toISOString()
      });
      
      alert("Simulated download complete. Audit log recorded in cloud.");
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-teal-600 h-6 w-6" />
            Document Management System (DMS) Tracker
          </h2>
          <p className="text-sm text-gray-500 mt-1">Upload, manage, and track document activity across the workspace.</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)} 
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          <Upload className="h-4 w-4" />
          Upload New Document
        </button>
      </div>

      {/* Document List Table */}
      <div className="overflow-x-auto border border-gray-100 rounded-lg">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 font-semibold">Doc ID</th>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Uploaded By</th>
              <th className="px-4 py-3 font-semibold">Date (IST)</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No documents found. Upload one to get started.
                </td>
              </tr>
            ) : (
              [...documents].reverse().map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-500 text-xs font-mono">{doc.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{doc.title}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      {doc.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">{doc.uploadedBy}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatIST(doc.uploadDate, "Pp")}</td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => handleDownload(doc.id)}
                      className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 px-3 py-1.5 rounded-md font-medium text-xs transition-colors inline-flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />
                      Download & Track
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Activity Audit Logs Section */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          Activity Timeline
        </h3>
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
            {logs.length === 0 ? (
              <p className="text-gray-500 italic pl-6 text-sm">System ready. Awaiting activity...</p>
            ) : (
              [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log) => {
                const isUpload = log.action === 'UPLOAD';
                const doc = documents.find(d => d.id === log.docId);
                const docName = doc ? doc.title : log.docId;

                return (
                  <div key={log.id || log.timestamp} className="relative pl-8 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className={cn(
                      "absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm",
                      isUpload ? "bg-teal-50" : "bg-blue-50"
                    )}>
                      {isUpload ? (
                        <Upload className="h-4 w-4 text-teal-600" />
                      ) : (
                        <Download className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">{log.performedBy}</span>
                        {' '}
                        <span className="text-gray-500">{isUpload ? "uploaded a new document" : "downloaded document"}</span>
                        {' '}
                        <span className="font-medium text-gray-900">"{docName}"</span>
                      </p>
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full w-fit">
                        {formatIST(log.timestamp, "Pp")}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Upload New Document</h3>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document File</label>
                <input 
                  required 
                  type="file" 
                  ref={fileInputRef}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Title (Optional)</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                  placeholder="Leave empty to use filename"
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="HR">HR</option>
                  <option value="Tech">Tech</option>
                  <option value="Legal">Legal</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowUpload(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={uploading || !file} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
