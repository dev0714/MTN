export const salesRoleOptions = [
  "Dealer Principal",
  "General Manager",
  "Operations Manager",
  "Store Manager",
  "Consultant",
]

export const salesTimeframeOptions = ["Day", "Week", "Month", "Quarter", "Year"]

export const salesCategoryOptions = [
  "All Categories",
  "Consumer",
  "SME",
  "Newlines",
  "Upgrades",
  "Accessories",
  "Connectivity",
  "Prepaid / Cash Phones",
  "Airtime",
  "Starter Packs / Simkits",
  "Momo",
]

export const salesAreaOptions = ["All Areas", "North", "South", "East", "West"]
export const salesStoreOptions = ["All Stores", "Sandton Mall", "Maponya Mall", "Waterfall", "Rosebank", "Eastgate"]
export const salesConsultantOptions = ["All Consultants", "Lerato M.", "Sibusiso K.", "Nandi P.", "Tebogo R.", "Ayesha P."]

export const salesSeedRows = [
  { role: "Dealer Principal", area: "North", store: "Sandton Mall", consultant: "Lerato M.", category: "Newlines", actual: 120000, target: 100000, gp: 36000, units: 42, date: "2026-04-05" },
  { role: "Store Manager", area: "North", store: "Sandton Mall", consultant: "Sibusiso K.", category: "Accessories", actual: 38000, target: 45000, gp: 10200, units: 88, date: "2026-04-05" },
  { role: "Consultant", area: "South", store: "Maponya Mall", consultant: "Tebogo R.", category: "Accessories", actual: 62000, target: 60000, gp: 17400, units: 61, date: "2026-04-05" },
  { role: "Operations Manager", area: "North", store: "Waterfall", consultant: "Nandi P.", category: "Connectivity", actual: 86000, target: 90000, gp: 24000, units: 29, date: "2026-04-11" },
  { role: "Store Manager", area: "West", store: "Rosebank", consultant: "Ayesha P.", category: "Airtime", actual: 49000, target: 52000, gp: 13200, units: 140, date: "2026-04-12" },
  { role: "Consultant", area: "East", store: "Eastgate", consultant: "Lerato M.", category: "Momo", actual: 54000, target: 51000, gp: 15400, units: 73, date: "2026-04-13" },
  { role: "General Manager", area: "North", store: "Sandton Mall", consultant: "Nandi P.", category: "Upgrades", actual: 73000, target: 70000, gp: 20700, units: 23, date: "2026-04-18" },
  { role: "Store Manager", area: "South", store: "Maponya Mall", consultant: "Sibusiso K.", category: "Starter Packs / Simkits", actual: 31000, target: 36000, gp: 8600, units: 111, date: "2026-04-21" },
]

