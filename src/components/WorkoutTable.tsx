interface WorkoutSession {
  date: string
  name: string
  category: string
  volume: string
  intensity: number
  sets: number
}

const recentWorkouts: WorkoutSession[] = [
  { date: "Oct 24, 2023", name: "Pull B - Deadlift Focus", category: "Back & Biceps", volume: "12,450kg", intensity: 85, sets: 18 },
  { date: "Oct 22, 2023", name: "Push A - Bench Emphasis", category: "Chest, Delts & Triceps", volume: "10,120kg", intensity: 72, sets: 22 },
  { date: "Oct 20, 2023", name: "Lower Body - BJJ Specific", category: "Quads, Hams & Hips", volume: "15,800kg", intensity: 94, sets: 16 },
  { date: "Oct 18, 2023", name: "Core & Isometrics", category: "Stabilizers Focus", volume: "4,200kg", intensity: 60, sets: 14 }
]

export default function WorkoutTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-primary/10 bg-slate-100/30 dark:bg-slate-900/20">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-primary/10">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Workout Name</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Volume</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Intensity</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Sets</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-primary/5">
          {recentWorkouts.map((workout, i) => (
            <tr key={i} className="hover:bg-primary/5 transition-colors cursor-pointer group">
              <td className="px-6 py-4 text-xs font-medium text-slate-500">{workout.date}</td>
              <td className="px-6 py-4">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{workout.name}</p>
                <p className="text-[10px] text-slate-400">{workout.category}</p>
              </td>
              <td className="px-6 py-4 text-sm font-mono text-slate-700 dark:text-slate-300">{workout.volume}</td>
              <td className="px-6 py-4">
                <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${workout.intensity}%` }}></div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-bold text-right text-slate-900 dark:text-slate-100">{workout.sets}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
