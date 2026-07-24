// import { Link } from 'react-router-dom';
// import { Activity, Zap, Globe2, Users, ShieldCheck, TrendingUp, ArrowRight, Link2, AtSign } from 'lucide-react';
// import heroImage from '../../assets/hero.png';

// const FEATURES = [
//   {
//     icon: Activity,
//     title: '24/7 Monitoring',
//     description: 'Continuous health checks every 10 seconds from our distributed nodes.',
//   },
//   {
//     icon: Globe2,
//     title: 'Global Latency',
//     description: 'Track P99 latency across all continents and identify regional bottlenecks.',
//   },
//   {
//     icon: Zap,
//     title: 'Instant Alerts',
//     description: 'Configurable webhooks for Slack, Discord and Email. Never miss a regression.',
//   },
//   {
//     icon: Users,
//     title: 'Team Collaboration',
//     description: 'Role-based access control and shared workspaces for large engineering orgs.',
//   },
// ];

// const PLANS = [
//   { name: 'Starter', price: '$0', tagline: 'For side projects', features: ['5 monitored endpoints', '5 min checks', 'Email alerts'] },
//   { name: 'Pro', price: '$29', tagline: 'For growing teams', features: ['50 monitored endpoints', '30s checks', 'Slack + Email alerts', 'History retention'] },
//   { name: 'Enterprise', price: 'Custom', tagline: 'For infrastructure at scale', features: ['Unlimited endpoints', 'SSO / SOC2', 'Dedicated support'] },
// ];

// export default function Landing() {
//   return (
//     <div className="min-h-screen bg-background text-text-primary">
//       <header className="border-b border-border">
//         <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
//           <div className="flex items-center gap-2">
//             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
//               <Activity className="h-5 w-5 text-on-primary" />
//             </div>
//             <span className="font-bold">API Health Dashboard</span>
//           </div>
//           <nav className="hidden items-center gap-8 text-sm text-text-secondary md:flex">
//             <a href="#features" className="hover:text-text-primary">Features</a>
//             <a href="#pricing" className="hover:text-text-primary">Pricing</a>
//           </nav>
//           <div className="flex items-center gap-3">
//             <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary">
//               Sign In
//             </Link>
//             <Link
//               to="/register"
//               className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover"
//             >
//               Get Started
//             </Link>
//           </div>
//         </div>
//       </header>

//       {/* Hero */}
//       <section className="mx-auto max-w-7xl px-6 py-20 text-center">
//         <span className="inline-block rounded-full border border-border bg-surface-container px-3 py-1 text-xs font-medium text-text-secondary">
//           New: Edge Latency Insights
//         </span>
//         <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
//           Reliable API Monitoring for{' '}
//           <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
//             Modern Engineering Teams
//           </span>
//         </h1>
//         <p className="mx-auto mt-5 max-w-xl text-text-secondary">
//           Deploy globally, monitor instantly. Get sub-second alerting, global latency tracking, and deep
//           infrastructure insights in a clinical, developer-first environment.
//         </p>
//         <div className="mt-8 flex items-center justify-center gap-4">
//           <Link
//             to="/register"
//             className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-on-primary hover:bg-primary-hover"
//           >
//             Get Started for Free <ArrowRight className="h-4 w-4" />
//           </Link>
//           <a
//             href="#features"
//             className="rounded-lg border border-border-strong px-6 py-3 font-semibold text-text-primary hover:bg-surface-container-high"
//           >
//             View Demo
//           </a>
//         </div>

//         <div className="mt-16 overflow-hidden rounded-xl border border-border">
//           <img src={heroImage} alt="API Health Dashboard product preview" className="w-full object-cover" />
//         </div>
//       </section>

