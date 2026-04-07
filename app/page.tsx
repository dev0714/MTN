"use client"

import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Gem,
  LayoutDashboard,
  MessageSquare,
  PackageSearch,
  QrCode,
  ScanSearch,
  Smartphone,
  Sparkles,
  Store,
  Ticket,
} from "lucide-react"

const promos = [
  "Monthly Yellow Trader pings to all users",
  "Weekly and bi-weekly specials",
  "New device launch alerts",
  "QR downloads at tills, windows, and social media",
]

const homeModules = [
  {
    icon: LayoutDashboard,
    title: "Dealer Principal Dashboard",
    text: "Company, region, area, store, consultant, category, and date filters with real-time KPI tiles.",
  },
  {
    icon: Ticket,
    title: "Customer Ticketing",
    text: "Complaints, compliments, suggestions, and enquiries with response timing, escalation, and resolution tracking.",
  },
  {
    icon: PackageSearch,
    title: "Inventory & Forecasting",
    text: "Stock aging, FIFO rotation, inter-branch transfers, quarterly ordering, and obsolete stock flags.",
  },
  {
    icon: ClipboardList,
    title: "Time Tracker",
    text: "Clock in/out, tea and lunch breaks, leave types, approvals, and roster visibility for every role.",
  },
]

const featureCards = [
  {
    title: "Customer acquisition",
    text: "New lines, upgrades, add-ons, prepaid, SME, and device booking journeys with mock funnel data.",
  },
  {
    title: "Commission intelligence",
    text: "Actual vs target reporting, package-level performance, and clawback risk indicators.",
  },
  {
    title: "Marketing engine",
    text: "Competition entries, store activations, vouchers, launches, social posting, and app download campaigns.",
  },
]

