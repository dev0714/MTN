"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowRightLeft,
  BadgeCheck,
  ClipboardList,
  PlusCircle,
  PackageSearch,
  Upload,
  X,
} from "lucide-react"
import {
  calculateForecastRow,
  deriveInventoryAgeBand,
  deriveInventoryStatus,
  summarizeInventory,
} from "@/lib/inventory-utils.mjs"
import {
  applyInventoryTransfer,
  buildInventoryReceipt,
  createDefaultInventoryWorkspace,
  importInventoryCsv,
  loadInventoryWorkspace,
  saveInventoryWorkspace,
} from "@/lib/inventory-workspace.mjs"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type InventoryItem = {
  sku: string
  productDescription: string
  category: string
  manufacturer: string
  model: string
  location: string
  sohQuantity: number
  sitQuantity: number
  dateOfReceipt: string
  ageDays: number
  value: number
  promo: boolean
  transferQueued: boolean
  rtvQueued: boolean
}

type ForecastSeed = {
  sku: string
  productDescription: string
  supersedingSku: string
  consolidatedSoh: number
  consolidatedSit: number
  averageMonthlySales: number
  growthDeclineFactor: number
}

type ReceiptDraft = {
  sku: string
  productDescription: string
  category: string
  manufacturer: string
  model: string
  location: string
  sohQuantity: string
  sitQuantity: string
  unitValue: string
  dateOfReceipt: string
}

type TransferDraft = {
  sku: string
  fromLocation: string
  toLocation: string
  quantity: string
}

const inventoryStorageSeed = createDefaultInventoryWorkspace()

const initialInventoryItems: InventoryItem[] = [
  {
    sku: "IP16P-256-BLK",
    productDescription: "Apple iPhone 16 Pro 256GB - Black",
    category: "Handset",
    manufacturer: "Apple",
    model: "iPhone 16 Pro",
    location: "Sandton Mall",
    sohQuantity: 18,
    sitQuantity: 11,
    dateOfReceipt: "2026-02-08",
    ageDays: 58,
    value: 364000,
    promo: false,
    transferQueued: false,
    rtvQueued: false,
  },
  {
    sku: "SGS26-512-GRY",
    productDescription: "Samsung Galaxy S26 512GB - Graphite",
    category: "Handset",
    manufacturer: "Samsung",
    model: "Galaxy S26",
    location: "Waterfall",
    sohQuantity: 24,
    sitQuantity: 5,
    dateOfReceipt: "2025-11-10",
    ageDays: 148,
    value: 418000,
    promo: false,
    transferQueued: false,
    rtvQueued: false,
  },
  {
    sku: "TAB-S10FE-SLV",
    productDescription: "Galaxy Tab S10 FE 256GB - Silver",
    category: "Tablet",
    manufacturer: "Samsung",
    model: "Tab S10 FE",
    location: "Rosebank",
    sohQuantity: 13,
    sitQuantity: 4,
    dateOfReceipt: "2025-09-02",
    ageDays: 217,
    value: 189000,
    promo: false,
    transferQueued: false,
    rtvQueued: false,
  },
  {
    sku: "ROUT-4GLTE",
    productDescription: "Fixed LTE Router - Dual Band",
    category: "IoT Device",
    manufacturer: "Huawei",
    model: "LTE-4G",
    location: "Eastgate",
    sohQuantity: 26,
    sitQuantity: 9,
    dateOfReceipt: "2025-10-18",
    ageDays: 173,
    value: 93000,
    promo: false,
    transferQueued: false,
    rtvQueued: false,
  },
  {
    sku: "ACC-CHRG-20W",
    productDescription: "20W Fast Charger",
    category: "Accessory",
    manufacturer: "Generic",
    model: "20W",
    location: "Sandton Mall",
    sohQuantity: 143,
    sitQuantity: 80,
    dateOfReceipt: "2025-06-28",
    ageDays: 285,
    value: 74000,
    promo: false,
    transferQueued: false,
    rtvQueued: false,
  },
  {
    sku: "LAP-X1-14",
    productDescription: "Lenovo X1 14in Business Laptop",
    category: "Laptop",
    manufacturer: "Lenovo",
    model: "X1 14",
    location: "Head Office",
    sohQuantity: 8,
    sitQuantity: 2,
    dateOfReceipt: "2025-12-07",
    ageDays: 111,
    value: 254000,
    promo: false,
    transferQueued: false,
    rtvQueued: false,
  },
]

