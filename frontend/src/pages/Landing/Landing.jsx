import { Link } from 'react-router-dom';
import { Activity, Zap, Globe2, Users, ShieldCheck, TrendingUp, ArrowRight, Link2, AtSign } from 'lucide-react';
import heroImage from '../../assets/hero.png';

const FEATURES = [
  {
    icon: Activity,
    title: '24/7 Monitoring',
    description: 'Continuous health checks every 10 seconds from our distributed nodes.',
  },
  {
    icon: Globe2,
    title: 'Global Latency',
    description: 'Track P99 latency across all continents and identify regional bottlenecks.',
  },
  {
    icon: Zap,
    title: 'Instant Alerts',
    description: 'Configurable webhooks for Slack, Discord and Email. Never miss a regression.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Role-based access control and shared workspaces for large engineering orgs.',
  },
];

const PLANS = [
  { name: 'Starter', price: '$0', tagline: 'For side projects', features: ['5 monitored endpoints', '5 min checks', 'Email alerts'] },
  { name: 'Pro', price: '$29', tagline: 'For growing teams', features: ['50 monitored endpoints', '30s checks', 'Slack + Email alerts', 'History retention'] },
  { name: 'Enterprise', price: 'Custom', tagline: 'For infrastructure at scale', features: ['Unlimited endpoints', 'SSO / SOC2', 'Dedicated support'] },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-5 w-5 text-on-primary" />
            </div>
            <span className="font-bold">API Health Dashboard</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-text-secondary md:flex">
            <a href="#features" className="hover:text-text-primary">Features</a>
            <a href="#pricing" className="hover:text-text-primary">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary">
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-20 text-center">
        <span className="inline-block rounded-full border border-border bg-surface-container px-3 py-1 text-xs font-medium text-text-secondary">
          New: Edge Latency Insights
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
          Reliable API Monitoring for{' '}
          <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
            Modern Engineering Teams
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-text-secondary">
          Deploy globally, monitor instantly. Get sub-second alerting, global latency tracking, and deep
          infrastructure insights in a clinical, developer-first environment.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-on-primary hover:bg-primary-hover"
          >
            Get Started for Free <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="rounded-lg border border-border-strong px-6 py-3 font-semibold text-text-primary hover:bg-surface-container-high"
          >
            View Demo
          </a>
        </div>

        <div className="mt-16 overflow-hidden rounded-xl border border-border">
          <img src={heroImage} alt="API Health Dashboard product preview" className="w-full object-cover" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-surface-container-low py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold">Everything you need for API stability</h2>
          <p className="mt-3 text-text-secondary">Engineered to be the silent guardian of your production traffic.</p>
          <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl border border-border bg-surface-container p-6">
                <Icon className="mb-4 h-6 w-6 text-primary" />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reduce downtime */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">
              Reduce Downtime. <span className="text-primary">Ship with Confidence.</span>
            </h2>
            <div className="mt-8 space-y-6">
              {[
                { icon: TrendingUp, title: 'Optimize Performance', desc: 'Identify slow endpoints and database queries before they impact your users.' },
                { icon: ShieldCheck, title: 'Enterprise Ready', desc: 'SOC2 Type II compliant, SSO integration, and 99.9% uptime SLA guarantee.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{title}</h4>
                    <p className="mt-1 text-sm text-text-secondary">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface-container p-1">
            <div className="flex h-72 items-center justify-center rounded-lg bg-surface-container-high text-text-muted">
              <Activity className="h-16 w-16" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing placeholder */}
      <section id="pricing" className="border-t border-border bg-surface-container-low py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
          <p className="mt-3 text-text-secondary">Placeholder tiers — billing isn&apos;t wired up yet.</p>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.name} className="flex flex-col rounded-xl border border-border bg-surface-container p-8 text-left">
                <h3 className="font-semibold text-text-primary">{plan.name}</h3>
                <p className="text-sm text-text-secondary">{plan.tagline}</p>
                <p className="mt-4 text-3xl font-bold">{plan.price}</p>
                <ul className="mt-6 flex-1 space-y-2 text-sm text-text-secondary">
                  {plan.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-2xl bg-primary px-8 py-14 text-center text-on-primary">
          <h2 className="text-3xl font-bold">Start monitoring in minutes.</h2>
          <p className="mt-3 text-white/80">
            Join engineering teams who trust API Health Dashboard for their infrastructure visibility.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-primary hover:bg-white/90"
          >
            Get Started for Free
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-text-secondary md:flex-row">
          <p>© {new Date().getFullYear()} API Health Dashboard. All rights reserved.</p>
          <div className="flex gap-4">
            <Link2 className="h-4 w-4" />
            <AtSign className="h-4 w-4" />
          </div>
        </div>
      </footer>
    </div>
  );
}