//       {/* Features */}
//       <section id="features" className="border-t border-border bg-surface-container-low py-20">
//         <div className="mx-auto max-w-7xl px-6 text-center">
//           <h2 className="text-3xl font-bold">Everything you need for API stability</h2>
//           <p className="mt-3 text-text-secondary">Engineered to be the silent guardian of your production traffic.</p>
//           <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-2 lg:grid-cols-4">
//             {FEATURES.map(({ icon: Icon, title, description }) => (
//               <div key={title} className="rounded-xl border border-border bg-surface-container p-6">
//                 <Icon className="mb-4 h-6 w-6 text-primary" />
//                 <h3 className="font-semibold">{title}</h3>
//                 <p className="mt-2 text-sm text-text-secondary">{description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Reduce downtime */}
//       <section className="mx-auto max-w-7xl px-6 py-20">
//         <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
//           <div>
//             <h2 className="text-3xl font-bold">
//               Reduce Downtime. <span className="text-primary">Ship with Confidence.</span>
//             </h2>
//             <div className="mt-8 space-y-6">
//               {[
//                 { icon: TrendingUp, title: 'Optimize Performance', desc: 'Identify slow endpoints and database queries before they impact your users.' },
//                 { icon: ShieldCheck, title: 'Enterprise Ready', desc: 'SOC2 Type II compliant, SSO integration, and 99.9% uptime SLA guarantee.' },
//               ].map(({ icon: Icon, title, desc }) => (
//                 <div key={title} className="flex gap-4">
//                   <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
//                     <Icon className="h-5 w-5" />
//                   </div>
//                   <div>
//                     <h4 className="font-semibold">{title}</h4>
//                     <p className="mt-1 text-sm text-text-secondary">{desc}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//           <div className="rounded-xl border border-border bg-surface-container p-1">
//             <div className="flex h-72 items-center justify-center rounded-lg bg-surface-container-high text-text-muted">
//               <Activity className="h-16 w-16" />
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Pricing placeholder */}
//       <section id="pricing" className="border-t border-border bg-surface-container-low py-20">
//         <div className="mx-auto max-w-7xl px-6 text-center">
//           <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
//           <p className="mt-3 text-text-secondary">Placeholder tiers — billing isn&apos;t wired up yet.</p>
//           <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
//             {PLANS.map((plan) => (
//               <div key={plan.name} className="flex flex-col rounded-xl border border-border bg-surface-container p-8 text-left">
//                 <h3 className="font-semibold text-text-primary">{plan.name}</h3>
//                 <p className="text-sm text-text-secondary">{plan.tagline}</p>
//                 <p className="mt-4 text-3xl font-bold">{plan.price}</p>
//                 <ul className="mt-6 flex-1 space-y-2 text-sm text-text-secondary">
//                   {plan.features.map((f) => (
//                     <li key={f}>• {f}</li>
//                   ))}
//                 </ul>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* CTA */}
//       <section className="mx-auto max-w-7xl px-6 py-20">
//         <div className="rounded-2xl bg-primary px-8 py-14 text-center text-on-primary">
//           <h2 className="text-3xl font-bold">Start monitoring in minutes.</h2>
//           <p className="mt-3 text-white/80">
//             Join engineering teams who trust API Health Dashboard for their infrastructure visibility.
//           </p>
//           <Link
//             to="/register"
//             className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-primary hover:bg-white/90"
//           >
//             Get Started for Free
//           </Link>
//         </div>
//       </section>

//       <footer className="border-t border-border py-10">
//         <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-text-secondary md:flex-row">
//           <p>© {new Date().getFullYear()} API Health Dashboard. All rights reserved.</p>
//           <div className="flex gap-4">
//             <Link2 className="h-4 w-4" />
//             <AtSign className="h-4 w-4" />
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }


import { Link } from 'react-router-dom';
import { 
  Activity, 
  Zap, 
  Globe2, 
  Users, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight, 
  Link2, 
  AtSign,
  Bell,
  Clock,
  BarChart3,
  CheckCircle,
  Sparkles,
  BookOpen,
  FileText,
  Code,
  Server,
  AlertTriangle
} from 'lucide-react';
import heroImage from '../../assets/hero.png';

