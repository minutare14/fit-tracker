import Sidebar from "@/components/Sidebar"
import PageHeader from "@/components/PageHeader"
import HealthMarkerCard from "@/components/HealthMarkerCard"
import RecoveryProtocolItem from "@/components/RecoveryProtocolItem"

export default function HealthPage() {
  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      
      <main className="ml-64 flex-1 flex flex-col overflow-y-auto">
        <PageHeader 
          title="Recuperação & Saúde" 
          action={
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="material-symbols-outlined text-sm">schedule</span>
                Last Sync: 2m ago
              </div>
              <button className="h-9 px-4 rounded-lg bg-primary text-background-dark text-xs font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                GERAR RELATÓRIO
              </button>
            </div>
          }
        />

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Hero Stats Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Readiness Score Gauge */}
            <div className="lg:col-span-4 bg-white dark:bg-card-dark p-8 rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col items-center justify-center shadow-sm">
              <div className="absolute top-4 left-6">
                <p className="text-xs font-bold text-slate-500 tracking-widest uppercase">Readiness Score</p>
              </div>
              <div className="relative size-48 flex items-center justify-center">
                <svg className="size-full transform -rotate-90">
                  <circle className="text-slate-100 dark:text-slate-800" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="8"></circle>
                  <circle className="text-primary" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeDasharray="552.92" strokeDashoffset="66.35" strokeWidth="8"></circle>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-6xl font-black text-slate-900 dark:text-slate-100 italic">88</span>
                  <span className="text-xs font-bold text-primary tracking-widest">OPTIMAL</span>
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500 leading-relaxed">System ready for <span className="text-slate-900 dark:text-slate-100 font-bold">Max Intensity</span>. CNS recovery complete.</p>
              </div>
            </div>

            {/* Core Indicators */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <HealthMarkerCard 
                label="HRV (rMSSD)" value="74" unit="ms" 
                trend="trending_up" trendText="+8.2% vs baseline" trendColor="text-green-500" 
                chartColor="text-sky-400" 
              />
              <HealthMarkerCard 
                label="Resting HR" value="52" unit="bpm" 
                trend="trending_down" trendText="-2.1% (Ideal)" trendColor="text-green-500" 
                chartColor="text-primary" 
              />
              <HealthMarkerCard 
                label="Body Temp" value="36.8" unit="°C" 
                trend="remove" trendText="Stable Baseline" trendColor="text-slate-500" 
                chartColor="text-slate-900 dark:text-slate-100" 
              />
            </div>
          </div>

          {/* HRV vs LOAD Analysis Chart */}
          <div className="bg-white dark:bg-card-dark p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">HRV vs. Training Load Analysis</h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Correlation of fatigue markers over 14 days</p>
              </div>
            </div>
            <div className="h-[250px] w-full relative">
               <div className="absolute inset-0 flex items-end gap-2 px-2">
                {[4, 5, 7, 9, 6, 4, 3, 5, 7, 8, 6, 4, 3, 2].map((v, i) => (
                  <div key={i} className="flex-1 bg-primary/10 border border-primary/20 rounded-t-sm" style={{ height: `${v * 10}%` }}></div>
                ))}
              </div>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1000 300">
                <path d="M0,200 Q75,180 150,190 T300,160 T450,140 T600,180 T750,210 T900,150 T1000,130" fill="none" stroke="#00f0ff" strokeLinecap="round" strokeWidth="4"></path>
              </svg>
            </div>
          </div>

          {/* Bottom Row: Sleep & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-card-dark p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Sleep Architecture</h3>
              <div className="space-y-6">
                <div className="relative h-12 w-full flex rounded overflow-hidden">
                  <div className="w-[15%] bg-slate-900 border-r border-slate-700"></div>
                  <div className="w-[55%] bg-indigo-500/40 border-r border-slate-700"></div>
                  <div className="w-[15%] bg-indigo-500"></div>
                  <div className="w-[15%] bg-accent-blue"></div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'REM', val: '1h 24m', color: 'text-accent-blue' },
                    { label: 'Deep', val: '1h 10m', color: 'text-indigo-400' },
                    { label: 'Light', val: '4h 45m', color: 'text-slate-900 dark:text-slate-100' },
                    { label: 'Awake', val: '53m', color: 'text-slate-500' },
                  ].map((s) => (
                    <div key={s.label} className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{s.label}</p>
                      <p className={`text-lg font-black ${s.color}`}>{s.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-card-dark p-8 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-primary shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">psychology</span>
                Recovery Protocol
              </h3>
              <div className="space-y-4">
                <RecoveryProtocolItem 
                  title="Training Intensity: Level 5" 
                  description="High Readiness Score suggest you can handle threshold or VO2 max efforts today." 
                  icon="directions_bike" iconBg="bg-primary/20" iconColor="text-primary" borderVariant="bg-primary/5 border-primary/10"
                />
                <RecoveryProtocolItem 
                  title="Nutritional Focus: Glycogen Reload" 
                  description="Increase complex carbohydrate intake by 15% for optimal fueling based on load." 
                  icon="restaurant" iconBg="bg-accent-blue/20" iconColor="text-accent-blue"
                />
                <RecoveryProtocolItem 
                  title="Active Recovery: Mobility Session" 
                  description="Lower body posterior chain tension indicated. Scheduled 20-min routine recommended." 
                  icon="self_improvement" iconBg="bg-slate-200 dark:bg-slate-700" iconColor="text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
