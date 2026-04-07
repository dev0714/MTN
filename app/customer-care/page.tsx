"use client"

import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import { ArrowLeft, CheckCircle2, MessageSquareWarning, PhoneCall, Send, UserRound } from "lucide-react"
import { saveCustomerTicket, loadCustomerTickets } from "@/lib/customer-feedback.js"

const defaultForm = {
  customerFirstName: "",
  customerLastName: "",
  contactNumber: "",
  email: "",
  category: "Complaint",
  store: "Sandton Mall",
  consultant: "Online Channel",
  message: "",
}

export default function CustomerCarePage() {
  const [form, setForm] = useState(defaultForm)
  const [submittedId, setSubmittedId] = useState("")
  const [recentTickets, setRecentTickets] = useState<any[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return
    setRecentTickets(loadCustomerTickets(window.localStorage).slice(0, 6))
  }, [])

  const submitTicket = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const ticket = saveCustomerTicket(typeof window !== "undefined" ? window.localStorage : undefined, {
      ...form,
      source: "Website",
    })
    setSubmittedId(ticket.id)
    if (typeof window !== "undefined") {
      setRecentTickets(loadCustomerTickets(window.localStorage).slice(0, 6))
    }
    setForm(defaultForm)
  }

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6">
        <header className="mtn-panel flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Customer portal</p>
            <h1 className="mt-2 font-[var(--font-heading)] text-3xl font-black text-white">
              Complaints, compliments, suggestions, and enquiries
            </h1>
          </div>
          <Link href="/" className="mtn-button mtn-button-ghost focus-ring">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </header>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <form onSubmit={submitTicket} className="mtn-card rounded-[2rem] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Log a ticket</p>
            <h2 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
              Tell us what happened and we’ll route it to the CRM
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[#f4edcb]">
                First name
                <input
                  value={form.customerFirstName}
                  onChange={(event) => setForm((current) => ({ ...current, customerFirstName: event.target.value }))}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                />
              </label>
              <label className="grid gap-2 text-sm text-[#f4edcb]">
                Last name
                <input
                  value={form.customerLastName}
                  onChange={(event) => setForm((current) => ({ ...current, customerLastName: event.target.value }))}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                />
              </label>
              <label className="grid gap-2 text-sm text-[#f4edcb]">
                Contact number
                <input
                  value={form.contactNumber}
                  onChange={(event) => setForm((current) => ({ ...current, contactNumber: event.target.value }))}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                />
              </label>
              <label className="grid gap-2 text-sm text-[#f4edcb]">
                Email
                <input
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                />
              </label>
              <label className="grid gap-2 text-sm text-[#f4edcb]">
                Category
                <select
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                >
                  <option>Complaint</option>
                  <option>Compliment</option>
                  <option>Suggestion</option>
                  <option>Enquiry</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm text-[#f4edcb]">
                Store / Channel
                <input
                  value={form.store}
                  onChange={(event) => setForm((current) => ({ ...current, store: event.target.value }))}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                />
              </label>
            </div>
            <label className="mt-3 grid gap-2 text-sm text-[#f4edcb]">
              Complaint / feedback
              <textarea
                rows={5}
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                placeholder="Tell us what happened..."
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="submit" className="mtn-button mtn-button-primary focus-ring">
                <Send className="h-4 w-4" />
                Submit to CRM
              </button>
              {submittedId ? (
                <span className="mtn-chip">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Ticket {submittedId} logged
                </span>
              ) : null}
            </div>
          </form>

          <aside className="mtn-card rounded-[2rem] p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">What happens next</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-[#f3ebc5]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                1. The ticket is assigned a unique number.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                2. CRM staff see the ticket in real time under Support.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                3. Response time is colour-coded green, amber, or red.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                4. Resolution and satisfaction feedback can be logged in the CRM.
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-[#ffd000]/20 bg-[#111111] p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#ffd000]/15 p-3 text-[#ffd000]">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-white">Customer care</p>
                  <p className="text-sm text-[#d9cf9b]">Your submission is shared with the CRM queue instantly.</p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <PhoneCall className="h-5 w-5 text-[#ffd000]" />
                <div>
                  <p className="font-semibold text-white">Need help faster?</p>
                  <p className="text-sm text-[#d9cf9b]">Use the store or customer service line and it will still show in CRM.</p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Recent tickets</p>
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white">{ticket.id}</p>
                  <p className="text-sm text-[#d9cf9b]">{ticket.category} · {ticket.fullName}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
