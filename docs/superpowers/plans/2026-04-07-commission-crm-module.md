# Commission CRM Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a functional Commission tab inside the CRM that reconciles IMEI-based commission lines, surfaces claims and risks, and calculates payroll-ready totals from mock data.

**Architecture:** Keep the commission logic isolated in a small helper module and move the UI into a dedicated `CommissionModule` component so the CRM shell stays readable. The module should be stacked vertically at normal desktop widths, with horizontally scrollable tables and live mock state for reconciliation, payroll, and audit actions.

**Tech Stack:** Next.js 14, React 18, Tailwind CSS, `recharts`, Node test runner (`node --test`), Lucide icons.

---

### Task 1: Add commission helper functions and unit tests

**Files:**
- Create: `C:/Users/Admin/Desktop/LeadSync/Compitition/New folder/Websites/MTN/lib/commission-utils.mjs`
- Create: `C:/Users/Admin/Desktop/LeadSync/Compitition/New folder/Websites/MTN/tests/commission-utils.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test"
import assert from "node:assert/strict"
import {
  deriveCommissionStatus,
  calculatePayrollTotal,
  buildClaimsQueue,
} from "../lib/commission-utils.mjs"

test("deriveCommissionStatus marks missing IMEI as unpaid", () => {
  const status = deriveCommissionStatus({ imei: "", omsMatched: false, claimStatus: "Open" })
  assert.equal(status, "Unpaid")
})

test("calculatePayrollTotal excludes unpaid and claim lines", () => {
  const total = calculatePayrollTotal([
    { commissionValue: 1200, status: "Paid" },
    { commissionValue: 900, status: "Unpaid" },
    { commissionValue: 600, status: "Claim" },
  ])
  assert.equal(total, 1200)
})

test("buildClaimsQueue returns unpaid rows in claims order", () => {
  const queue = buildClaimsQueue([
    { imei: "1", consultant: "A", status: "Paid", note: "" },
    { imei: "2", consultant: "B", status: "Unpaid", note: "Missing in MTN report" },
  ])
  assert.equal(queue.length, 1)
  assert.equal(queue[0].imei, "2")
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/commission-utils.test.mjs`
Expected: FAIL because `commission-utils.mjs` does not exist yet.

- [ ] **Step 3: Write the minimal helper implementation**

```js
export function deriveCommissionStatus({ imei, omsMatched, claimStatus }) {
  if (!imei || !omsMatched) return "Unpaid"
  if (claimStatus && claimStatus !== "Closed") return "Claim"
  return "Paid"
}

export function calculatePayrollTotal(lines) {
  return lines
    .filter((line) => line.status === "Paid")
    .reduce((sum, line) => sum + Number(line.commissionValue || 0), 0)
}

export function buildClaimsQueue(lines) {
  return lines.filter((line) => line.status !== "Paid")
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/commission-utils.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/commission-utils.mjs tests/commission-utils.test.mjs
git commit -m "feat: add commission helper utilities"
```

### Task 2: Build the Commission module component

**Files:**
- Create: `C:/Users/Admin/Desktop/LeadSync/Compitition/New folder/Websites/MTN/app/crm/commission-module.tsx`
- Modify: `C:/Users/Admin/Desktop/LeadSync/Compitition/New folder/Websites/MTN/app/crm/page.tsx`

- [ ] **Step 1: Write the failing component render check**

```tsx
import CommissionModule from "../app/crm/commission-module"

export default function CommissionSmoke() {
  return <CommissionModule />
}
```

Expected compile failure at this stage because `commission-module.tsx` does not exist yet.

- [ ] **Step 2: Run the build to verify it fails**

Run: `npm run build`
Expected: FAIL with a module-not-found error for `commission-module.tsx`.

- [ ] **Step 3: Write the minimal module implementation**