function getWeekLabel(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`)
  return `W${Math.ceil(date.getDate() / 7)}`
}

function getQuarterLabel(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`)
  return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`
}

function getTrendLabel(dateValue, timeframe) {
  const date = new Date(`${dateValue}T00:00:00`)
  if (timeframe === "Day") return date.toLocaleDateString("en-ZA", { weekday: "short" })
  if (timeframe === "Week") return getWeekLabel(dateValue)
  if (timeframe === "Month") return date.toLocaleDateString("en-ZA", { month: "short" })
  if (timeframe === "Quarter") return getQuarterLabel(dateValue)
  return String(date.getFullYear())
}

function getSortKey(dateValue, timeframe) {
  const date = new Date(`${dateValue}T00:00:00`)
  if (timeframe === "Day") return date.getTime()
  if (timeframe === "Week") return date.getFullYear() * 100 + Math.ceil(date.getDate() / 7)
  if (timeframe === "Month") return date.getFullYear() * 100 + date.getMonth()
  if (timeframe === "Quarter") return date.getFullYear() * 10 + Math.floor(date.getMonth() / 3)
  return date.getFullYear()
}

export function getSalesRagTone(achievement) {
  if (achievement >= 80) return "green"
  if (achievement >= 50) return "amber"
  return "red"
}

export function filterSalesRows(rows, filters = {}) {
  const {
    role = "Dealer Principal",
    area = "All Areas",
    store = "All Stores",
    consultant = "All Consultants",
    category = "All Categories",
  } = filters

  return rows.filter((row) => {
    if (category !== "All Categories" && row.category !== category) return false
    if (area !== "All Areas" && row.area !== area) return false
    if (store !== "All Stores" && row.store !== store) return false
    if (consultant !== "All Consultants" && row.consultant !== consultant) return false
    if (role === "Operations Manager" && area !== "All Areas" && row.area !== area) return false
    if (role === "Store Manager" && store !== "All Stores" && row.store !== store) return false
    if (role === "Consultant" && consultant !== "All Consultants" && row.consultant !== consultant) return false
    return true
  })
}

function buildMetric(actual, target) {
  const achievement = target ? Math.round((actual / target) * 100) : 0
  return {
    actual,
    target,
    achievement,
    shortfall: Math.max(target - actual, 0),
    tone: getSalesRagTone(achievement),
  }
}

function sumBy(rows, accessor) {
  return rows.reduce((total, row) => total + accessor(row), 0)
}

function aggregateLeaderboard(rows, keyName) {
  const groups = new Map()
  rows.forEach((row) => {
    const key = row[keyName]
    const current = groups.get(key) ?? { key, actual: 0, target: 0, gp: 0, units: 0 }
    current.actual += row.actual
    current.target += row.target
    current.gp += row.gp
    current.units += row.units
    groups.set(key, current)
  })

  return [...groups.values()]
    .map((item) => {
      const achievement = item.target ? Math.round((item.actual / item.target) * 100) : 0
      return {
        [keyName]: item.key,
        actual: item.actual,
        target: item.target,
        gp: item.gp,
        units: item.units,
        achievement,
        tone: getSalesRagTone(achievement),
      }
    })
    .sort((a, b) => b.achievement - a.achievement || b.actual - a.actual)
}

function aggregateCategoryMix(rows) {
  const groups = new Map()
  rows.forEach((row) => {
    const current = groups.get(row.category) ?? { category: row.category, actual: 0, target: 0 }
    current.actual += row.actual
    current.target += row.target
    groups.set(row.category, current)
  })

  return [...groups.values()]
    .map((item) => {
      const achievement = item.target ? Math.round((item.actual / item.target) * 100) : 0
      return { ...item, achievement, tone: getSalesRagTone(achievement) }
    })
    .sort((a, b) => a.category.localeCompare(b.category))
}

function aggregateTrend(rows, timeframe) {
  const groups = new Map()
  rows.forEach((row) => {
    const label = getTrendLabel(row.date, timeframe)
    const sortKey = getSortKey(row.date, timeframe)
    const current = groups.get(label) ?? { label, sortKey, actual: 0, target: 0, gp: 0 }
    current.actual += row.actual
    current.target += row.target
    current.gp += row.gp
    groups.set(label, current)
  })

  return [...groups.values()]
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((item) => ({
      label: item.label,
      actual: item.actual,
      target: item.target,
      gp: item.gp,
      achievement: item.target ? Math.round((item.actual / item.target) * 100) : 0,
    }))
}

function aggregateMatrix(rows) {
  const groups = new Map()
  rows.forEach((row) => {
    const key = `${row.store}::${row.consultant}`
    const current = groups.get(key) ?? { store: row.store, consultant: row.consultant, actual: 0, target: 0 }
    current.actual += row.actual
    current.target += row.target
    groups.set(key, current)
  })

  return [...groups.values()].map((item) => ({
    ...item,
    achievement: item.target ? Math.round((item.actual / item.target) * 100) : 0,
    tone: getSalesRagTone(item.target ? Math.round((item.actual / item.target) * 100) : 0),
  }))
}

export function buildSalesDashboard(rows, filters = {}) {
  const visibleRows = filterSalesRows(rows, filters)
  const revenueActual = sumBy(visibleRows, (row) => row.actual)
  const revenueTarget = sumBy(visibleRows, (row) => row.target)
  const gpActual = sumBy(visibleRows, (row) => row.gp)
  const unitActual = sumBy(visibleRows, (row) => row.units)

  const metrics = {
    revenue: buildMetric(revenueActual, revenueTarget),
    units: buildMetric(unitActual, Math.max(Math.round(unitActual * 1.08), 1)),
    gp: buildMetric(gpActual, Math.max(Math.round(gpActual * 1.05), 1)),
    forecast: buildMetric(Math.max(Math.round(revenueActual * 1.08), 1), Math.max(Math.round(revenueTarget * 1.02), 1)),
  }

  return {
    rows: visibleRows,
    metrics,
    storeLeaderboard: aggregateLeaderboard(visibleRows, "store"),
    consultantLeaderboard: aggregateLeaderboard(visibleRows, "consultant"),
    categoryMix: aggregateCategoryMix(visibleRows),
    trendSeries: aggregateTrend(visibleRows, filters.timeframe ?? "Month"),
    matrix: aggregateMatrix(visibleRows),
  }
}
