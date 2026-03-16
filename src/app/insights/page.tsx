import Sidebar from "@/components/Sidebar"
import PageHeader from "@/components/PageHeader"
import InsightAnalysisCard from "@/components/InsightAnalysisCard"

export default function InsightsPage() {
  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      
      <main className="ml-64 flex-1 flex flex-col overflow-y-auto">
        <PageHeader 
          title="Insights Estratégicos" 
          action={
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-zinc-800 text-sm font-medium rounded hover:bg-opacity-80 transition-all text-slate-900 dark:text-slate-100">
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                <span>Últimos 30 dias</span>
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>
            </div>
          }
        />

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Cross-Correlation Section */}
          <section>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">query_stats</span>
                    Cross-Correlation: Carga vs. Recuperação
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">Training Load, HRV e Qualidade de Sono</p>
                </div>
              </div>
              <div className="h-64 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 200">
                  <path d="M0,160 Q100,140 200,100 T400,120 T600,60 T800,140 T1000,80" fill="none" stroke="#ccff00" strokeWidth="3" className="opacity-80"></path>
                  <path d="M0,100 Q150,120 300,70 T600,110 T900,50 T1000,120" fill="none" stroke="#007AFF" strokeDasharray="5,2" strokeWidth="2" className="opacity-80"></path>
                </svg>
                <div className="flex justify-between mt-4 text-[10px] text-slate-400 font-mono uppercase">
                  {['01 Out', '07 Out', '14 Out', '21 Out', '28 Out'].map(d => <span key={d}>{d}</span>)}
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">pattern</span>
                Pattern Recognition
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InsightAnalysisCard 
                  title="Overtraining Risk" 
                  description="Alta carga de treino combinada com HRV 12% abaixo da baseline detectada consistentemente às Terças-feiras." 
                  icon="warning" iconBg="bg-red-500/10" iconColor="text-red-500" badge="Critical Alert" footerText="Recalibrar Volume" hoverBorder="primary/50"
                />
                <InsightAnalysisCard 
                  title="Nutrition & Power" 
                  description="Aumento de 15% no volume de Bench Press em dias com ingestão de carboidratos superior a 300g." 
                  icon="restaurant" iconBg="bg-primary/10" iconColor="text-primary" badge="Efficiency Gain" footerText="Optimal Fueling" hoverBorder="accent-blue/50"
                />
                <InsightAnalysisCard 
                  title="Sleep Impact on RPE" 
                  description="O RPE nas sessões de BJJ cai 1 ponto para cada hora adicional de sono profundo (Deep Sleep)." 
                  icon="bedtime" iconBg="bg-accent-blue/10" iconColor="text-accent-blue" badge="Insight" footerText="Sleep Optimization" hoverBorder="zinc-500" fullWidth
                />
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-accent-blue mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">priority_high</span>
                  Gap Analysis
                </h4>
                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
                  <div className="p-4 space-y-4">
                    {[
                      { l: 'Mobility Sessions', p: 60, c: 'bg-red-400', t: '-40% Target' },
                      { l: 'Protein Intake', p: 85, c: 'bg-amber-400', t: '-15% Target' },
                      { l: 'Hydration', p: 100, c: 'bg-primary', t: 'On Target' },
                    ].map(g => (
                      <div key={g.l}>
                        <div className="flex justify-between text-xs mb-1.5 font-medium">
                          <span className="text-slate-500 dark:text-zinc-400 uppercase">{g.l}</span>
                          <span className={g.c.replace('bg-', 'text-')}>{g.t}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full ${g.c} transition-all`} style={{ width: `${g.p}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">timeline</span>
                  Readiness Forecast
                </h4>
                <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-lg p-5 shadow-xl">
                  <div className="text-center mb-6">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mb-1">Readiness Index Estimated</p>
                    <div className="text-5xl font-black text-primary italic leading-none">88<span className="text-sm not-italic opacity-50 ml-1">pts</span></div>
                    <p className="text-xs text-green-400 mt-2 font-medium flex items-center justify-center gap-1 italic">
                      Peak State Likely in 48h
                    </p>
                  </div>
                  <div className="flex items-end gap-1 h-12 px-2">
                    {[4, 6, 5, 8, 10, 9, 7].map((v, i) => (
                      <div key={i} className={`flex-1 rounded-t-sm transition-all ${v > 7 ? 'bg-primary' : 'bg-zinc-800'}`} style={{ height: `${v * 10}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
