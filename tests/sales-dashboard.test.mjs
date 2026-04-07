import test from "node:test"
import assert from "node:assert/strict"

import { buildSalesDashboard, filterSalesRows, getSalesRagTone } from "../lib/sales-dashboard.mjs"

const rows = [
  { role: "Dealer Principal", area: "North", store: "Sandton Mall", consultant: "Lerato M.", category: "Newlines", actual: 120000, target: 100000, gp: 36000, units: 42, date: "2026-04-05" },
  { role: "Store Manager", area: "North", store: "Sandton Mall", consultant: "Sibusiso K.", category: "Accessories", actual: 38000, target: 45000, gp: 10200, units: 88, date: "2026-04-05" },
  { role: "Consultant", area: "South", store: "Maponya Mall", consultant: "Tebogo R.", category: "Accessories", actual: 62000, target: 60000, gp: 17400, units: 61, date: "2026-04-05" },
]

test("filters sales rows by role, store, and category", () => {
  const filtered = filterSalesRows(rows, { role: "Store Manager", store: "Sandton Mall", category: "Accessories" })
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].consultant, "Sibusiso K.")
})

test("builds sales dashboard metrics and rankings", () => {
  const dashboard = buildSalesDashboard(rows, { role: "Company", store: "All Stores", consultant: "All Consultants", category: "All Categories" })

  assert.equal(dashboard.metrics.revenue.actual, 220000)
  assert.equal(dashboard.metrics.revenue.target, 205000)
  assert.equal(dashboard.metrics.revenue.achievement, 107)
  assert.equal(dashboard.metrics.revenue.tone, "green")
  assert.equal(dashboard.metrics.gp.actual, 63600)
  assert.equal(dashboard.metrics.gp.shortfall, 3180)
  assert.equal(dashboard.storeLeaderboard[0].store, "Sandton Mall")
  assert.equal(dashboard.consultantLeaderboard[0].consultant, "Lerato M.")
  assert.equal(dashboard.categoryMix[0].category, "Accessories")
})

test("classifies rag tone from achievement", () => {
  assert.equal(getSalesRagTone(45), "red")
  assert.equal(getSalesRagTone(79), "amber")
  assert.equal(getSalesRagTone(80), "green")
})
