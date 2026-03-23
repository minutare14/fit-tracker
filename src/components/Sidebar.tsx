"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { label: "Dashboard", icon: "grid_view", href: "/" },
  { label: "Jiu-Jitsu Sessions", icon: "sports_kabaddi", href: "/bjj" },
  { label: "Health & Recovery", icon: "ecg_heart", href: "/health" },
  { label: "Weight & Comp", icon: "scale", href: "/weight" },
  { label: "Nutrition", icon: "restaurant", href: "/nutrition" },
  { label: "Insights", icon: "psychology", href: "/insights" },
  { label: "Settings", icon: "settings", href: "/settings" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col fixed h-full bg-background-light dark:bg-background-dark z-20">
      <div className="px-6 pt-10 pb-6 flex items-center gap-3">
        <div className="size-10 bg-primary rounded flex shrink-0 items-center justify-center text-background-dark">
          <span className="material-symbols-outlined font-bold">exercise</span>
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">BJJ LAB</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">Elite Performance</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded bg-slate-100 dark:bg-slate-800/50">
          <div className="size-8 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden">
            <img
              className="w-full h-full object-cover"
              alt="Athlete profile"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuClcqwdiP_o8nDQqwxUh2PhE6PlpyxWHWBXox2PhKw5ArunqLRRpnQLldZ3DVSVCMxnvQEVwLFnNcEHUhE552sSu05jV9kO6AHnPxxR-vsjreSMKTiB-okRWT7yheHxs146bK2WNyn20rwJI4SHKCK2dw7TfG-5k1xTQzpugLwSIdP0GNXtitwhCQncwZn1dvZSpfkfr7I8-Dx67AY6tTKyPNrDx_-ChjUwzqTaqUG97bq_OvKJAA5btyPeA2Xtv07EmKpQ0qvedzc"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-slate-900 dark:text-slate-100">Emanoel M.</p>
            <p className="text-[10px] text-slate-500">Black Belt / 82kg</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
