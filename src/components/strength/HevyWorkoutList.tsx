"use client";

import { useEffect, useState } from "react";
import { Activity, Calendar, ChevronRight, Clock, Info, Zap } from "lucide-react";
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
      setSelectedWorkout(data[0] || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-24 rounded-xl border border-primary/5 bg-slate-100 dark:bg-slate-900/50"></div>
        ))}
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/10 bg-slate-100/30 py-12 dark:bg-slate-900/20">
        <Zap className="mb-4 h-10 w-10 text-slate-700" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">No workouts synced</h3>
        <p className="mt-1 text-[10px] uppercase tracking-tight text-slate-500">Sync your data in Settings &gt; Integrations</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {workouts.map((workout) => (
          <div
            key={workout.id}
            onClick={() => setSelectedWorkout(workout)}
            className={`group cursor-pointer rounded-2xl border p-5 transition-all ${
              selectedWorkout?.id === workout.id ? "border-primary/50 bg-primary/5" : "border-primary/5 bg-slate-100 dark:bg-slate-900/50 hover:border-primary/20"
            }`}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h4 className="font-black uppercase tracking-tight text-slate-900 transition-colors group-hover:text-primary dark:text-slate-100">
                  {workout.title || "Workout"}
                </h4>
                <div className="mt-1 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(workout.startedAt), "MMM d, yyyy")}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {Math.round((workout.durationSeconds || 0) / 60)} min</span>
                </div>
              </div>
              <div className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter text-primary">
                {workout.source}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-8">
                <div>
                  <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">Exercises</div>
                  <div className="text-sm font-black text-slate-700 dark:text-slate-200">{workout.exercisesCount || workout.exercises?.length || 0}</div>
                </div>
                <div>
                  <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">Volume</div>
                  <div className="text-sm font-black text-primary">{Math.round(workout.volumeKg || 0)}kg</div>
                </div>
                <div>
                  <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">Sets</div>
                  <div className="text-sm font-black text-slate-700 dark:text-slate-200">{workout.setsCount || 0}</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 transform text-slate-700 transition-all group-hover:translate-x-1 group-hover:text-primary" />
            </div>
          </div>
        ))}
      </div>

      <div className="lg:col-span-1">
        {selectedWorkout ? (
          <div className="sticky top-24 rounded-2xl border border-primary/10 bg-slate-50 p-6 animate-in slide-in-from-right-4 duration-300 dark:bg-zinc-900">
            <h3 className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-100">
              <Activity className="h-4 w-4 text-primary" />
              Session Details
            </h3>
            <div className="space-y-6">
              {selectedWorkout.exercises?.map((exercise: any, exerciseIndex: number) => (
                <div key={exerciseIndex} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-tight text-slate-200">{exerciseIndex + 1}. {exercise.exerciseName}</span>
                    <span className="font-mono text-[9px] uppercase opacity-50 text-slate-500">{exercise.exerciseTemplateId}</span>
                  </div>
                  <div className="rounded-xl border border-primary/5 bg-background-light p-3 dark:bg-background-dark/50">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="border-b border-primary/5 text-slate-500 uppercase tracking-tighter">
                          <th className="py-1 text-left font-black">SET</th>
                          <th className="py-1 text-right font-black">REPS</th>
                          <th className="py-1 text-right font-black">WEIGHT</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-400">
                        {exercise.sets?.map((set: any, setIndex: number) => (
                          <tr key={setIndex} className="border-b border-primary/5 transition-colors last:border-0 hover:bg-primary/5">
                            <td className="flex items-center gap-1.5 py-2 font-mono">
                              <span className={`h-1.5 w-1.5 rounded-full ${set.setType === "warmup" ? "bg-orange-500" : set.setType === "dropset" ? "bg-purple-500" : "bg-primary"}`}></span>
                              {setIndex + 1}
                            </td>
                            <td className="py-2 text-right font-black text-slate-300">{set.reps ?? "-"}</td>
                            <td className="py-2 text-right font-black text-primary">{Math.round(set.weightKg || 0)}kg</td>
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
          <div className="flex min-h-[300px] h-full flex-col items-center justify-center rounded-2xl border border-dashed border-primary/10 bg-slate-100/20 p-8 text-center dark:bg-slate-900/20">
            <div className="mb-4 rounded-full bg-slate-100 p-3 dark:bg-slate-800">
              <Info className="h-6 w-6 text-slate-600" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Select a session to view analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}
