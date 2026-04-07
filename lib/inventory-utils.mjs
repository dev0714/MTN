const AGING_BUCKETS = ["0-30", "31-60", "61-90", "91-120", "120+"]

export function deriveInventoryAgeBand(ageDays) {
  if (!Number.isFinite(ageDays) || ageDays < 0) return "unknown"
  if (ageDays <= 30) return "0-30"
  if (ageDays <= 60) return "31-60"
  if (ageDays <= 90) return "61-90"
  if (ageDays <= 120) return "91-120"
  return "120+"
}

export function deriveInventoryStatus(ageDays, threshold = 180, amberWindow = 60) {
  if (!Number.isFinite(ageDays)) return "unknown"
  if (ageDays > threshold) return "red"
  if (ageDays >= threshold - amberWindow) return "amber"
  return "green"
}

export function calculateForecastRow({
  totalStock = 0,
  averageMonthlySales = 0,
  growthDeclineFactor = 0,
  safetyBuffer = 1.25,
}) {
  const adjustedMonthlyForecast = Math.max(Math.round(averageMonthlySales * (1 + growthDeclineFactor)), 0)
  const quarterlyForecast = Math.max(Math.round(adjustedMonthlyForecast * 3), 0)
  const requiredStock = Math.max(Math.round(quarterlyForecast * safetyBuffer), 0)
  const orderQuantity = Math.max(requiredStock - totalStock, 0)

  return {
    adjustedMonthlyForecast,
    quarterlyForecast,
    requiredStock,
    orderQuantity,
  }
}

export function summarizeInventory(items) {
  const agingBuckets = Object.fromEntries(AGING_BUCKETS.map((bucket) => [bucket, 0]))

  let totalSoh = 0
  let totalSit = 0
  let totalValue = 0
  let atRiskCount = 0
  let obsoleteCount = 0

  for (const item of items) {
    totalSoh += Number(item.sohQuantity) || 0
    totalSit += Number(item.sitQuantity) || 0
    totalValue += Number(item.value) || 0

    if (item.status === "amber" || item.status === "red") {
      atRiskCount += 1
    }

    if (item.status === "red") {
      obsoleteCount += 1
    }

    if (item.ageBand && item.ageBand in agingBuckets) {
      agingBuckets[item.ageBand] += Number(item.value) || 0
    }
  }

  return {
    totalSoh,
    totalSit,
    totalValue,
    atRiskCount,
    obsoleteCount,
    agingBuckets: AGING_BUCKETS.map((bucket) => ({ bucket, value: agingBuckets[bucket] })),
  }
}

export function getInventoryAgingBuckets() {
  return [...AGING_BUCKETS]
}
