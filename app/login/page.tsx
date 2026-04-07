"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Building2, KeyRound, ShieldCheck, Users2 } from "lucide-react"
import { useState } from "react"

const roles = [
  { label: "Dealer Principal", scope: "Company-wide dashboards and approvals" },
  { label: "Operations Manager", scope: "Regional stores and performance monitoring" },
  { label: "Store Supervisor", scope: "Store-level ticketing and sales control" },
  { label: "Sales Consultant", scope: "Own sales, commissions, appointments, and queries" },
]

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState(roles[0].label)

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="mtn-panel rounded-[2rem] p-6">
          <span className="mtn-chip">
            <ShieldCheck className="h-3.5 w-3.5" />
            secure staff access
          </span>
          <h1 className="mt-4 font-[var(--font-heading)] text-4xl font-black uppercase leading-none text-white">
            Login to the CRM
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#e4dbab]">
            This is a mock staff portal for Exquisite Cellular. Use the role selector to preview the
            permissions and enter the CRM experience.
          </p>

          <div className="mt-6 grid gap-3">
            {roles.map((role) => (
              <button
                key={role.label}
                type="button"
                onClick={() => setSelectedRole(role.label)}
                className={`focus-ring rounded-2xl border px-4 py-4 text-left transition ${
                  selectedRole === role.label
                    ? "border-[#ffd000] bg-[#ffd000]/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#ffd000]/15 p-3 text-[#ffd000]">
                    {role.label === "Dealer Principal" ? <Building2 className="h-5 w-5" /> : null}
                    {role.label === "Operations Manager" ? <Users2 className="h-5 w-5" /> : null}
                    {role.label === "Store Supervisor" ? <ShieldCheck className="h-5 w-5" /> : null}
                    {role.label === "Sales Consultant" ? <KeyRound className="h-5 w-5" /> : null}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{role.label}</p>
                    <p className="text-sm text-[#d9cf9b]">{role.scope}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/crm")}
              className="mtn-button mtn-button-primary focus-ring"
            >
              Enter CRM as {selectedRole}
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link href="/" className="mtn-button mtn-button-ghost focus-ring">
              Back to home
            </Link>
          </div>
        </section>

        <section className="mtn-card rounded-[2rem] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Staff access</p>
          <h2 className="mt-2 font-[var(--font-heading)] text-3xl font-bold text-white">
            Built around the core business areas
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "Customer monitoring and base growth",
              "Inventory aging and forecasting",
              "Ticketing for complaints and enquiries",
              "Sales KPI and commission dashboards",
              "Attendance, leave, and break logging",
              "Marketing campaigns and device launches",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-[#f3ebc5]">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-[#ffd000]/20 bg-[#111111] p-5">
            <p className="text-sm font-semibold text-white">Access notes</p>
            <p className="mt-2 text-sm leading-6 text-[#d8cf9f]">
              No backend login is connected yet. The CRM is demo-driven so you can preview the workflow immediately.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
