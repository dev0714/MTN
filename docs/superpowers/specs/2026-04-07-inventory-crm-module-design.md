# Inventory CRM Module Design

## Overview

Add a functional **Inventory** tab inside the existing CRM for Exquisite Cellular. The module should turn the inventory workflow write-up into an interactive mock system with editable tables, calculated fields, status badges, and summary charts. It must stay inside the current CRM shell so it feels like one unified platform.

## Goals

- Show master stock visibility across stores and head office.
- Track stock aging and obsolescence with RAG-style indicators.
- Support FIFO stock rotation and inter-branch transfer actions.
- Provide a quarterly forecast and order worksheet with live calculations.
- Keep the experience mock-data driven but functional in the browser.

## Non-Goals

- No live ERP, POS, or procurement API integration in this phase.
- No spreadsheet export/import beyond mock UI controls.
- No backend persistence beyond the current client-side mock state pattern.
- No complex approval workflow engine.

## User Experience

The Inventory tab will be one of the main CRM modules alongside Overview, Sales, Customers, Marketing, Support, Commission, and Ops.

The page will be split into three working areas:

1. **Inventory Dashboard**
   - Summary KPI cards for total stock value, aging risk, reorder pressure, and obsolete stock.
   - A stock table showing SKU, description, category, location, SOH, SIT, receipt date, age in days, and status.
   - Filters for store, category, aging bucket, and stock condition.
   - Visual charting for aging buckets and stock pressure.

2. **Forecast & Order Worksheet**
   - Spreadsheet-style order planning table.
   - Editable growth/decline factor per SKU.
   - Calculated values for adjusted forecast, quarterly forecast, required stock, and final order quantity.
   - Obsolete stock flag shown per row.

3. **Stock Rotation & Actions**
   - FIFO prioritization notes.
   - Suggested transfers between stores.
   - At-risk stock highlighting.
   - Buttons for mock actions such as mark for promotion, move to transfer queue, and flag for RTV.

## Data Model

Use client-side mock data shaped around the following concepts:

- `InventoryItem`
  - `sku`
  - `productDescription`
  - `category`
  - `manufacturer`
  - `model`
  - `location`
  - `sohQuantity`
  - `sitQuantity`
  - `dateOfReceipt`
  - `ageDays`
  - `obsolescenceThreshold`
  - `status`

- `ForecastRow`
  - `sku`
  - `productDescription`
  - `supersedingSku`
  - `consolidatedSoh`
  - `consolidatedSit`
  - `totalStock`
  - `averageMonthlySales`
  - `growthDeclineFactor`
  - `adjustedMonthlyForecast`
  - `quarterlyForecast`
  - `requiredStock`
  - `orderQuantity`
  - `obsoleteStockFlag`

- `RotationAction`
  - `sku`
  - `fromLocation`
  - `toLocation`
  - `reason`
  - `priority`

These data structures can live in the CRM page module or a small shared helper if that keeps the code cleaner.

## Functional Behavior

### Inventory dashboard

- Age is calculated from `dateOfReceipt`.
- Rows with age above the threshold are marked red.
- Rows approaching the threshold are marked amber.
- Healthy rows are marked green.
- The table can be filtered by store, category, and condition.
- KPI cards are derived from the filtered rows.

### Forecast worksheet

- `adjustedMonthlyForecast = averageMonthlySales * (1 + growthDeclineFactor)`
- `quarterlyForecast = adjustedMonthlyForecast * 3`
- `requiredStock = quarterlyForecast * safetyBuffer`
- `orderQuantity = max(requiredStock - totalStock, 0)`
- `obsoleteStockFlag = YES` when any related stock is in the red zone.

Safety buffer will be shown as a configurable mock value, defaulting to 1.25.

### Stock rotation

- FIFO guidance is shown in the interface.
- The module lists store-to-store transfer suggestions for aged stock.
- Buttons update local mock state to simulate:
  - promote stock
  - move to transfer queue
  - flag for RTV
  - mark as cleared

## UI Structure

- CRM sidebar gains an `Inventory` tab.
- The tab opens with:
  - KPI row
  - stock aging chart
  - master inventory table
  - forecast worksheet
  - action panel
- Keep the visual language aligned with the rest of the MTN-inspired CRM:
  - black and yellow palette
  - glassy cards
  - bold headings
  - dense operational tables

## Error Handling

- If no inventory data exists, show a clear empty state with a call to seed mock items.
- If a calculated field receives invalid numeric input, fall back to `0` and show a subtle inline warning.
- If a row is missing a receipt date, mark it as `Unknown age` and exclude it from aging calculations.

## Testing Strategy

- Add utility coverage for:
  - aging bucket assignment
  - RAG status derivation
  - order quantity calculation
  - obsolete flag logic
- Add a browser-level check that the Inventory tab renders and shows at least one inventory row.
- Verify that edits to growth factor update the forecast calculations live.

## Implementation Notes

- Reuse the existing CRM shell and stateful mock patterns already used by other tabs.
- Keep inventory logic isolated in small helpers if the formulas become noisy.
- Avoid introducing backend dependencies at this stage.
- Prefer readable formulas over premature abstraction.

## Acceptance Criteria

- The CRM has a visible `Inventory` tab.
- The tab includes a working stock dashboard, forecast worksheet, and rotation/actions section.
- Inventory rows display real calculations from mock data.
- Users can change growth factors and see order quantities update.
- The page remains styled and scrollable in the current CRM layout.
