import { ReactNode } from 'react';

export function PageHeader({ section, title, description, actions }: { section: string; title: string; description: string; actions?: ReactNode }) {
  return <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0"><p className="eyebrow mb-2">Executive Lead Control <span className="px-1 text-accent">/</span> {section}</p><h1 className="page-title text-[2rem] leading-tight md:text-[2.5rem]">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p></div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>;
}
