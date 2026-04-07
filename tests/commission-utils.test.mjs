import test from "node:test"
import assert from "node:assert/strict"
import {
  deriveCommissionStatus,
  calculatePayrollTotal,
  buildClaimsQueue,
  summarizeSegments,
  flagRiskItems,
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

test("buildClaimsQueue returns unpaid rows in original order", () => {
  const queue = buildClaimsQueue([
    { imei: "1", consultant: "A", status: "Paid", note: "" },
    { imei: "2", consultant: "B", status: "Unpaid", note: "Missing in MTN report" },
    { imei: "3", consultant: "C", status: "Claim", note: "Under review" },
  ])
  assert.equal(queue.length, 2)
  assert.equal(queue[0].imei, "2")
  assert.equal(queue[1].imei, "3")
})

test("summarizeSegments groups segment totals", () => {
  const segments = summarizeSegments([
    { sector: "Consumer", customerType: "Consumer", commissionValue: 1200 },
    { sector: "Business", customerType: "SME", commissionValue: 900 },
  ])
  assert.deepEqual(segments, [
    { label: "Consumer", value: 1200 },
    { label: "Business", value: 900 },
  ])
})

test("flagRiskItems surfaces unpaid and clawback-risk rows", () => {
  const risks = flagRiskItems([
    { consultant: "A", status: "Paid", deactivationReason: "", imei: "1", omsMatched: true, claimStatus: "Closed" },
    { consultant: "B", status: "Unpaid", deactivationReason: "", imei: "2", omsMatched: false, claimStatus: "Open" },
    { consultant: "C", status: "Paid", deactivationReason: "Fraud", imei: "3", omsMatched: true, claimStatus: "Closed" },
  ])
  assert.equal(risks.length, 2)
  assert.equal(risks[0].reason, "Unpaid")
  assert.equal(risks[1].reason, "Fraud")
})
