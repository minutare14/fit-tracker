"use client";

import { useState, useEffect } from "react";
import { Zap, Clock, TrendingUp, ChevronRight, Calendar, ExternalLink, Activity, Info } from "lucide-react";
import { format } from "date-fns";

export function WorkoutsTab() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<any | null>(null);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const res = await fetch("/api/hevy/workouts");
      const data = await res.json();
      setWorkouts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4">
    {[1,2,3].map(i => <div key={i} className="h-24 bg-zinc-900 rounded-xl"></div>)}
  </div>;

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#141417] border border-dashed border-zinc-800 rounded-2xl">
        <Zap className="w-12 h-12 text-zinc-700 mb-4" />
        <h3 className="text-lg font-medium text-zinc-300">No workouts synced yet</h3>
        <p className="text-zinc-500 text-sm">Use the Overview tab to sync your data from Hevy.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {workouts.map((workout) => (
          <div 
            key={workout.id} 
            onClick={() => setSelectedWorkout(workout)}
            className={`bg-[#141417] border p-5 rounded-2xl transition-all cursor-pointer group ${
              selectedWorkout?.id === workout.id ? 'border-sky-400/50 bg-sky-400/5' : 'border-zinc-800/50 hover:border-zinc-700'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-white group-hover:text-sky-400 transition-colors uppercase tracking-wide">
                  {workout.title || "Workout"}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 font-medium uppercase tracking-wider">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(workout.startedAt), "MMM d, yyyy")}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.round((workout.durationSeconds || 0) / 60)} min</span>
                </div>
              </div>
              <div className="bg-zinc-900/50 px-2 py-1 rounded text-[10px] font-bold text-zinc-500 border border-zinc-800/50">
                {workout.source}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Exercises</div>
                  <div className="text-sm font-semibold text-zinc-300">{workout.exercises?.length || 0}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Volume Est.</div>
                  <div className="text-sm font-semibold text-sky-400">---</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-sky-400 transition-all transform group-hover:translate-x-1" />
            </div>
          </div>
        ))}
      </div>

      <div className="lg:col-span-1">
        {selectedWorkout ? (
          <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 sticky top-8 animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-400" />
              Workout Details
            </h3>
            <div className="space-y-6">
              {selectedWorkout.exercises?.map((ex: any, i: number) => (
                <div key={i} className="space-y-3">
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-bold text-zinc-200">{i+1}. {ex.exerciseName}</span>
                     <span className="text-[10px] text-zinc-500 font-mono">{ex.exerciseTemplateId}</span>
                   </div>
                   <div className="bg-zinc-900/50 rounded-lg p-2 overflow-hidden">
                     <table className="w-full text-[11px]">
                        <thead>
                          <tr className="text-zinc-600 border-b border-zinc-800">
                            <th className="text-left py-1 font-bold">SET</th>
                            <th className="text-right py-1 font-bold">REPS</th>
                            <th className="text-right py-1 font-bold">WEIGHT</th>
                          </tr>
                        </thead>
                        <tbody className="text-zinc-400">
                          {ex.sets?.map((set: any, si: number) => (
                            <tr key={si} className="border-b border-zinc-800/30 last:border-0 hover:bg-white/5 transition-colors">
                              <td className="py-1.5 flex items-center gap-1.5 font-mono">
                                <span className={`w-1.5 h-1.5 rounded-full ${set.setType === 'warmup' ? 'bg-orange-500' : set.setType === 'dropset' ? 'bg-purple-500' : 'bg-sky-500'}`}></span>
                                {si+1}
                              </td>
                              <td className="text-right py-1.5 font-bold text-zinc-300">{set.reps}</td>
                              <td className="text-right py-1.5 font-bold text-sky-400">{set.weightKg}kg</td>
                            </tr>
                          ))}
                        </tbody>
                     </table>
                   </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-[#141417]/30 border border-dashed border-zinc-800 rounded-2xl">
            <div className="p-4 bg-zinc-900 rounded-full mb-4">
              <Info className="w-6 h-6 text-zinc-600" />
            </div>
            <p className="text-zinc-500 text-sm">Select a workout to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
