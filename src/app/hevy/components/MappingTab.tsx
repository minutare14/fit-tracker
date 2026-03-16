"use client";

import { useState, useEffect } from "react";
import { Settings, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, RefreshCw, ChevronRight, Search } from "lucide-react";

export function MappingTab() {
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<any | null>(null);

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    try {
      const res = await fetch("/api/hevy/mappings");
      const data = await res.json();
      setMappings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm("Remove this mapping?")) return;
    try {
      await fetch("/api/hevy/mappings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalName: name })
      });
      fetchMappings();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#141417] p-6 rounded-2xl border border-zinc-800/50">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Exercise Mappings</h3>
          <p className="text-sm text-zinc-500">Link your internal BJJ Lab exercises to Hevy Catalog templates.</p>
        </div>
        <button 
          onClick={() => { setEditingMapping(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-xl transition-all font-bold text-sm shadow-lg shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Mapping
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-20 bg-zinc-900 rounded-2xl animate-pulse"></div>)
        ) : mappings.length > 0 ? (
          mappings.map((m) => (
            <div key={m.id} className="bg-[#141417] border border-zinc-800/50 p-5 rounded-2xl hover:border-sky-400/30 transition-all group flex items-center justify-between">
              <div className="flex items-center gap-10 flex-1">
                <div className="w-1/3">
                   <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Internal Exercise</div>
                   <div className="text-sm font-bold text-zinc-200 truncate uppercase">{m.internalExerciseName}</div>
                </div>
                
                <div className="flex items-center text-zinc-700">
                   <RefreshCw className="w-4 h-4" />
                </div>

                <div className="flex-1">
                   <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Hevy Template</div>
                   <div className="flex items-center gap-2">
                     <span className="text-sm font-bold text-sky-400 truncate uppercase">{m.externalExerciseTitle}</span>
                     <span className="text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-500 font-mono uppercase tracking-tighter border border-zinc-800/50">{m.externalExerciseTemplateId}</span>
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                 <div className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-tighter ${
                    m.mappingStatus === 'ACTIVE' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'
                 }`}>
                   {m.mappingStatus}
                 </div>
                 <button 
                  onClick={() => { setEditingMapping(m); setIsModalOpen(true); }}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-sky-400 transition-colors"
                 >
                   <Edit2 className="w-4 h-4" />
                 </button>
                 <button 
                  onClick={() => handleDelete(m.internalExerciseName)}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-400 transition-colors"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-[#141417]/50 border border-dashed border-zinc-800 rounded-2xl">
             <Settings className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
             <p className="text-zinc-500">No mappings established yet.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <MappingModal 
          mapping={editingMapping} 
          onClose={() => setIsModalOpen(false)} 
          onSave={() => { setIsModalOpen(false); fetchMappings(); }} 
        />
      )}
    </div>
  );
}

function MappingModal({ mapping, onClose, onSave }: any) {
  const [internalName, setInternalName] = useState(mapping?.internalExerciseName || "");
  const [externalId, setExternalId] = useState(mapping?.externalExerciseTemplateId || "");
  const [externalTitle, setExternalTitle] = useState(mapping?.externalExerciseTitle || "");
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (search.length > 2) {
      const timer = setTimeout(() => fetchTemplates(), 300);
      return () => clearTimeout(timer);
    }
  }, [search]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`/api/hevy/exercise-templates?search=${search}`);
      const data = await res.json();
      setTemplates(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/hevy/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internalExerciseName: internalName,
          externalExerciseTemplateId: externalId,
          externalExerciseTitle: externalTitle
        })
      });
      onSave();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#141417] border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
           <h3 className="text-xl font-bold">{mapping ? 'Edit Mapping' : 'New Exercise Mapping'}</h3>
           <button onClick={onClose} className="text-zinc-500 hover:text-white">×</button>
        </div>
        
        <div className="p-6 space-y-5">
           <div className="space-y-2">
             <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Internal Name</label>
             <input 
              type="text" 
              value={internalName}
              onChange={(e) => setInternalName(e.target.value)}
              placeholder="e.g. Bench Press"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:border-sky-400 outline-none transition-all uppercase"
             />
           </div>

           <div className="space-y-2">
             <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Search Hevy Catalog</label>
             <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type 3+ letters..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-sky-400 outline-none transition-all"
                />
             </div>
           </div>

           {templates.length > 0 && (
             <div className="max-h-40 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800 custom-scrollbar">
                {templates.map(tpl => (
                  <button 
                    key={tpl.id}
                    onClick={() => {
                      setExternalId(tpl.externalTemplateId);
                      setExternalTitle(tpl.title);
                      setTemplates([]);
                      setSearch(tpl.title);
                    }}
                    className="w-full text-left p-3 hover:bg-sky-400/5 hover:text-sky-400 transition-colors group flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold uppercase">{tpl.title}</div>
                      <div className="text-[10px] text-zinc-600 font-mono uppercase">{tpl.externalTemplateId}</div>
                    </div>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all font-bold" />
                  </button>
                ))}
             </div>
           )}

           <div className="bg-zinc-900/50 p-4 rounded-xl border border-dashed border-zinc-800 space-y-2">
              <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Active Selection</div>
              {externalId ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-sky-400 uppercase truncate">{externalTitle}</span>
                  <span className="text-[10px] font-mono text-zinc-600 uppercase">{externalId}</span>
                </div>
              ) : <div className="text-xs text-zinc-700 italic">None selected</div>}
           </div>
        </div>

        <div className="p-6 bg-zinc-900/30 flex gap-3 mt-4 leading-relaxed">
           <button 
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold rounded-xl transition-all text-sm"
           >
             Cancel
           </button>
           <button 
            disabled={!internalName || !externalId || saving}
            onClick={handleSave}
            className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm shadow-xl shadow-sky-500/20"
           >
             {saving ? 'Saving...' : 'Save Mapping'}
           </button>
        </div>
      </div>
    </div>
  );
}