const FEATURES = [
  {
    icon: Clock,
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

const STATS = [
  { label: 'AVG LATENCY', value: '124ms' },
  { label: 'UPTIME', value: '99.98%' },
  { label: 'ENDPOINTS', value: '42' },
  { label: 'MEASUREMENTS', value: '1.2k' },
];

const TRUSTED_COMPANIES = ['VERCEL', 'STRIPE', 'GITHUB', 'LINEARAI'];

const FEATURES_SECTION = [
  {
    icon: Clock,
    title: '24/7 Monitoring',
    description: 'Continuous health checks every 10 seconds from our 24/7 support team.',
  },
  {
    icon: Globe2,
    title: 'Global Latency',
    description: 'Track P99 latency across all continents and globally optimized latencies.',
  },
  {
    icon: Bell,
    title: 'Instant Alerts',
    description: 'Configurable notifications for Slack, Discord, and Email, every minute or less.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Real-time access control and alerting via Slack or email.',
  },
];

const REDUCE_DOWNTIME = [
  {
    icon: TrendingUp,
    title: 'Optimize Performance',
    description: 'Identify slow endpoints and database queries before they impact your users.',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise Ready',
    description: 'SOC2 Type II compliant, SSO integration, and 99.9% uptime SLA guarantee.',
  },
];

const DOCS_SECTIONS = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    description: 'Learn how to set up your first API endpoint and start monitoring in minutes.',
    link: '#',
  },
  {
    icon: FileText,
    title: 'API Reference',
    description: 'Complete API documentation for integrating with our monitoring platform.',
    link: '#',
  },
  {
    icon: Code,
    title: 'SDK & Libraries',
    description: 'Official SDKs and client libraries for popular programming languages.',
    link: '#',
  },
  {
    icon: Server,
    title: 'Infrastructure Guide',
    description: 'Best practices for monitoring your infrastructure at scale.',
    link: '#',
  },
];