export default function HomePage() {
  return (
    <main className="px-4 py-5 text-[#f8f1d2] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6">
        <header className="mtn-panel flex flex-col gap-4 rounded-[1.75rem] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffd000] text-[#111111] shadow-glow">
              <Gem className="h-6 w-6" />
            </div>
            <div>
              <p className="font-[var(--font-heading)] text-xl font-bold tracking-wide text-white">
                Exquisite Cellular
              </p>
              <p className="text-sm text-[#e5dca8]">
                Enterprise Management System built in bold retail style
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="mtn-chip">
              <Sparkles className="h-3.5 w-3.5" />
              Demo data enabled
            </span>
            <Link className="mtn-button mtn-button-ghost focus-ring" href="/login">
              Staff Login
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link className="mtn-button mtn-button-primary focus-ring" href="/crm">
              Open CRM
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link className="mtn-button mtn-button-ghost focus-ring" href="/customer-care">
              Customer Care
              <Ticket className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="mtn-panel relative overflow-hidden rounded-[2rem] p-6 lg:p-8">
            <div className="absolute inset-0 bg-mtn-grid opacity-15" />
            <div className="absolute right-0 top-0 h-64 w-64 animate-float rounded-full bg-[#ffd000]/20 blur-3xl" />
            <div className="relative z-10 max-w-3xl">
              <span className="mtn-chip mb-4">
                <BellRing className="h-3.5 w-3.5" />
                always-on campaign engine
              </span>
              <h1 className="max-w-3xl font-[var(--font-heading)] text-4xl font-black uppercase leading-none text-white sm:text-5xl lg:text-7xl">
                Retail energy on the front end.
                <span className="block text-[#ffd000]">CRM control on the inside.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#f0e7bc] sm:text-lg">
                A branded Exquisite Cellular website and operational CRM inspired by a bold retail visual
                language, built around customer tickets, marketing tools, inventory forecasting, attendance,
                sales tracking, commission reporting, and executive dashboards.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/login" className="mtn-button mtn-button-primary focus-ring">
                  Enter Staff Portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/crm" className="mtn-button mtn-button-ghost focus-ring">
                  View CRM Preview
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {promos.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <CheckCircle2 className="mb-3 h-5 w-5 text-[#ffd000]" />
                    <p className="text-sm leading-6 text-[#fbf5db]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mtn-panel rounded-[2rem] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Staff access</p>
                <h2 className="mt-2 font-[var(--font-heading)] text-2xl font-bold text-white">
                  Login preview
                </h2>
              </div>
              <div className="rounded-2xl bg-[#ffd000] px-3 py-2 text-sm font-black text-[#111111]">
                CRM LIVE
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {[
                "Dealer Principal",
                "Operations Manager",
                "Store Supervisor",
                "Sales Consultant",
                "SME Consultant",
              ].map((role, index) => (
                <div
                  key={role}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-white">{role}</p>
                    <p className="text-sm text-[#d8cf9f]">Role-based CRM filters and permissions</p>
                  </div>
                  <span className="rounded-full bg-[#ffd000]/15 px-3 py-1 text-xs font-semibold text-[#ffd000]">
                    {index === 0 ? "Company" : index === 1 ? "Regional" : index === 2 ? "Store" : "Staff"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-3xl border border-[#ffd000]/20 bg-[#111111] p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#ffd000]/15 p-3 text-[#ffd000]">
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-white">QR and app download push</p>
                  <p className="text-sm text-[#d9cf9b]">Till points, windows, mall activations, and social channels</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {featureCards.map((item) => (
            <article key={item.title} className="mtn-card rounded-[1.75rem] p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffd000]/15 text-[#ffd000]">
                {item.title === "Customer acquisition" ? <Smartphone className="h-5 w-5" /> : null}
                {item.title === "Commission intelligence" ? <BadgeCheck className="h-5 w-5" /> : null}
                {item.title === "Marketing engine" ? <MessageSquare className="h-5 w-5" /> : null}
              </div>
              <h3 className="mt-4 font-[var(--font-heading)] text-xl font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#e3d9a5]">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="mtn-panel rounded-[2rem] p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">CRM blueprint</p>
              <h2 className="mt-2 font-[var(--font-heading)] text-3xl font-bold text-white">
                Product features built for store teams and management
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-[#d9cf9b]">
              The CRM brings together customer lifecycle logging, inventory forecasting, commissions,
              marketing tools, attendance, sales dashboards, appointments, and support tickets in one
              place.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {homeModules.map((module) => (
              <article key={module.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <module.icon className="h-5 w-5 text-[#ffd000]" />
                <h3 className="mt-4 font-semibold text-white">{module.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#e1d7a5]">{module.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="mtn-card rounded-[2rem] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Customer entry point</p>
            <h2 className="mt-2 font-[var(--font-heading)] text-3xl font-bold text-white">
              Customers can submit complaints, compliments, suggestions, and enquiries
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#e4dbab]">
              Each submission is logged as a ticket and shared with the CRM so the store team can manage it in real time.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/customer-care" className="mtn-button mtn-button-primary focus-ring">
                Open customer care form
              </Link>
              <Link href="/crm" className="mtn-button mtn-button-ghost focus-ring">
                View CRM support queue
              </Link>
            </div>
          </article>

          <article className="mtn-card rounded-[2rem] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Supported ticket types</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {["Complaints", "Compliments", "Suggestions", "Enquiries"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[#f3ebc5]">
                  {item}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="mtn-card rounded-[2rem] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#ffd000]/15 p-3 text-[#ffd000]">
                <ScanSearch className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-[#ffd000]">Core features</p>
                <h3 className="font-[var(--font-heading)] text-2xl font-bold text-white">Everything the platform can do</h3>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                "Complaints, compliments, suggestions, and enquiries",
                "Store details, areas, SABC codes, trading times",
                "Attendance states: present, absent, leave, awol, training",
                "Customer orders, appointments, and device reservations",
                "Base monitoring, deactivations, fraud indicators, and commissions",
                "Sales categories: SME, consumer, prepaid, accessories, fibre, Momo, airtime",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-[#f2ebc6]">
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="mtn-card rounded-[2rem] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#ffd000]/15 p-3 text-[#ffd000]">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-[#ffd000]">Retail feel</p>
                <h3 className="font-[var(--font-heading)] text-2xl font-bold text-white">Bold retail style, distinctly Exquisite</h3>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {[
                "Bold yellow and black visual system",
                "Promo-led homepage with product tiles",
                "Operational dashboard with live-looking mock data",
                "Staff login entry point into the CRM",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#ffd000]" />
                  <p className="text-sm text-[#f4edcb]">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

      </div>
    </main>
  )
}