const initialForecastRows: ForecastSeed[] = [
  {
    sku: "IP16P-256-BLK",
    productDescription: "Apple iPhone 16 Pro 256GB - Black",
    supersedingSku: "",
    consolidatedSoh: 36,
    consolidatedSit: 12,
    averageMonthlySales: 42,
    growthDeclineFactor: 0.12,
  },
  {
    sku: "SGS26-512-GRY",
    productDescription: "Samsung Galaxy S26 512GB - Graphite",
    supersedingSku: "",
    consolidatedSoh: 30,
    consolidatedSit: 8,
    averageMonthlySales: 35,
    growthDeclineFactor: 0.08,
  },
  {
    sku: "TAB-S10FE-SLV",
    productDescription: "Galaxy Tab S10 FE 256GB - Silver",
    supersedingSku: "TAB-S9FE-SLV",
    consolidatedSoh: 17,
    consolidatedSit: 3,
    averageMonthlySales: 18,
    growthDeclineFactor: 0.05,
  },
  {
    sku: "ROUT-4GLTE",
    productDescription: "Fixed LTE Router - Dual Band",
    supersedingSku: "",
    consolidatedSoh: 35,
    consolidatedSit: 11,
    averageMonthlySales: 14,
    growthDeclineFactor: -0.1,
  },
  {
    sku: "ACC-CHRG-20W",
    productDescription: "20W Fast Charger",
    supersedingSku: "",
    consolidatedSoh: 143,
    consolidatedSit: 80,
    averageMonthlySales: 240,
    growthDeclineFactor: 0,
  },
]

const actionStyles = {
  green: "rag-green",
  amber: "rag-amber",
  red: "rag-red",
} as const

const defaultReceiptDraft: ReceiptDraft = {
  sku: "",
  productDescription: "",
  category: "Handset",
  manufacturer: "",
  model: "",
  location: "Sandton Mall",
  sohQuantity: "1",
  sitQuantity: "0",
  unitValue: "0",
  dateOfReceipt: new Date().toISOString().slice(0, 10),
}

const defaultTransferDraft: TransferDraft = {
  sku: "",
  fromLocation: "Sandton Mall",
  toLocation: "Waterfall",
  quantity: "1",
}

const csvTemplate = `sku,productDescription,category,manufacturer,model,location,sohQuantity,sitQuantity,dateOfReceipt,unitValue
CSV-001,Sample Device,Handset,Sample Brand,SB-1,Sandton Mall,6,2,2026-04-01,1200
CSV-002,Sample Accessory,Accessory,Sample Brand,ACC-1,Waterfall,18,5,2026-03-20,150`

const initialActionLog = [
  {
    id: "ACT-1001",
    sku: "ACC-CHRG-20W",
    label: "RTV review queued",
    detail: "Accessory stock is aged and should be cleared before replenishment.",
    tone: "red" as const,
  },
]

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function InventoryStatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  icon: typeof PackageSearch
}) {
  return (
    <article className="mtn-card rounded-[1.5rem] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#d9cf9b]">{label}</p>
          <p className="mt-2 font-[var(--font-heading)] text-3xl font-black text-white">{value}</p>
        </div>
        <div className="rounded-2xl bg-[#ffd000]/15 p-3 text-[#ffd000]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm text-[#e6ddb0]">{detail}</p>
    </article>
  )
}