```tsx
"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { calculatePayrollTotal, buildClaimsQueue, deriveCommissionStatus } from "@/lib/commission-utils.mjs"

export default function CommissionModule() {
  const [timeframe, setTimeframe] = useState<"MoM" | "QoQ" | "YoY">("MoM")
  const [commissionRules, setCommissionRules] = useState([
    { packageType: "Postpaid", valuePerSale: 1200, clawbackWindowDays: 90, active: true },
    { packageType: "Prepaid", valuePerSale: 180, clawbackWindowDays: 30, active: true },
  ])

  const ledger = useMemo(() => {
    return [
      { imei: "356789012345678", consultant: "Lerato M.", packageType: "Postpaid", customerType: "Consumer", sector: "Consumer", commissionValue: 1200, omsMatched: true, claimStatus: "Closed" },
      { imei: "356789012345679", consultant: "Sibusiso K.", packageType: "Postpaid", customerType: "SME", sector: "Business", commissionValue: 1200, omsMatched: false, claimStatus: "Open" },
    ].map((line) => ({
      ...line,
      status: deriveCommissionStatus(line),
      claimNote: line.omsMatched ? "Matched" : "Missing in OMS",
    }))
  }, [])

  const payrollTotal = calculatePayrollTotal(ledger)
  const claimsQueue = buildClaimsQueue(ledger)

  return (
    <div className="space-y-4">
      <section className="mtn-card rounded-[1.75rem] p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Commission reconciliation</p>
        <h2 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">IMEI matching and unpaid claim tracking</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {["MoM", "QoQ", "YoY"].map((item) => (
            <button key={item} type="button" onClick={() => setTimeframe(item as "MoM" | "QoQ" | "YoY")} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="mtn-card rounded-[1.75rem] p-5">
        <div className="overflow-x-auto rounded-3xl border border-white/10">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-white/5 text-[#ffd000]">
              <tr>
                <th className="px-4 py-3">IMEI</th>
                <th className="px-4 py-3">Consultant</th>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Claim note</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((line) => (
                <tr key={line.imei} className="border-t border-white/10">
                  <td className="px-4 py-3 text-white">{line.imei}</td>
                  <td className="px-4 py-3 text-[#f5f0d1]">{line.consultant}</td>
                  <td className="px-4 py-3 text-[#f5f0d1]">{line.packageType}</td>
                  <td className="px-4 py-3 text-[#f5f0d1]">R {line.commissionValue.toLocaleString("en-ZA")}</td>
                  <td className="px-4 py-3">{line.status}</td>
                  <td className="px-4 py-3 text-[#d9cf9b]">{line.claimNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-[#e9dfb3]">Payroll-ready total: R {payrollTotal.toLocaleString("en-ZA")}</div>
        <div className="mt-2 text-sm text-[#e9dfb3]">Claims queue: {claimsQueue.length} lines</div>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Run the build to verify it passes**

Run: `npm run build`
Expected: PASS with the Commission tab compiling.

- [ ] **Step 5: Commit**

```bash
git add app/crm/commission-module.tsx app/crm/page.tsx
git commit -m "feat: add commission module shell"
```

### Task 3: Wire analytics, risk, and payroll actions into the Commission module

**Files:**
- Modify: `C:/Users/Admin/Desktop/LeadSync/Compitition/New folder/Websites/MTN/app/crm/commission-module.tsx`
- Modify: `C:/Users/Admin/Desktop/LeadSync/Compitition/New folder/Websites/MTN/lib/commission-utils.mjs`
- Create: `C:/Users/Admin/Desktop/LeadSync/Compitition/New folder/Websites/MTN/tests/commission-module.test.mjs`

- [ ] **Step 1: Write the failing helper test for trend summaries and clawbacks**

```js
import test from "node:test"
import assert from "node:assert/strict"
import { summarizeSegments, flagRiskItems } from "../lib/commission-utils.mjs"

test("summarizeSegments groups postpaid and prepaid totals", () => {
  const segments = summarizeSegments([
    { customerType: "Consumer", sector: "Consumer", commissionValue: 1200 },
    { customerType: "SME", sector: "Business", commissionValue: 900 },
  ])
  assert.equal(segments.length, 2)
})

test("flagRiskItems marks unpaid and clawback risk", () => {
  const risks = flagRiskItems([
    { consultant: "A", status: "Paid", deactivationReason: "" },
    { consultant: "B", status: "Unpaid", deactivationReason: "Fraud" },
  ])
  assert.equal(risks.length, 1)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/commission-module.test.mjs`
Expected: FAIL because `summarizeSegments` and `flagRiskItems` do not exist yet.

- [ ] **Step 3: Extend the helpers and module**

```js
export function summarizeSegments(lines) {
  const groups = new Map()
  for (const line of lines) {
    const key = line.sector || line.customerType || "Unknown"
    const current = groups.get(key) ?? { label: key, value: 0 }
    current.value += Number(line.commissionValue || 0)
    groups.set(key, current)
  }
  return [...groups.values()]
}

export function flagRiskItems(lines) {
  return lines
    .filter((line) => line.status !== "Paid" || String(line.deactivationReason || "").length > 0)
    .map((line) => ({
      consultant: line.consultant,
      reason: line.deactivationReason || line.status,
      severity: line.status === "Unpaid" ? "red" : "amber",
      detail: "Back-allocate to original consultant and review in claims.",
    }))
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/commission-utils.test.mjs tests/commission-module.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/crm/commission-module.tsx lib/commission-utils.mjs tests/commission-module.test.mjs
git commit -m "feat: add commission analytics and risk logic"
```

### Task 4: Validate CRM integration and layout on the live app

**Files:**
- Modify: `C:/Users/Admin/Desktop/LeadSync/Compitition/New folder/Websites/MTN/app/crm/page.tsx`
- Modify: `C:/Users/Admin/Desktop/LeadSync/Compitition/New folder/Websites/MTN/app/crm/commission-module.tsx`
- Test: `C:/Users/Admin/Desktop/LeadSync/Compitition/New folder/Websites/MTN/tests/commission-module.test.mjs`

- [ ] **Step 1: Confirm the Commission tab is wired into the CRM shell**

```tsx
case "commission":
  return <CommissionModule />
```

- [ ] **Step 2: Run a production build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Start the local server and confirm the route responds**

Run:

```powershell
npm run start -- -p 3002
Invoke-WebRequest -UseBasicParsing http://localhost:3002/crm
```

Expected: `200 OK`.

- [ ] **Step 4: Confirm the rendered page includes the Commission content**

Run:

```powershell
$html = (Invoke-WebRequest -UseBasicParsing http://localhost:3002/crm).Content
$html -match 'Commission reconciliation'
$html -match 'IMEI matching and unpaid claim tracking'
```

Expected: both checks return `True`.

- [ ] **Step 5: Commit**

```bash
git add app/crm/page.tsx app/crm/commission-module.tsx lib/commission-utils.mjs tests/commission-utils.test.mjs tests/commission-module.test.mjs
git commit -m "feat: wire commission module into crm"
```

## Coverage Check

- Proposal A: covered by Task 1 and Task 2.
- Proposal B: covered by Task 3.
- Proposal C: covered by Task 3.
- Proposal D: covered by Task 3.
- KPI dual-target model: covered by Task 2 and Task 3.
- Business benefits and transparency/audit trail: covered by Task 2, Task 3, and Task 4.

