# Commission CRM Module Design

## Overview

Add a functional **Commission** tab inside the existing CRM for Exquisite Cellular. The module should turn the commission reconciliation proposal into an interactive mock system with IMEI matching, claims tracking, trend analytics, payroll-ready calculations, and risk controls. It must stay inside the current CRM shell so it feels like one unified platform.

## Goals

- Reconcile MTN commission lines against OMS records by IMEI.
- Flag paid, unpaid, and claim lines with clear RAG styling.
- Show visibility into unpaid claims and exception handling.
- Provide commission analytics across time, segment, and package type.
- Calculate payroll-ready commission totals for paid lines only.
- Track clawbacks and deactivations back to the originating consultant.

## Non-Goals

- No live MTN commission API integration in this phase.
- No payroll system integration beyond a mock export/summary panel.
- No email delivery service or real SMTP integration.
- No backend persistence beyond the current browser-based mock state pattern.
- No complex finance approval workflow engine.

## User Experience

The Commission tab will sit alongside Overview, Sales, Customers, Inventory, Workforce, Marketing, Support, and Ops.

The page will be split into five working areas:

1. **Reconciliation & IMEI Matching**
   - A master reconciliation table listing IMEI, consultant, package type, sector, commission amount, status, and claim notes.
   - Status badges for `Paid`, `Unpaid`, and `Claim`.
   - A mock import/paste area for MTN commission report rows.
   - Exception visibility for unpaid lines.
   - Action buttons to flag a line for claims review or mark it as reconciled.

2. **Analytics & Trends**
   - KPI cards for total activations, total commission value, unpaid lines, paid lines, and clawbacks.
   - Trend charts for MoM, QoQ, and YoY.
   - Segmented views for:
     - Postpaid vs Prepaid
     - Consumer vs SME
     - Product category performance
   - Seasonality indicators to show peak and quiet periods.

3. **Payroll & Commission Logic**
   - Commission rules panel where the Dealer Principal can define mock commission values.
   - Payroll-ready summary of paid lines.
   - Calculation outputs for salary/commission totals.
   - A mock “send to payroll” action that captures the final approved summary in the activity log.

4. **Risk Mitigation & Sales Accountability**
   - Deactivation and clawback view.
   - Consultant risk flags for:
     - fraud-related deactivations
     - unpaid lines
     - unusually high clawback rates
   - A package optimization section showing quantity vs Rand value by package type.

5. **Claims & Audit Trail**
   - Claims queue for unpaid or disputed lines.
   - Audit log of reconciliation actions.
   - Mock email/exception notification preview for Accounts and Dealer Principal.

## Data Model

Use client-side mock data shaped around the following concepts:

- `CommissionLine`
  - `imei`
  - `consultant`
  - `packageType`
  - `customerType`
  - `sector`
  - `commissionValue`
  - `status`
  - `claimStatus`
  - `claimNote`
  - `deactivationReason`
  - `deactivatedAt`
  - `sourceSystem`

- `CommissionRule`
  - `packageType`
  - `valuePerSale`
  - `clawbackWindowDays`
  - `sector`
  - `active`

- `TrendPoint`
  - `label`
  - `actual`
  - `target`

- `SegmentSummary`
  - `label`
  - `value`
  - `target`

- `RiskItem`
  - `consultant`
  - `reason`
  - `severity`
  - `detail`

- `ClaimItem`
  - `imei`
  - `consultant`
  - `status`
  - `note`
  - `owner`

These data structures can live in the CRM page module or a small shared helper if that keeps the code cleaner.

## Functional Behavior

### Automated reconciliation

- Every commission row is matched against OMS using IMEI.
- Matching rows are marked `Paid` and counted immediately.
- Missing rows are marked `Unpaid` and routed into the claims queue.
- Claim rows remain visible in the CRM until resolved.
- Unpaid rows trigger a mock exception notification for Accounts and the Dealer Principal.

### Analytics and trends

- The dashboard can switch between `MoM`, `QoQ`, and `YoY`.
- Trend charts update based on the selected timeframe.
- Data should be segmentable by:
  - postpaid / prepaid
  - business / consumer
  - package type
- Seasonality is represented by a simple peak/quiet view rather than a real forecasting model.

### Payroll and commission logic

- Commission rules are editable in the UI.
- Paid lines are summed into a payroll-ready total.
- Unpaid and claim lines are excluded from final payroll totals.
- A mock “send to payroll” action adds a log entry that shows the summary was finalized.

### Risk mitigation and accountability

- Deactivated lines are back-allocated to the original consultant.
- Consultants with higher clawback or fraud risk are flagged in red.
- Package optimization highlights quantity versus Rand value.
- The module should surface a small set of top-risk consultants rather than a huge unreadable list.

### Claims and audit trail

- Claims can be opened from unpaid lines.
- Claims can be resolved or escalated in the UI.
- The audit trail records major changes like:
  - line marked paid
  - line flagged for claim
  - commission rule updated
  - payroll summary finalized

## UI Structure

- CRM sidebar gains a `Commission` tab.
- The tab opens with:
  - KPI row
  - reconciliation table
  - analytics cards and charts
  - payroll summary
  - claims queue
  - risk section
  - audit log
- Keep the visual language aligned with the rest of the MTN-inspired CRM:
  - black and yellow palette
  - glassy cards
  - bold headings
  - dense operational tables
- Prefer stacked sections on normal desktop widths so the content does not feel squashed.
- Tables should be horizontally scrollable if needed rather than forcing the page wider.

## Error Handling

- If no commission data exists, show a clear empty state with a call to seed mock lines.
- If a commission rule value is invalid, fall back to `0` and show a subtle inline warning.
- If an IMEI is missing, mark the line as `Unmatched` and send it to the claims queue.
- If totals cannot be calculated, show `0` rather than a broken value.

## Testing Strategy

- Add utility coverage for:
  - IMEI match / mismatch handling
  - paid / unpaid / claim status derivation
  - payroll total calculation
  - clawback flag logic
  - segment summaries
- Add a browser-level check that the Commission tab renders and shows at least one reconciliation row.
- Verify that editing a commission rule changes the payroll summary live.
- Verify that an unpaid line appears in the claims queue and risk list.

## Implementation Notes

- Reuse the existing CRM shell and stateful mock patterns already used by other tabs.
- Keep commission logic isolated in small helpers if the formulas become noisy.
- Avoid introducing backend dependencies at this stage.
- Prefer readable formulas over premature abstraction.
- Use a stacked page layout first, then only introduce side-by-side layout where the screen can support it comfortably.

## Acceptance Criteria

- The CRM has a visible `Commission` tab.
- The tab includes a working reconciliation table, analytics view, payroll logic, claims queue, and risk section.
- IMEI rows display paid/unpaid/claim status from mock data.
- Users can change commission rules and see totals update live.
- Unpaid rows are flagged into claims and risk monitoring.
- The page remains readable, scrollable, and not squashed in the current CRM layout.