export default function InventoryModule() {
  const [thresholdDays, setThresholdDays] = useState(inventoryStorageSeed.thresholdDays)
  const [selectedStore, setSelectedStore] = useState("All stores")
  const [selectedCategory, setSelectedCategory] = useState("All categories")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [safetyBuffer, setSafetyBuffer] = useState(inventoryStorageSeed.safetyBuffer)
  const [inventoryItems, setInventoryItems] = useState(initialInventoryItems)
  const [forecastSeeds, setForecastSeeds] = useState(initialForecastRows)
  const [actionLog, setActionLog] = useState<
    Array<{ id: string; sku: string; label: string; detail: string; tone: "green" | "amber" | "red" }>
  >(initialActionLog)
  const [receiptDraft, setReceiptDraft] = useState<ReceiptDraft>(defaultReceiptDraft)
  const [transferDraft, setTransferDraft] = useState<TransferDraft>(defaultTransferDraft)
  const [csvDraft, setCsvDraft] = useState(csvTemplate)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const workspace = loadInventoryWorkspace(window.localStorage, inventoryStorageSeed)
    setThresholdDays(workspace.thresholdDays)
    setSafetyBuffer(workspace.safetyBuffer)
    setInventoryItems(workspace.inventoryItems.length ? workspace.inventoryItems : initialInventoryItems)
    setForecastSeeds(workspace.forecastSeeds.length ? workspace.forecastSeeds : initialForecastRows)
    setActionLog(workspace.actionLog.length ? workspace.actionLog : initialActionLog)
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return
    saveInventoryWorkspace(window.localStorage, {
      thresholdDays,
      safetyBuffer,
      inventoryItems,
      forecastSeeds,
      actionLog,
    })
  }, [hydrated, thresholdDays, safetyBuffer, inventoryItems, forecastSeeds, actionLog])

  const inventoryView = useMemo(() => {
    return inventoryItems
      .map((item) => {
        const status = deriveInventoryStatus(item.ageDays, thresholdDays)
        return {
          ...item,
          ageBand: deriveInventoryAgeBand(item.ageDays),
          status,
        }
      })
      .filter((item) => {
        const storeMatch = selectedStore === "All stores" || item.location === selectedStore
        const categoryMatch = selectedCategory === "All categories" || item.category === selectedCategory
        const statusMatch = selectedStatus === "All" || item.status === selectedStatus
        return storeMatch && categoryMatch && statusMatch
      })
  }, [inventoryItems, thresholdDays, selectedStore, selectedCategory, selectedStatus])

  const summary = useMemo(() => summarizeInventory(inventoryView), [inventoryView])

  const obsoleteSkuSet = useMemo(() => {
    return new Set(
      inventoryItems
        .map((item) => ({
          sku: item.sku,
          status: deriveInventoryStatus(item.ageDays, thresholdDays),
        }))
        .filter((item) => item.status === "red")
        .map((item) => item.sku),
    )
  }, [inventoryItems, thresholdDays])

  const forecastRows = useMemo(() => {
    return forecastSeeds.map((row) => ({
      ...row,
      ...calculateForecastRow({
        totalStock: row.consolidatedSoh + row.consolidatedSit,
        averageMonthlySales: row.averageMonthlySales,
        growthDeclineFactor: row.growthDeclineFactor,
        safetyBuffer,
      }),
      obsoleteStockFlag: obsoleteSkuSet.has(row.sku) ? "YES" : "NO",
    }))
  }, [forecastSeeds, safetyBuffer, obsoleteSkuSet])

  const stores = useMemo(() => {
    return ["All stores", ...new Set(inventoryItems.map((item) => item.location))]
  }, [inventoryItems])

  const categories = useMemo(() => {
    return ["All categories", ...new Set(inventoryItems.map((item) => item.category))]
  }, [inventoryItems])

  const rotationSuggestions = useMemo(() => {
    return inventoryView
      .filter((item) => item.status !== "green")
      .slice(0, 4)
      .map((item) => ({
        sku: item.sku,
        location: item.location,
        action: item.status === "red" ? "RTV or promotion" : "Transfer to high-selling store",
        tone: item.status as "amber" | "red",
      }))
  }, [inventoryView])

  const updateInventoryItem = (sku: string, updater: (item: InventoryItem) => InventoryItem) => {
    setInventoryItems((current) => current.map((item) => (item.sku === sku ? updater(item) : item)))
  }

  const pushAction = (sku: string, label: string, detail: string, tone: "green" | "amber" | "red") => {
    setActionLog((current) => [
      { id: `ACT-${String(current.length + 1001).padStart(4, "0")}`, sku, label, detail, tone },
      ...current,
    ])
  }

  const queueTransfer = (sku: string) => {
    const item = inventoryItems.find((entry) => entry.sku === sku)
    if (!item) return
    updateInventoryItem(sku, (current) => ({ ...current, transferQueued: true }))
    pushAction(sku, "Transfer queued", `Prepare stock movement from ${item.location} to a higher-selling branch.`, "amber")
  }

  const flagPromotion = (sku: string) => {
    const item = inventoryItems.find((entry) => entry.sku === sku)
    if (!item) return
    updateInventoryItem(sku, (current) => ({ ...current, promo: true }))
    pushAction(sku, "Promotion applied", `Bundle or promotional pricing activated for ${item.productDescription}.`, "green")
  }

  const flagRTV = (sku: string) => {
    const item = inventoryItems.find((entry) => entry.sku === sku)
    if (!item) return
    updateInventoryItem(sku, (current) => ({ ...current, rtvQueued: true }))
    pushAction(sku, "RTV flagged", `Return-to-vendor review started for ${item.productDescription}.`, "red")
  }

  const changeGrowth = (sku: string, rawValue: string) => {
    const parsed = Number(rawValue)
    const normalized = Number.isFinite(parsed) ? parsed / 100 : 0
    setForecastSeeds((current) =>
      current.map((row) => (row.sku === sku ? { ...row, growthDeclineFactor: normalized } : row)),
    )
  }

  const changeSafetyBuffer = (rawValue: string) => {
    const parsed = Number(rawValue)
    if (Number.isFinite(parsed) && parsed >= 1) {
      setSafetyBuffer(parsed)
    }
  }

  const submitReceipt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!receiptDraft.sku.trim() || !receiptDraft.productDescription.trim()) return

    const item = buildInventoryReceipt(receiptDraft, new Date())
    setInventoryItems((current) => [
      ...current.filter((existing) => !(existing.sku === item.sku && existing.location === item.location)),
      item,
    ])
    setActionLog((current) => [
      {
        id: `ACT-${String(current.length + 1001).padStart(4, "0")}`,
        sku: item.sku,
        label: "Stock receipted",
        detail: `${item.sohQuantity} units added at ${item.location}.`,
        tone: "green",
      },
      ...current,
    ])
    setReceiptDraft({
      ...defaultReceiptDraft,
      location: receiptDraft.location,
      dateOfReceipt: new Date().toISOString().slice(0, 10),
    })
  }

  const submitTransfer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = applyInventoryTransfer(
      inventoryItems,
      {
        sku: transferDraft.sku,
        fromLocation: transferDraft.fromLocation,
        toLocation: transferDraft.toLocation,
        quantity: transferDraft.quantity,
      },
      new Date(),
    )
    setInventoryItems(result.items)
    setActionLog((current) => [
      {
        sku: result.logEntry.sku,
        label: result.logEntry.label,
        detail: result.logEntry.detail,
        tone: "amber",
        id: `ACT-${String(current.length + 1001).padStart(4, "0")}`,
      },
      ...current,
    ])
    setIsTransferOpen(false)
  }

  const submitImport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = importInventoryCsv(csvDraft, inventoryItems, new Date())
    setInventoryItems(result.items)
    setActionLog((current) => [
      {
        id: `ACT-${String(current.length + 1001).padStart(4, "0")}`,
        sku: "CSV",
        label: "Inventory import complete",
        detail: `${result.summary.importedCount} rows imported from CSV paste.`,
        tone: "green",
      },
      ...current,
    ])
  }

  return (
    <>
    <div className="space-y-4">
      <section className="min-w-0 space-y-4">
        <div className="mtn-card rounded-[1.75rem] p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Inventory command center</p>
              <h2 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                Integrated inventory management and forecasting
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#e2d8a7]">
                Track stock age, forecast demand, queue transfers, and clear obsolete items before new orders are released.
              </p>
            </div>
            <span className="mtn-chip">
              <ClipboardList className="h-3.5 w-3.5" />
              safety buffer {formatPercent(safetyBuffer - 1)}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            <InventoryStatCard
              label="Total SOH"
              value={String(summary.totalSoh)}
              detail="Combined stock on hand across the filtered view."
              icon={PackageSearch}
            />
            <InventoryStatCard
              label="Total SIT"
              value={String(summary.totalSit)}
              detail="Stock in transit waiting to be receipted."
              icon={ArrowRightLeft}
            />
            <InventoryStatCard
              label="At-risk stock"
              value={String(summary.atRiskCount)}
              detail="Amber and red items that need action."
              icon={AlertTriangle}
            />
            <InventoryStatCard
              label="Obsolete stock"
              value={String(summary.obsoleteCount)}
              detail={`Red-zone items above ${thresholdDays} days.`}
              icon={BadgeCheck}
            />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="mtn-card rounded-[1.75rem] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#ffd000]/15 p-3 text-[#ffd000]">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Manual receipt entry</p>
                <h3 className="font-[var(--font-heading)] text-2xl font-bold text-white">Receive new stock</h3>
              </div>
            </div>

            <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={submitReceipt}>
              <label className="grid gap-1 text-xs text-[#d9cf9b]">
                SKU
                <input
                  value={receiptDraft.sku}
                  onChange={(event) => setReceiptDraft((current) => ({ ...current, sku: event.target.value }))}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                  placeholder="SKU-001"
                />
              </label>
              <label className="grid gap-1 text-xs text-[#d9cf9b]">
                Product description
                <input
                  value={receiptDraft.productDescription}
                  onChange={(event) =>
                    setReceiptDraft((current) => ({ ...current, productDescription: event.target.value }))
                  }
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                  placeholder="Apple iPhone 16 Pro 256GB - Blue"
                />
              </label>
              <label className="grid gap-1 text-xs text-[#d9cf9b]">
                Category
                <select
                  value={receiptDraft.category}
                  onChange={(event) => setReceiptDraft((current) => ({ ...current, category: event.target.value }))}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                >
                  <option>Handset</option>
                  <option>Tablet</option>
                  <option>Laptop</option>
                  <option>Accessory</option>
                  <option>IoT Device</option>
                  <option>Router</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs text-[#d9cf9b]">
                Location
                <select
                  value={receiptDraft.location}
                  onChange={(event) => setReceiptDraft((current) => ({ ...current, location: event.target.value }))}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                >
                  {stores.filter((store) => store !== "All stores").map((store) => (
                    <option key={store}>{store}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-[#d9cf9b]">
                SOH quantity
                <input
                  type="number"
                  min="0"
                  value={receiptDraft.sohQuantity}
                  onChange={(event) => setReceiptDraft((current) => ({ ...current, sohQuantity: event.target.value }))}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="grid gap-1 text-xs text-[#d9cf9b]">
                SIT quantity
                <input
                  type="number"
                  min="0"
                  value={receiptDraft.sitQuantity}
                  onChange={(event) => setReceiptDraft((current) => ({ ...current, sitQuantity: event.target.value }))}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="grid gap-1 text-xs text-[#d9cf9b]">
                Manufacturer
                <input
                  value={receiptDraft.manufacturer}
                  onChange={(event) => setReceiptDraft((current) => ({ ...current, manufacturer: event.target.value }))}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                  placeholder="Samsung"
                />
              </label>
              <label className="grid gap-1 text-xs text-[#d9cf9b]">
                Model
                <input
                  value={receiptDraft.model}
                  onChange={(event) => setReceiptDraft((current) => ({ ...current, model: event.target.value }))}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                  placeholder="Galaxy S26"
                />
              </label>
              <label className="grid gap-1 text-xs text-[#d9cf9b]">
                Receipt date
                <input
                  type="date"
                  value={receiptDraft.dateOfReceipt}
                  onChange={(event) =>
                    setReceiptDraft((current) => ({ ...current, dateOfReceipt: event.target.value }))
                  }
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <label className="grid gap-1 text-xs text-[#d9cf9b]">
                Unit value
                <input
                  type="number"
                  min="0"
                  value={receiptDraft.unitValue}
                  onChange={(event) => setReceiptDraft((current) => ({ ...current, unitValue: event.target.value }))}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
              <div className="sm:col-span-2 mt-1 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="focus-ring rounded-full bg-[#ffd000] px-4 py-2 text-sm font-bold text-black transition hover:brightness-95"
                >
                  Post receipt
                </button>
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(true)}
                  className="focus-ring rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Open transfer modal
                </button>
              </div>
            </form>
          </div>

          <div className="mtn-card rounded-[1.75rem] p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#ffd000]/15 p-3 text-[#ffd000]">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">CSV upload mockup</p>
                <h3 className="font-[var(--font-heading)] text-2xl font-bold text-white">Paste inventory file</h3>
              </div>
            </div>

            <form className="mt-5 space-y-3" onSubmit={submitImport}>
              <p className="text-sm leading-6 text-[#e6ddb0]">
                Paste CSV rows directly here to simulate a master inventory import. The data will merge into the live
                inventory workspace and remain after reloads.
              </p>
              <textarea
                value={csvDraft}
                onChange={(event) => setCsvDraft(event.target.value)}
                rows={10}
                className="focus-ring w-full rounded-3xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="focus-ring rounded-full bg-[#ffd000] px-4 py-2 text-sm font-bold text-black transition hover:brightness-95"
                >
                  Import pasted CSV
                </button>
                <button
                  type="button"
                  onClick={() => setCsvDraft(csvTemplate)}
                  className="focus-ring rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Reset template
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mtn-card rounded-[1.75rem] p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Aging breakdown</p>
              <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                Stock age distribution by value
              </h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
              <label className="grid gap-1 text-xs text-[#d9cf9b]">
                Store
                <select
                  value={selectedStore}
                  onChange={(event) => setSelectedStore(event.target.value)}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                >
                  {stores.map((store) => (
                    <option key={store}>{store}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-[#d9cf9b]">
                Category
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-[#d9cf9b]">
                Status
                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                >
                  <option>All</option>
                  <option>green</option>
                  <option>amber</option>
                  <option>red</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs text-[#d9cf9b]">
                Obsolescence days
                <input
                  type="number"
                  min="30"
                  value={thresholdDays}
                  onChange={(event) => setThresholdDays(Number(event.target.value) || 180)}
                  className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.agingBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="bucket" stroke="#c8bb85" />
                <YAxis stroke="#c8bb85" />
                <Tooltip contentStyle={{ background: "#111111", border: "1px solid rgba(255,201,0,0.2)" }} />
                <Bar dataKey="value" fill="#ffd000" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mtn-card rounded-[1.75rem] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Master inventory report</p>
              <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                Weekly stock register and aging control
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rag-green rounded-full px-3 py-1 text-xs font-semibold">Green stock</span>
              <span className="rag-amber rounded-full px-3 py-1 text-xs font-semibold">At risk</span>
              <span className="rag-red rounded-full px-3 py-1 text-xs font-semibold">Obsolete</span>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-3xl border border-white/10">
            <table className="min-w-[1120px] w-full text-left text-sm">
              <thead className="bg-white/5 text-[#ffd000]">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">SOH</th>
                  <th className="px-4 py-3">SIT</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventoryView.length ? (
                  inventoryView.map((item) => (
                    <tr key={item.sku} className="border-t border-white/10">
                      <td className="px-4 py-3 font-semibold text-white">{item.sku}</td>
                      <td className="px-4 py-3 text-[#ece4bc]">{item.productDescription}</td>
                      <td className="px-4 py-3 text-[#ece4bc]">{item.location}</td>
                      <td className="px-4 py-3 text-[#f5f0d1]">{item.sohQuantity}</td>
                      <td className="px-4 py-3 text-[#f5f0d1]">{item.sitQuantity}</td>
                      <td className="px-4 py-3 text-[#f5f0d1]">
                        {item.ageDays} days
                        <div className="text-xs uppercase tracking-[0.2em] text-[#d9cf9b]">{item.ageBand}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === "green"
                              ? actionStyles.green
                              : item.status === "amber"
                                ? actionStyles.amber
                                : actionStyles.red
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[#d9cf9b]">
                          {item.promo ? <span>Promo</span> : null}
                          {item.transferQueued ? <span>Transfer queued</span> : null}
                          {item.rtvQueued ? <span>RTV queued</span> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => flagPromotion(item.sku)}
                            className="focus-ring rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white hover:bg-white/10"
                          >
                            Promo
                          </button>
                          <button
                            type="button"
                            onClick={() => queueTransfer(item.sku)}
                            className="focus-ring rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white hover:bg-white/10"
                          >
                            Rotate
                          </button>
                          <button
                            type="button"
                            onClick={() => flagRTV(item.sku)}
                            className="focus-ring rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white hover:bg-white/10"
                          >
                            RTV
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm text-[#d9cf9b]" colSpan={8}>
                      No inventory items match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <aside className="min-w-0 space-y-4">
        <div className="mtn-card rounded-[1.75rem] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Forecast worksheet</p>
              <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                Quarterly order planning
              </h3>
            </div>
            <div className="rounded-2xl bg-[#ffd000]/15 px-3 py-2 text-sm font-semibold text-[#ffd000]">
              {formatPercent(safetyBuffer - 1)} safety
            </div>
          </div>

          <label className="mt-4 grid gap-2 text-sm text-[#f4edcb]">
            Safety buffer multiplier
            <input
              type="number"
              min="1"
              step="0.05"
              value={safetyBuffer}
              onChange={(event) => changeSafetyBuffer(event.target.value)}
              className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
            />
          </label>

          <div className="mt-4 overflow-x-auto rounded-3xl border border-white/10">
            <table className="min-w-[860px] w-full text-left text-sm">
              <thead className="bg-white/5 text-[#ffd000]">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Growth</th>
                  <th className="px-4 py-3">Quarterly</th>
                  <th className="px-4 py-3">Order</th>
                </tr>
              </thead>
              <tbody>
                {forecastRows.map((row) => (
                  <tr key={row.sku} className="border-t border-white/10 align-top">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{row.sku}</p>
                      <p className="text-xs text-[#d9cf9b]">{row.productDescription}</p>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.05"
                        value={Math.round(row.growthDeclineFactor * 100)}
                        onChange={(event) => changeGrowth(row.sku, event.target.value)}
                        className="focus-ring w-20 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
                      />
                      <p className="mt-1 text-xs text-[#d9cf9b]">growth / decline %</p>
                    </td>
                    <td className="px-4 py-3 text-[#f5f0d1]">
                      <p>{row.quarterlyForecast}</p>
                      <p className="text-xs text-[#d9cf9b]">
                        adjusted {row.adjustedMonthlyForecast} / month
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#f5f0d1]">{row.orderQuantity}</p>
                      <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        row.obsoleteStockFlag === "YES" ? "rag-red" : "rag-green"
                      }`}>
                        obsolete {row.obsoleteStockFlag}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mtn-card rounded-[1.75rem] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#ffd000]/15 p-3 text-[#ffd000]">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Rotation actions</p>
              <h3 className="font-[var(--font-heading)] text-2xl font-bold text-white">FIFO and transfer queue</h3>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {rotationSuggestions.map((item) => (
              <div key={item.sku} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{item.sku}</p>
                    <p className="text-sm text-[#d9cf9b]">{item.location}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${actionStyles[item.tone]}`}>
                    {item.action}
                  </span>
                </div>
              </div>
            ))}
            {!rotationSuggestions.length ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[#f3ebc5]">
                No amber or red stock in the current filter set.
              </div>
            ) : null}
          </div>
        </div>

        <div className="mtn-card rounded-[1.75rem] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Action log</p>
          <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
            Latest inventory changes
          </h3>
          <div className="mt-4 space-y-3">
            {actionLog.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{entry.label}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${actionStyles[entry.tone]}`}>
                    {entry.sku}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#e5dca8]">{entry.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
    {isTransferOpen ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
        <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-[#101010] p-6 shadow-2xl shadow-black/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Inter-store transfer</p>
              <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                Move stock between branches
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsTransferOpen(false)}
              className="focus-ring rounded-full border border-white/10 bg-white/5 p-2 text-white transition hover:bg-white/10"
              aria-label="Close transfer modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={submitTransfer}>
            <label className="grid gap-1 text-xs text-[#d9cf9b]">
              SKU
              <input
                value={transferDraft.sku}
                onChange={(event) => setTransferDraft((current) => ({ ...current, sku: event.target.value }))}
                className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                placeholder="IP16P-256-BLK"
              />
            </label>
            <label className="grid gap-1 text-xs text-[#d9cf9b]">
              Quantity
              <input
                type="number"
                min="1"
                value={transferDraft.quantity}
                onChange={(event) => setTransferDraft((current) => ({ ...current, quantity: event.target.value }))}
                className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
              />
            </label>
            <label className="grid gap-1 text-xs text-[#d9cf9b]">
              From store
              <select
                value={transferDraft.fromLocation}
                onChange={(event) => setTransferDraft((current) => ({ ...current, fromLocation: event.target.value }))}
                className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
              >
                {stores.filter((store) => store !== "All stores").map((store) => (
                  <option key={store}>{store}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-[#d9cf9b]">
              To store
              <select
                value={transferDraft.toLocation}
                onChange={(event) => setTransferDraft((current) => ({ ...current, toLocation: event.target.value }))}
                className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
              >
                {stores.filter((store) => store !== "All stores").map((store) => (
                  <option key={store}>{store}</option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2 flex flex-wrap gap-3 pt-1">
              <button
                type="submit"
                className="focus-ring rounded-full bg-[#ffd000] px-4 py-2 text-sm font-bold text-black transition hover:brightness-95"
              >
                Confirm transfer
              </button>
              <button
                type="button"
                onClick={() => setIsTransferOpen(false)}
                className="focus-ring rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null}
    </>
  )
}
