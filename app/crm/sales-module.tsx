"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CalendarRange, CheckCircle2, Clock3, Gauge, RefreshCcw, Send, ShieldAlert, Sparkles, UsersRound } from "lucide-react"
import {
  buildSalesDashboard,
  salesAreaOptions,
  salesCategoryOptions,
  salesConsultantOptions,
  salesRoleOptions,
  salesSeedRows,
  salesStoreOptions,
  salesTimeframeOptions,
} from "@/lib/sales-dashboard.mjs"

const WORKSPACE_KEY = "mtn-sales-workspace"

type SalesView = "overview" | "analytics"
type DigestFrequency = "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Annually"
type StoreRow = { store: string; actual: number; target: number; achievement: number; tone: string; gp: number; units: number }
type ConsultantRow = { consultant: string; actual: number; target: number; achievement: number; tone: string; gp: number; units: number }
type MatrixCell = { store: string; consultant: string; actual: number; target: number; achievement: number; tone: string }

function toneClass(tone: string) {
  if (tone === "green") return "rag-green"
  if (tone === "amber") return "rag-amber"
  return "rag-red"
}

function MetricCard({
  label,
  actual,
  target,
  achievement,
  tone,
  detail,
  currency = false,
}: {
  label: string
  actual: number
  target: number
  achievement: number
  tone: string
  detail: string
  currency?: boolean
}) {
  const format = (value: number) =>
    currency ? `R ${(value / 1_000_000 >= 1 ? (value / 1_000_000).toFixed(2) + "m" : value / 1_000 >= 1 ? (value / 1_000).toFixed(0) + "k" : Math.round(value).toLocaleString("en-ZA"))}` : value.toLocaleString("en-ZA")

  return (
    <article className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-[#d9cf9b]">{label}</p>
      <p className="mt-2 font-[var(--font-heading)] text-3xl font-black text-white">{format(actual)}</p>
      <p className="mt-1 text-sm text-[#efe5ba]">Target {format(target)}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass(tone)}`}>Achievement {achievement}%</span>
        <span className="text-xs text-[#cfc69a]">{detail}</span>
      </div>
    </article>
  )
}

export default function SalesModule() {
  const [view, setView] = useState<SalesView>("overview")
  const [role, setRole] = useState("Dealer Principal")
  const [timeframe, setTimeframe] = useState<"Day" | "Week" | "Month" | "Quarter" | "Year">("Month")
  const [category, setCategory] = useState("All Categories")
  const [area, setArea] = useState("All Areas")
  const [store, setStore] = useState("All Stores")
  const [consultant, setConsultant] = useState("All Consultants")
  const [frequency, setFrequency] = useState<DigestFrequency>("Daily")
  const [notes, setNotes] = useState([
    "Dealer Principal dashboard ready for company-wide review.",
    "Daily sales inputs can be synced from the source system or API.",
  ])
  const [noteDraft, setNoteDraft] = useState("")
  const [reportLog, setReportLog] = useState([
    "Daily digest queued for Store Managers.",
    "Weekly summary queued for the Dealer Principal.",
  ])
  const [lastSync, setLastSync] = useState("Today 08:00")

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(WORKSPACE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as {
        view?: SalesView
        role?: string
        timeframe?: "Day" | "Week" | "Month" | "Quarter" | "Year"
        category?: string
        area?: string
        store?: string
        consultant?: string
        frequency?: DigestFrequency
        notes?: string[]
        reportLog?: string[]
        lastSync?: string
      }
      if (saved.view) setView(saved.view)
      if (saved.role) setRole(saved.role)
      if (saved.timeframe) setTimeframe(saved.timeframe)
      if (saved.category) setCategory(saved.category)
      if (saved.area) setArea(saved.area)
      if (saved.store) setStore(saved.store)
      if (saved.consultant) setConsultant(saved.consultant)
      if (saved.frequency) setFrequency(saved.frequency)
      if (saved.notes?.length) setNotes(saved.notes)
      if (saved.reportLog?.length) setReportLog(saved.reportLog)
      if (saved.lastSync) setLastSync(saved.lastSync)
    } catch {
      // Ignore malformed workspace state and fall back to defaults.
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(
      WORKSPACE_KEY,
      JSON.stringify({ view, role, timeframe, category, area, store, consultant, frequency, notes, reportLog, lastSync }),
    )
  }, [view, role, timeframe, category, area, store, consultant, frequency, notes, reportLog, lastSync])

  const dashboard = useMemo(
    () =>
      buildSalesDashboard(salesSeedRows, {
        role,
        timeframe,
        category,
        area,
        store,
        consultant,
      }),
    [role, timeframe, category, area, store, consultant],
  )

  const topStores = dashboard.storeLeaderboard.slice(0, 10) as StoreRow[]
  const topConsultants = dashboard.consultantLeaderboard.slice(0, 10) as ConsultantRow[]
  const matrixCells = dashboard.matrix as MatrixCell[]

  const addReport = (label: string) => {
    setReportLog((current) => [`${label} queued for ${frequency.toLowerCase()} delivery.`, ...current].slice(0, 8))
  }

  const syncDashboard = () => {
    const stamp = new Date().toLocaleString("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
    })
    setLastSync(stamp)
    addReport("API / source system sync")
  }

  const handleAddNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!noteDraft.trim()) return
    setNotes((current) => [noteDraft.trim(), ...current].slice(0, 6))
    setNoteDraft("")
  }

  const resetFilters = () => {
    setRole("Dealer Principal")
    setTimeframe("Month")
    setCategory("All Categories")
    setArea("All Areas")
    setStore("All Stores")
    setConsultant("All Consultants")
    setFrequency("Daily")
    addReport("Filter reset")
  }

  return (
    <div className="space-y-4">
      <section className="mtn-card rounded-[1.75rem] p-5">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Sales KPI command center</p>
            <h2 className="mt-1 font-[var(--font-heading)] text-3xl font-bold text-white">Real-time performance, targets, and GP tracking</h2>
            <p className="mt-2 text-sm leading-6 text-[#e3d8a7]">
              Dynamic sales performance monitoring for company, region, store, and consultant scope.
            </p>
          </div>
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            <button type="button" onClick={() => setView("overview")} className={`rounded-full px-4 py-2 text-sm font-semibold ${view === "overview" ? "bg-[#ffd000] text-black" : "text-white"}`}>
              Overview
            </button>
            <button type="button" onClick={() => setView("analytics")} className={`rounded-full px-4 py-2 text-sm font-semibold ${view === "analytics" ? "bg-[#ffd000] text-black" : "text-white"}`}>
              Analytics View
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          <label className="grid gap-1 text-xs text-[#d9cf9b]">
            Access role
            <select value={role} onChange={(event) => setRole(event.target.value)} className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none">
              {salesRoleOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-[#d9cf9b]">
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none">
              {salesCategoryOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-[#d9cf9b]">
            Area
            <select value={area} onChange={(event) => setArea(event.target.value)} className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none">
              {salesAreaOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-[#d9cf9b]">
            Store
            <select value={store} onChange={(event) => setStore(event.target.value)} className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none">
              {salesStoreOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-col gap-3 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <label className="grid gap-1 text-xs text-[#d9cf9b]">
            Consultant
            <select value={consultant} onChange={(event) => setConsultant(event.target.value)} className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none">
              {salesConsultantOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            {salesTimeframeOptions.map((option) => (
              <button key={option} type="button" onClick={() => setTimeframe(option as typeof timeframe)} className={`rounded-full px-4 py-2 text-sm font-semibold ${timeframe === option ? "bg-[#ffd000] text-black" : "border border-white/10 bg-white/5 text-white"}`}>
                {option}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(["Daily", "Weekly", "Monthly", "Quarterly", "Annually"] as DigestFrequency[]).map((item) => (
              <button key={item} type="button" onClick={() => setFrequency(item)} className={`rounded-full px-4 py-2 text-sm font-semibold ${frequency === item ? "bg-[#ffd000] text-black" : "border border-white/10 bg-white/5 text-white"}`}>
                {item}
              </button>
            ))}
            <button type="button" onClick={resetFilters} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
              Reset filters
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Actual" actual={dashboard.metrics.revenue.actual} target={dashboard.metrics.revenue.target} achievement={dashboard.metrics.revenue.achievement} tone={dashboard.metrics.revenue.tone} detail="Net sales value" currency />
          <MetricCard label="Target" actual={dashboard.metrics.revenue.target} target={dashboard.metrics.revenue.target} achievement={100} tone="amber" detail="Pre-defined goal" currency />
          <MetricCard label="Achievement %" actual={dashboard.metrics.revenue.achievement} target={100} achievement={dashboard.metrics.revenue.achievement} tone={dashboard.metrics.revenue.tone} detail="RAG grading" />
          <MetricCard label="GP Report" actual={dashboard.metrics.gp.actual} target={dashboard.metrics.gp.target} achievement={dashboard.metrics.gp.achievement} tone={dashboard.metrics.gp.tone} detail="Gross profit tracking" currency />
          <MetricCard label="Shortfall View" actual={dashboard.metrics.revenue.shortfall} target={dashboard.metrics.revenue.target} achievement={dashboard.metrics.revenue.achievement} tone={dashboard.metrics.revenue.tone} detail="Gap to target" currency />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Access mode</p>
            <p className="text-sm text-[#e9dfb3]">
              {role} · {timeframe} · {frequency} digest · Last sync {lastSync}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={syncDashboard} className="mtn-button mtn-button-primary focus-ring">
              <RefreshCcw className="h-4 w-4" />
              Sync data
            </button>
            <button type="button" onClick={() => addReport("Daily report")} className="mtn-button mtn-button-ghost focus-ring">
              <Send className="h-4 w-4" />
              Queue report
            </button>
          </div>
        </div>
      </section>

      {view === "overview" ? (
        <section className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
          <article className="mtn-card rounded-[1.75rem] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Performance leaderboard</p>
                <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">Store and consultant ranking</h3>
              </div>
              <span className="mtn-chip">
                <UsersRound className="h-3.5 w-3.5" />
                live rankings
              </span>
            </div>

            <div className="mt-5 space-y-5">
              <div className="overflow-hidden rounded-3xl border border-white/10">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-white/5 text-[#ffd000]">
                    <tr>
                      <th className="px-4 py-3">Store</th>
                      <th className="px-4 py-3">Actual</th>
                      <th className="px-4 py-3">Target</th>
                      <th className="px-4 py-3">Achievement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topStores.map((row) => (
                      <tr key={row.store} className="border-t border-white/10">
                        <td className="px-4 py-3 font-semibold text-white">{row.store}</td>
                        <td className="px-4 py-3 text-[#f5f0d1]">{row.actual.toLocaleString("en-ZA")}</td>
                        <td className="px-4 py-3 text-[#f5f0d1]">{row.target.toLocaleString("en-ZA")}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass(row.tone)}`}>{row.achievement}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-white/5 text-[#ffd000]">
                    <tr>
                      <th className="px-4 py-3">Consultant</th>
                      <th className="px-4 py-3">Lines</th>
                      <th className="px-4 py-3">GP</th>
                      <th className="px-4 py-3">Achievement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topConsultants.map((row) => (
                      <tr key={row.consultant} className="border-t border-white/10">
                        <td className="px-4 py-3 font-semibold text-white">{row.consultant}</td>
                        <td className="px-4 py-3 text-[#f5f0d1]">{row.units.toLocaleString("en-ZA")}</td>
                        <td className="px-4 py-3 text-[#f5f0d1]">R {row.gp.toLocaleString("en-ZA")}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass(row.tone)}`}>{row.achievement}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </article>

          <aside className="space-y-4">
            <section className="mtn-card rounded-[1.75rem] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#ffd000]/15 p-3 text-[#ffd000]">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Role access</p>
                  <h4 className="font-[var(--font-heading)] text-2xl font-bold text-white">{role}</h4>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d9cf9b]">Scope</p>
                  <p className="mt-2 font-semibold text-white">{store !== "All Stores" ? store : area !== "All Areas" ? area : "Company wide"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d9cf9b]">Category</p>
                  <p className="mt-2 font-semibold text-white">{category}</p>
                </div>
              </div>
            </section>

            <section className="mtn-card rounded-[1.75rem] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#ffd000]/15 p-3 text-[#ffd000]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Collaboration notes</p>
                  <h4 className="font-[var(--font-heading)] text-2xl font-bold text-white">Manager commentary</h4>
                </div>
              </div>

              <form onSubmit={handleAddNote} className="mt-4 space-y-3">
                <textarea
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  rows={4}
                  className="focus-ring w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                  placeholder="Add a coaching note, performance context, or follow-up action."
                />
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="mtn-button mtn-button-primary focus-ring">
                    <CheckCircle2 className="h-4 w-4" />
                    Save note
                  </button>
                  <button type="button" onClick={() => setNotes([])} className="mtn-button mtn-button-ghost focus-ring">
                    Clear notes
                  </button>
                </div>
              </form>

              <div className="mt-4 space-y-2">
                {notes.map((item, index) => (
                  <div key={`${index}-${item}`} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-[#f1e8c0]">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="mtn-card rounded-[1.75rem] p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#ffd000]/15 p-3 text-[#ffd000]">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Automation</p>
                  <h4 className="font-[var(--font-heading)] text-2xl font-bold text-white">Report queue</h4>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => addReport("Daily digest")} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
                  Daily digest
                </button>
                <button type="button" onClick={() => addReport("Weekly summary")} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
                  Weekly summary
                </button>
                <button type="button" onClick={() => addReport("Month-end pack")} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
                  Month-end pack
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {reportLog.map((item, index) => (
                  <div key={`${index}-${item}`} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-[#f1e8c0]">
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      ) : (
        <section className="grid gap-4">
          <article className="mtn-card rounded-[1.75rem] p-5">
            <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-end 2xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Analytics View</p>
                <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">Trend analysis and hierarchy matrix</h3>
                <p className="mt-2 text-sm leading-6 text-[#e9dfb3]">
                  Compare actual sales, target sales, and GP across the selected timeframe with real RAG coloring.
                </p>
              </div>
              <span className="mtn-chip">
                <Gauge className="h-3.5 w-3.5" />
                {timeframe} comparison
              </span>
            </div>

            <div className="mt-5 grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffd000]">Trend Line Graph</h4>
                <div className="mt-3 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboard.trendSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="label" stroke="#c8bb85" />
                      <YAxis stroke="#c8bb85" />
                      <Tooltip contentStyle={{ background: "#111111", border: "1px solid rgba(255,201,0,0.2)" }} />
                      <Legend />
                      <Line type="monotone" dataKey="actual" stroke="#ffd000" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="target" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffd000]">Category Stacked Bar Chart</h4>
                <div className="mt-3 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard.categoryMix}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="category" stroke="#c8bb85" interval={0} angle={-20} textAnchor="end" height={70} />
                      <YAxis stroke="#c8bb85" />
                      <Tooltip contentStyle={{ background: "#111111", border: "1px solid rgba(255,201,0,0.2)" }} />
                      <Legend />
                      <Bar dataKey="actual" fill="#ffd000" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="target" fill="#4d4d4d" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </article>

          <article className="mtn-card rounded-[1.75rem] p-5">
            <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffd000]">Heat Map / Matrix View</h4>
            <p className="mt-2 text-sm leading-6 text-[#e9dfb3]">
              Store vs consultant performance matrix with RAG-colored achievement cells.
            </p>
            <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
              <div className="grid min-w-[760px] grid-cols-[1.2fr_repeat(4,minmax(0,1fr))] bg-white/5 text-xs uppercase tracking-[0.2em] text-[#ffd000]">
                <div className="px-3 py-3">Store / Consultant</div>
                {topConsultants.slice(0, 4).map((row) => (
                  <div key={row.consultant} className="px-3 py-3">
                    {row.consultant}
                  </div>
                ))}
              </div>
              <div className="divide-y divide-white/10">
                {topStores.slice(0, 4).map((storeRow) => (
                  <div key={storeRow.store} className="grid min-w-[760px] grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
                    <div className="px-3 py-4 font-semibold text-white">{storeRow.store}</div>
                    {matrixCells
                      .filter((cell) => cell.store === storeRow.store)
                      .slice(0, 4)
                      .map((cell) => (
                        <div key={`${cell.store}-${cell.consultant}`} className="px-2 py-2">
                          <div className={`rounded-2xl px-3 py-3 text-center text-sm font-semibold ${toneClass(cell.tone)}`}>{cell.achievement}%</div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </article>
        </section>
      )}
    </div>
  )
}
