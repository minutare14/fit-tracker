"use client";

import { useState, useEffect } from "react";
import { Zap, Clock, ChevronRight, Calendar, Activity, Info } from "lucide-react";
import { format } from "date-fns";

export function HevyWorkoutList() {
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

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-primary/5"></div>
      ))}
    </div>
  );

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-slate-100/30 dark:bg-slate-900/20 border border-dashed border-primary/10 rounded-2xl">
        <Zap className="w-10 h-10 text-slate-700 mb-4" />
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">No workouts synced</h3>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight">Sync your data in Settings &gt; Integrations</p>
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
            className={`bg-slate-100 dark:bg-slate-900/50 border p-5 rounded-2xl transition-all cursor-pointer group ${
              selectedWorkout?.id === workout.id ? 'border-primary/50 bg-primary/5' : 'border-primary/5 hover:border-primary/20'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-black text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors uppercase tracking-tight">
                  {workout.title || "Workout"}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(workout.startedAt), "MMM d, yyyy")}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.round((workout.durationSeconds || 0) / 60)} min</span>
                </div>
              </div>
              <div className="bg-primary/10 px-2 py-0.5 rounded text-[8px] font-black text-primary border border-primary/20 uppercase tracking-tighter">
                {workout.source}
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-8">
                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Exercises</div>
                  <div className="text-sm font-black text-slate-700 dark:text-slate-200">{workout.exercises?.length || 0}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Volume</div>
                  <div className="text-sm font-black text-primary">
                    {workout.rawPayloadJson?.volume_kg ? `${Math.round(workout.rawPayloadJson.volume_kg)}kg` : '---'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-primary transition-all transform group-hover:translate-x-1" />
            </div>
          </div>
        ))}
      </div>

      <div className="lg:col-span-1">
        {selectedWorkout ? (
          <div className="bg-slate-50 dark:bg-zinc-900 border border-primary/10 rounded-2xl p-6 sticky top-24 animate-in slide-in-from-right-4 duration-300">
            <h3 className="text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-widest text-slate-100">
              <Activity className="w-4 h-4 text-primary" />
              Session Details
            </h3>
            <div className="space-y-6">
              {selectedWorkout.exercises?.map((ex: any, i: number) => (
                <div key={i} className="space-y-3">
                   <div className="flex items-center justify-between">
                     <span className="text-[11px] font-black text-slate-200 uppercase tracking-tight">{i+1}. {ex.exerciseName}</span>
                     <span className="text-[9px] text-slate-500 font-mono uppercase opacity-50">{ex.exerciseTemplateId}</span>
                   </div>
                   <div className="bg-background-light dark:bg-background-dark/50 rounded-xl p-3 border border-primary/5">
                     <table className="w-full text-[10px]">
                        <thead>
                          <tr className="text-slate-500 border-b border-primary/5 uppercase font-black tracking-tighter">
                            <th className="text-left py-1 font-black">SET</th>
                            <th className="text-right py-1 font-black">REPS</th>
                            <th className="text-right py-1 font-black">WEIGHT</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-400">
                          {ex.sets?.map((set: any, si: number) => (
                            <tr key={si} className="border-b border-primary/5 last:border-0 hover:bg-primary/5 transition-colors">
                              <td className="py-2 flex items-center gap-1.5 font-mono">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  set.setType === 'warmup' ? 'bg-orange-500' : 
                                  set.setType === 'dropset' ? 'bg-purple-500' : 
                                  'bg-primary'
                                }`}></span>
                                {si+1}
                              </td>
                              <td className="text-right py-2 font-black text-slate-300">{set.reps}</td>
                              <td className="text-right py-2 font-black text-primary">{Math.round(set.weightKg)}kg</td>
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
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-slate-100/20 dark:bg-slate-900/20 border border-dashed border-primary/10 rounded-2xl p-8 text-center">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
              <Info className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Select a session to view analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}
