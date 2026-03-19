"use client";

import { useEffect, useState } from "react";
import { Activity, Calendar, ChevronRight, Clock, Info, Zap } from "lucide-react";
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
      setSelectedWorkout(data[0] || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((item) => <div key={item} className="h-24 rounded-xl bg-zinc-900"></div>)}
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-[#141417] py-20">
        <Zap className="mb-4 h-12 w-12 text-zinc-700" />
        <h3 className="text-lg font-medium text-zinc-300">No workouts synced yet</h3>
        <p className="text-sm text-zinc-500">Use the Overview tab to sync your data from Hevy.</p>
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
              selectedWorkout?.id === workout.id ? "border-sky-400/50 bg-sky-400/5" : "border-zinc-800/50 bg-[#141417] hover:border-zinc-700"
            }`}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h4 className="font-bold uppercase tracking-wide text-white transition-colors group-hover:text-sky-400">
                  {workout.title || "Workout"}
                </h4>
                <div className="mt-1 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(workout.startedAt), "MMM d, yyyy")}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {Math.round((workout.durationSeconds || 0) / 60)} min</span>
                </div>
              </div>
              <div className="rounded border border-zinc-800/50 bg-zinc-900/50 px-2 py-1 text-[10px] font-bold text-zinc-500">
                {workout.source}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <div className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Exercises</div>
                  <div className="text-sm font-semibold text-zinc-300">{workout.exercisesCount || workout.exercises?.length || 0}</div>
                </div>
                <div>
                  <div className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Volume</div>
                  <div className="text-sm font-semibold text-sky-400">{Math.round(workout.volumeKg || 0)} kg</div>
                </div>
                <div>
                  <div className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Sets</div>
                  <div className="text-sm font-semibold text-zinc-300">{workout.setsCount || 0}</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 transform text-zinc-700 transition-all group-hover:translate-x-1 group-hover:text-sky-400" />
            </div>
          </div>
        ))}
      </div>

      <div className="lg:col-span-1">
        {selectedWorkout ? (
          <div className="sticky top-8 rounded-2xl border border-zinc-800 bg-[#141417] p-6 animate-in slide-in-from-right-4 duration-300">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold">
              <Activity className="h-5 w-5 text-sky-400" />
              Workout Details
            </h3>
            <div className="space-y-6">
              {selectedWorkout.exercises?.map((exercise: any, exerciseIndex: number) => (
                <div key={exerciseIndex} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-200">{exerciseIndex + 1}. {exercise.exerciseName}</span>
                    <span className="font-mono text-[10px] text-zinc-500">{exercise.exerciseTemplateId}</span>
                  </div>
                  <div className="overflow-hidden rounded-lg bg-zinc-900/50 p-2">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-600">
                          <th className="py-1 text-left font-bold">SET</th>
                          <th className="py-1 text-right font-bold">REPS</th>
                          <th className="py-1 text-right font-bold">WEIGHT</th>
                        </tr>
                      </thead>
                      <tbody className="text-zinc-400">
                        {exercise.sets?.map((set: any, setIndex: number) => (
                          <tr key={setIndex} className="border-b border-zinc-800/30 transition-colors last:border-0 hover:bg-white/5">
                            <td className="flex items-center gap-1.5 py-1.5 font-mono">
                              <span className={`h-1.5 w-1.5 rounded-full ${set.setType === "warmup" ? "bg-orange-500" : set.setType === "dropset" ? "bg-purple-500" : "bg-sky-500"}`}></span>
                              {setIndex + 1}
                            </td>
                            <td className="py-1.5 text-right font-bold text-zinc-300">{set.reps ?? "-"}</td>
                            <td className="py-1.5 text-right font-bold text-sky-400">{Math.round(set.weightKg || 0)}kg</td>
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
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-[#141417]/30">
            <div className="mb-4 rounded-full bg-zinc-900 p-4">
              <Info className="h-6 w-6 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500">Select a workout to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
