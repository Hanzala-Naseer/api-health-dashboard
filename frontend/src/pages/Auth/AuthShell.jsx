import { Activity } from 'lucide-react';

export default function AuthShell({ title, subtitle, children, maxWidth = 'max-w-md' }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4 md:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-info/10 blur-3xl" />
      </div>

      <main className={`relative z-10 w-full ${maxWidth}`}>
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary shadow-lg">
            <Activity className="h-7 w-7 text-on-primary" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
        </div>

        <div className="rounded-xl border border-border bg-surface-container p-6 shadow-2xl md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
