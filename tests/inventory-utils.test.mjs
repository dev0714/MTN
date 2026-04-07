import test from "node:test"
import assert from "node:assert/strict"
import {
  calculateForecastRow,
  deriveInventoryAgeBand,
  deriveInventoryStatus,
  summarizeInventory,
} from "../lib/inventory-utils.mjs"

test("deriveInventoryAgeBand buckets stock ages into the expected aging ranges", () => {
  assert.equal(deriveInventoryAgeBand(12), "0-30")
  assert.equal(deriveInventoryAgeBand(48), "31-60")
  assert.equal(deriveInventoryAgeBand(77), "61-90")
  assert.equal(deriveInventoryAgeBand(118), "91-120")
  assert.equal(deriveInventoryAgeBand(180), "120+")
})

test("deriveInventoryStatus marks aged stock as green amber or red", () => {
  assert.equal(deriveInventoryStatus(22, 180), "green")
  assert.equal(deriveInventoryStatus(145, 180), "amber")
  assert.equal(deriveInventoryStatus(181, 180), "red")
})

test("calculateForecastRow applies growth safety stock and order floor logic", () => {
  const row = calculateForecastRow({
    totalStock: 260,
    averageMonthlySales: 100,
    growthDeclineFactor: 0.1,
    safetyBuffer: 1.25,
  })

  assert.equal(row.adjustedMonthlyForecast, 110)
  assert.equal(row.quarterlyForecast, 330)
  assert.equal(row.requiredStock, 413)
  assert.equal(row.orderQuantity, 153)
})

test("summarizeInventory totals stock counts and risk buckets", () => {
  const summary = summarizeInventory([
    { status: "green", sohQuantity: 8, sitQuantity: 2, value: 1000, ageBand: "0-30" },
    { status: "amber", sohQuantity: 4, sitQuantity: 1, value: 2500, ageBand: "91-120" },
    { status: "red", sohQuantity: 2, sitQuantity: 3, value: 1800, ageBand: "120+" },
  ])

  assert.equal(summary.totalSoh, 14)
  assert.equal(summary.totalSit, 6)
  assert.equal(summary.totalValue, 5300)
  assert.equal(summary.atRiskCount, 2)
  assert.equal(summary.obsoleteCount, 1)
})
