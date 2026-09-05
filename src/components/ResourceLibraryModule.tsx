import React, { useState, useEffect, useRef } from 'react';
import { User, DMSDocument } from '../types';
import { BookOpen, FileText, Upload, Download, X, Eye } from 'lucide-react';
import { formatIST } from '../utils';

export function ResourceLibraryModule({ currentUser }: { currentUser: User }) {
  const [documents, setDocuments] = useState<DMSDocument[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Sales Scripts');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let unsub: () => void;
    const fetchDocs = async () => {
      try {
        const { collection, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        unsub = onSnapshot(collection(db, "documents"), (snap) => {
          const data: any[] = [];
          snap.forEach(d => data.push({ id: d.id, ...d.data() }));
          setDocuments(data.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
          setLoading(false);
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchDocs();
    return () => { if (unsub) unsub(); };
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      const docName = title.trim() || file.name;
      
      await addDoc(collection(db, "documents"), {
        title: docName,
        filename: file.name,
        category,
        uploadedBy: currentUser.id,
        uploadDate: new Date().toISOString(),
        version: 1
      });
      
      setShowUpload(false);
      setFile(null);
      setTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await addDoc(collection(db, "dmsAuditLogs"), {
        action: 'DOWNLOAD',
        docId,
        performedBy: currentUser.id,
        timestamp: new Date().toISOString()
      });
      alert("Document opened in viewer. (Simulation)");
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl"><div className="animate-pulse">Loading Library...</div></div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full min-h-[400px]">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          Resource & Training Library
        </h3>
        {currentUser.role !== 'Employee' && (
          <button 
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Upload className="h-4 w-4" /> Upload Resource
          </button>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.length === 0 ? (
            <div className="col-span-full py-8 text-center text-gray-500 text-sm">
              No training resources available yet.
            </div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="border border-gray-200 rounded-xl p-4 flex flex-col hover:border-indigo-300 hover:shadow-sm transition-all bg-white group">
                <div className="flex items-start justify-between mb-3">
                  <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {doc.category}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">{doc.title}</h4>
                <p className="text-xs text-gray-500 mb-4">{doc.filename}</p>
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">{formatIST(doc.uploadDate, "MMM d, yyyy")}</span>
                  <button 
                    onClick={() => handleDownload(doc.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showUpload && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Upload New Resource</h3>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PDF / Document File</label>
                <input required type="file" ref={fileInputRef} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Upstox Product Spec Q3" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Sales Scripts">Sales Scripts</option>
                  <option value="Product Specs">Product Specs</option>
                  <option value="Compliance">Compliance Guidelines</option>
                  <option value="Onboarding">Onboarding Material</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowUpload(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={uploading || !file} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
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
