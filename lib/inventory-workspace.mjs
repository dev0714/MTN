const STORAGE_KEY = "mtn-inventory-workspace"

const DEFAULT_WORKSPACE = {
  thresholdDays: 180,
  safetyBuffer: 1.25,
  inventoryItems: [],
  forecastSeeds: [],
  actionLog: [],
}

function clampNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function diffDays(dateOfReceipt, referenceDate) {
  const receipt = new Date(`${dateOfReceipt}T00:00:00Z`)
  const base = new Date(referenceDate)
  const ms = base.getTime() - receipt.getTime()
  return Math.max(Math.round(ms / 86400000), 0)
}

function uniqueByLocationAndSku(items) {
  const map = new Map()
  for (const item of items) {
    map.set(`${item.sku}::${item.location}`, item)
  }
  return [...map.values()]
}

export function createDefaultInventoryWorkspace() {
  return structuredClone(DEFAULT_WORKSPACE)
}

export function loadInventoryWorkspace(storage, fallback = DEFAULT_WORKSPACE) {
  if (!storage) return structuredClone(fallback)
  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) return structuredClone(fallback)

  try {
    const parsed = JSON.parse(raw)
    return {
      thresholdDays: clampNumber(parsed.thresholdDays, fallback.thresholdDays),
      safetyBuffer: clampNumber(parsed.safetyBuffer, fallback.safetyBuffer),
      inventoryItems: Array.isArray(parsed.inventoryItems) ? parsed.inventoryItems : structuredClone(fallback.inventoryItems),
      forecastSeeds: Array.isArray(parsed.forecastSeeds) ? parsed.forecastSeeds : structuredClone(fallback.forecastSeeds),
      actionLog: Array.isArray(parsed.actionLog) ? parsed.actionLog : structuredClone(fallback.actionLog),
    }
  } catch {
    return structuredClone(fallback)
  }
}

export function saveInventoryWorkspace(storage, workspace) {
  if (!storage) return workspace
  storage.setItem(STORAGE_KEY, JSON.stringify(workspace))
  return workspace
}

export function buildInventoryReceipt(input, referenceDate = new Date()) {
  const sohQuantity = Math.max(Math.trunc(clampNumber(input.sohQuantity, 0)), 0)
  const sitQuantity = Math.max(Math.trunc(clampNumber(input.sitQuantity, 0)), 0)
  const unitValue = Math.max(clampNumber(input.unitValue, 0), 0)
  const dateOfReceipt = input.dateOfReceipt || new Date(referenceDate).toISOString().slice(0, 10)

  return {
    sku: String(input.sku || "").trim(),
    productDescription: String(input.productDescription || "").trim(),
    category: String(input.category || "Accessory"),
    manufacturer: String(input.manufacturer || "Unknown"),
    model: String(input.model || ""),
    location: String(input.location || "Head Office"),
    sohQuantity,
    sitQuantity,
    dateOfReceipt,
    ageDays: diffDays(dateOfReceipt, referenceDate),
    value: sohQuantity * unitValue,
    promo: false,
    transferQueued: false,
    rtvQueued: false,
  }
}

export function applyInventoryTransfer(items, transfer, referenceDate = new Date()) {
  const quantity = Math.max(Math.trunc(clampNumber(transfer.quantity, 0)), 0)
  const sourceIndex = items.findIndex((item) => item.sku === transfer.sku && item.location === transfer.fromLocation)
  if (sourceIndex < 0 || quantity <= 0) {
    return {
      items,
      logEntry: {
        id: "ACT-0000",
        sku: transfer.sku,
        label: "Transfer skipped",
        detail: "Source item not found or quantity invalid.",
        tone: "amber",
      },
    }
  }

  const source = items[sourceIndex]
  const movable = Math.min(quantity, source.sohQuantity)
  const unitValue = source.sohQuantity > 0 ? source.value / source.sohQuantity : 0
  const updatedSource = {
    ...source,
    sohQuantity: source.sohQuantity - movable,
    value: Math.max(source.value - unitValue * movable, 0),
  }

  const existingDestinationIndex = items.findIndex(
    (item) => item.sku === transfer.sku && item.location === transfer.toLocation,
  )

  const nextItems = items.slice()
  nextItems[sourceIndex] = updatedSource

  if (existingDestinationIndex >= 0) {
    const destination = nextItems[existingDestinationIndex]
    nextItems[existingDestinationIndex] = {
      ...destination,
      sohQuantity: destination.sohQuantity + movable,
      value: destination.value + unitValue * movable,
      transferQueued: true,
    }
  } else {
    nextItems.push({
      ...source,
      location: transfer.toLocation,
      sohQuantity: movable,
      value: unitValue * movable,
      transferQueued: true,
      rtvQueued: false,
      promo: false,
      ageDays: diffDays(source.dateOfReceipt, referenceDate),
    })
  }

  return {
    items: uniqueByLocationAndSku(nextItems),
    logEntry: {
      id: "ACT-0001",
      sku: transfer.sku,
      label: "Transfer completed",
      detail: `${movable} units moved from ${transfer.fromLocation} to ${transfer.toLocation}.`,
      tone: "amber",
    },
  }
}

function parseCsvRow(header, row, referenceDate) {
  const columns = row.split(",").map((value) => value.trim())
  const data = Object.fromEntries(header.map((key, index) => [key, columns[index] ?? ""]))
  return buildInventoryReceipt(
    {
      sku: data.sku,
      productDescription: data.productDescription,
      category: data.category,
      manufacturer: data.manufacturer,
      model: data.model,
      location: data.location,
      sohQuantity: data.sohQuantity,
      sitQuantity: data.sitQuantity,
      dateOfReceipt: data.dateOfReceipt,
      unitValue: data.unitValue,
    },
    referenceDate,
  )
}

export function importInventoryCsv(csvText, existingItems = [], referenceDate = new Date()) {
  const rows = String(csvText)
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)

  if (!rows.length) {
    return { items: existingItems, summary: { importedCount: 0 } }
  }

  const header = rows.shift().split(",").map((value) => value.trim())
  const imported = rows.map((row) => parseCsvRow(header, row, referenceDate))
  const merged = uniqueByLocationAndSku([...existingItems.filter((item) => !imported.some((row) => row.sku === item.sku && row.location === item.location)), ...imported])

  return {
    items: merged,
    summary: { importedCount: imported.length },
  }
}