const FOOTER_LINKS = {
  PRODUCT: ['Global Checks', 'Alerting', 'Insights', 'Charging'],
  COMPANY: ['About Us', 'Customers', 'Careers', 'Contact'],
  RESOURCES: ['Documentation', 'API Reference', 'Community', 'Docs Page'],
  LEGAL: ['Privacy', 'Terms', 'Security'],
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* ============================================================
      HEADER / NAVIGATION
      ============================================================ */}
      <header className="border-b border-border bg-surface-container/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-hover">
              <Activity className="h-5 w-5 text-on-primary" />
            </div>
            <span className="text-lg font-bold">API Health</span>
          </div>
          
          <nav className="hidden items-center gap-8 text-sm text-text-secondary md:flex">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#docs" className="hover:text-text-primary transition-colors">Docs</a>
            <a href="#resources" className="hover:text-text-primary transition-colors">Resources</a>
          </nav>
          
          <div className="flex items-center gap-3">
            <Link 
              to="/login" 
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================
      HERO SECTION
      ============================================================ */}
      <section className="mx-auto max-w-7xl px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-container px-4 py-1.5 text-xs font-medium text-text-secondary shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          New: Edge Latency Insights
        </div>
        
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
          Reliable API Monitoring for{' '}
          <span className="bg-gradient-to-r from-primary via-primary-hover to-info bg-clip-text text-transparent">
            Modern Engineering Teams
          </span>
        </h1>
        
        <p className="mx-auto mt-5 max-w-2xl text-lg text-text-secondary leading-relaxed">
          Deploy globally, monitor instantly. Get sub-second alerting, global latency tracking, and deep
          infrastructure insights in a clinical, developer-first environment.
        </p>
        
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register"
            className="flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 font-semibold text-on-primary hover:bg-primary-hover transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40"
          >
            Get Started for Free <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="rounded-lg border border-border-strong bg-surface-container px-8 py-3.5 font-semibold text-text-primary hover:bg-surface-container-high transition-all"
          >
            View Demo
          </a>
        </div>

        {/* Trusted Companies */}
        <div className="mt-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Trusted by teams at:
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {TRUSTED_COMPANIES.map((company) => (
              <span key={company} className="text-sm font-semibold text-text-secondary/60 hover:text-text-secondary transition-colors">
                {company}
              </span>
            ))}
          </div>
        </div>

        {/* Hero Image - Centered with proper display */}
        <div className="mt-16 overflow-hidden rounded-2xl border border-border bg-surface-container shadow-2xl">
          <div className="relative flex items-center justify-center bg-gradient-to-b from-primary/5 to-transparent p-4">
            <img 
              src={heroImage} 
              alt="API Health Dashboard product preview" 
              className="w-full max-w-5xl object-contain rounded-lg"
            />
            {/* Overlay gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ============================================================
      PERFORMANCE STATS
      ============================================================ */}
      <section className="border-y border-border bg-surface-container-low py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-text-primary md:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-text-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
      FEATURES SECTION (Everything you need)
      ============================================================ */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Everything you need for API stability
          </h2>
          <p className="mt-3 text-text-secondary text-lg">
            Engineered to be the silent guardian of your production traffic.
          </p>
          
          <div className="mt-14 grid grid-cols-1 gap-6 text-left sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES_SECTION.map(({ icon: Icon, title, description }) => (
              <div 
                key={title} 
                className="group rounded-xl border border-border bg-surface-container p-7 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-text-primary">{title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
      REDUCE DOWNTIME SECTION
      ============================================================ */}
      <section className="border-y border-border bg-surface-container-low py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold md:text-4xl">
                Reduce Downtime. <span className="text-primary">Ship with Confidence.</span>
              </h2>
              
              <div className="mt-10 space-y-8">
                {REDUCE_DOWNTIME.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="flex gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-primary">{title}</h4>
                      <p className="mt-1 text-sm text-text-secondary leading-relaxed">{description}</p>
                    </div>
                  </div>
                ))}
                
                <div className="flex gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">Developers First UX</h4>
                    <p className="mt-1 text-sm text-text-secondary leading-relaxed">
                      Provide API-first UX across all endpoints, and transform providers for lightweighting as code.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="rounded-2xl border border-border bg-surface-container p-2 shadow-xl">
                <div className="flex h-[400px] items-center justify-center rounded-xl bg-gradient-to-br from-primary/5 to-primary/10">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-20 w-20 text-primary/30" />
                    <p className="mt-4 text-sm text-text-muted">Live Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
      DOCUMENTATION SECTION (Replaced Pricing)
      ============================================================ */}
      <section id="docs" className="py-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold md:text-4xl">Documentation</h2>
          </div>
          <p className="mt-3 text-text-secondary text-lg max-w-2xl mx-auto">
            Everything you need to integrate, monitor, and scale your infrastructure with API Health Dashboard.
          </p>
          
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {DOCS_SECTIONS.map(({ icon: Icon, title, description, link }) => (
              <a
                key={title}
                href={link}
                className="group rounded-xl border border-border bg-surface-container p-7 text-left hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{description}</p>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="h-4 w-4" />
                </div>
              </a>
            ))}
          </div>

          {/* Quick Links */}
          <div className="mt-12 rounded-xl border border-border bg-surface-container-low p-8">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Links</h3>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <a href="#" className="text-sm text-text-secondary hover:text-primary transition-colors flex items-center gap-2">
                <Code className="h-4 w-4" /> API Reference
              </a>
              <a href="#" className="text-sm text-text-secondary hover:text-primary transition-colors flex items-center gap-2">
                <FileText className="h-4 w-4" /> Getting Started Guide
              </a>
              <a href="#" className="text-sm text-text-secondary hover:text-primary transition-colors flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Troubleshooting
              </a>
              <a href="#" className="text-sm text-text-secondary hover:text-primary transition-colors flex items-center gap-2">
                <Users className="h-4 w-4" /> Community Forum
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
      CTA SECTION
      ============================================================ */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-hover to-primary-dark px-8 py-20 text-center text-on-primary">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          
          <div className="relative">
            <h2 className="text-3xl font-bold md:text-4xl">Start monitoring in minutes.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-on-primary/80 text-lg">
              Join over 10,000 engineering teams who trust API Health Dashboard for their infrastructure visibility.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 font-semibold text-primary hover:bg-white/90 transition-all shadow-xl shadow-black/20 hover:shadow-black/30"
              >
                Get Started for Free <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#docs"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-8 py-3.5 font-semibold text-white hover:bg-white/10 transition-all"
              >
                View Documentation
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
      FOOTER
      ============================================================ */}
      <footer className="border-t border-border bg-surface-container-low py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-hover">
                  <Activity className="h-5 w-5 text-on-primary" />
                </div>
                <span className="text-lg font-bold">API Health</span>
              </div>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                Professional infrastructure monitoring for teams that demand precision and reliability.
              </p>
            </div>
            
            {/* Footer Links */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Product</h4>
              <ul className="mt-4 space-y-2.5">
                {FOOTER_LINKS.PRODUCT.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Company</h4>
              <ul className="mt-4 space-y-2.5">
                {FOOTER_LINKS.COMPANY.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Resources</h4>
              <ul className="mt-4 space-y-2.5">
                {FOOTER_LINKS.RESOURCES.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Legal</h4>
              <ul className="mt-4 space-y-2.5">
                {FOOTER_LINKS.LEGAL.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Footer Bottom */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-text-secondary md:flex-row">
            <p>© {new Date().getFullYear()} API Health Dashboard Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-text-primary transition-colors">
                <Link2 className="h-4 w-4" />
              </a>
              <a href="#" className="hover:text-text-primary transition-colors">
                <AtSign className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}