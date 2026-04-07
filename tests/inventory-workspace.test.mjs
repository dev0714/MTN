import test from "node:test"
import assert from "node:assert/strict"
import {
  applyInventoryTransfer,
  buildInventoryReceipt,
  importInventoryCsv,
  loadInventoryWorkspace,
  saveInventoryWorkspace,
} from "../lib/inventory-workspace.mjs"

test("buildInventoryReceipt creates a stock item with computed age and value", () => {
  const item = buildInventoryReceipt(
    {
      sku: "NEW-001",
      productDescription: "Test Phone",
      category: "Handset",
      manufacturer: "Test Brand",
      model: "TB-1",
      location: "Sandton Mall",
      sohQuantity: "4",
      sitQuantity: "2",
      unitValue: "1250",
      dateOfReceipt: "2026-04-01",
    },
    new Date("2026-04-07T00:00:00Z"),
  )

  assert.equal(item.sku, "NEW-001")
  assert.equal(item.sohQuantity, 4)
  assert.equal(item.sitQuantity, 2)
  assert.equal(item.ageDays, 6)
  assert.equal(item.value, 5000)
  assert.equal(item.promo, false)
})

test("applyInventoryTransfer moves stock between locations and clamps to available quantity", () => {
  const result = applyInventoryTransfer(
    [
      {
        sku: "SKU-1",
        productDescription: "Test Phone",
        category: "Handset",
        manufacturer: "Test Brand",
        model: "TB-1",
        location: "Store A",
        sohQuantity: 10,
        sitQuantity: 0,
        dateOfReceipt: "2026-03-01",
        ageDays: 37,
        value: 10000,
        promo: false,
        transferQueued: false,
        rtvQueued: false,
      },
    ],
    {
      sku: "SKU-1",
      fromLocation: "Store A",
      toLocation: "Store B",
      quantity: 6,
    },
  )

  assert.equal(result.items.find((item) => item.location === "Store A")?.sohQuantity, 4)
  assert.equal(result.items.find((item) => item.location === "Store B")?.sohQuantity, 6)
  assert.equal(result.logEntry.label, "Transfer completed")
})

test("importInventoryCsv parses rows and replaces existing SKU/location matches", () => {
  const imported = importInventoryCsv(
    [
      "sku,productDescription,category,manufacturer,model,location,sohQuantity,sitQuantity,dateOfReceipt,unitValue",
      "CSV-1,CSV Phone,Handset,Brand A,A-1,Store A,7,1,2026-03-20,900",
      "CSV-2,CSV Charger,Accessory,Brand B,B-2,Store B,13,4,2026-02-10,50",
    ].join("\n"),
    [],
    new Date("2026-04-07T00:00:00Z"),
  )

  assert.equal(imported.items.length, 2)
  assert.equal(imported.items[0].ageDays, 18)
  assert.equal(imported.items[1].value, 650)
  assert.equal(imported.summary.importedCount, 2)
})

test("loadInventoryWorkspace and saveInventoryWorkspace round-trip state", () => {
  const storage = {
    data: {},
    getItem(key) {
      return this.data[key] ?? null
    },
    setItem(key, value) {
      this.data[key] = String(value)
    },
  }

  saveInventoryWorkspace(storage, {
    thresholdDays: 200,
    safetyBuffer: 1.3,
    inventoryItems: [],
    forecastSeeds: [],
    actionLog: [],
  })

  const loaded = loadInventoryWorkspace(storage)

  assert.equal(loaded.thresholdDays, 200)
  assert.equal(loaded.safetyBuffer, 1.3)
  assert.deepEqual(loaded.inventoryItems, [])
})
