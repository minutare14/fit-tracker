import { SurfaceCard } from "@/modules/core/ui/surface-card";

interface IntegrationFormCardProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function IntegrationFormCard({
  eyebrow,
  title,
  description,
  actions,
  children,
}: IntegrationFormCardProps) {
  return (
    <SurfaceCard eyebrow={eyebrow} title={title}>
      <div className="flex flex-col gap-5">
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        {children}
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </SurfaceCard>
  );
}
