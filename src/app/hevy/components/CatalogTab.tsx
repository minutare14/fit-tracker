"use client";

import { useState, useEffect } from "react";
import { Database, Search, Filter, Hash, ChevronRight, Info } from "lucide-react";

export function CatalogTab() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, [search, category]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category) params.append("category", category);
      
      const res = await fetch(`/api/hevy/exercise-templates?${params.toString()}`);
      const data = await res.json();
      setTemplates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 bg-[#141417] p-4 rounded-2xl border border-zinc-800/50 shadow-lg">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-sky-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search exercises by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-sky-400/50 focus:border-sky-400 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
           <Filter className="w-4 h-4 text-zinc-500 ml-2" />
           <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-sky-400"
           >
             <option value="">All Categories</option>
             <option value="strength">Strength</option>
             <option value="cardio">Cardio</option>
             <option value="bodyweight">Bodyweight</option>
           </select>
        </div>
      </div>

      <div className="bg-[#141417] border border-zinc-800/50 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-900/50 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
            <tr>
              <th className="px-6 py-4">Exercise Name</th>
              <th className="px-6 py-4">Template ID</th>
              <th className="px-6 py-4">Muscle Group</th>
              <th className="px-6 py-4">Equipment</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {loading ? (
               [1,2,3,4,5].map(i => (
                 <tr key={i} className="animate-pulse">
                   <td className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-48"></div></td>
                   <td className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-24"></div></td>
                   <td className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-20"></div></td>
                   <td className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-20"></div></td>
                   <td className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-12 ml-auto"></div></td>
                 </tr>
               ))
            ) : templates.length > 0 ? (
              templates.map((tpl) => (
                <tr key={tpl.id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-6 py-4 font-bold text-zinc-200 group-hover:text-sky-400 transition-colors uppercase tracking-wide">
                    {tpl.title}
                    {tpl.isCustom && <span className="ml-2 text-[8px] bg-orange-400/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-400/20">Custom</span>}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500 uppercase">{tpl.externalTemplateId}</td>
                  <td className="px-6 py-4 text-xs text-zinc-400 uppercase tracking-tighter">{tpl.primaryMuscle || "---"}</td>
                  <td className="px-6 py-4 text-xs text-zinc-400 uppercase tracking-tighter">{tpl.equipment || "---"}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-sky-400 transition-colors">
                      <Hash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">
                  No exercises found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
