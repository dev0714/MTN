function isBlank(value) {
  return !String(value || "").trim()
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function deriveCommissionStatus({ imei, omsMatched, claimStatus }) {
  if (isBlank(imei) || omsMatched === false) return "Unpaid"
  if (claimStatus && claimStatus !== "Closed") return "Claim"
  return "Paid"
}

export function calculatePayrollTotal(lines) {
  return lines
    .filter((line) => line.status === "Paid")
    .reduce((sum, line) => sum + toNumber(line.commissionValue), 0)
}

export function buildClaimsQueue(lines) {
  return lines.filter((line) => line.status !== "Paid")
}

export function summarizeSegments(lines) {
  const groups = new Map()
  for (const line of lines) {
    const label = line.sector || line.customerType || "Unknown"
    const current = groups.get(label) || 0
    groups.set(label, current + toNumber(line.commissionValue))
  }
  return [...groups.entries()].map(([label, value]) => ({ label, value }))
}

export function flagRiskItems(lines) {
  return lines
    .filter((line) => line.status !== "Paid" || !isBlank(line.deactivationReason))
    .map((line) => {
      const unpaid = line.status !== "Paid"
      if (unpaid) {
        return {
          consultant: line.consultant,
          reason: "Unpaid",
          severity: "red",
          detail: "Missing IMEI or OMS mismatch",
        }
      }

      return {
        consultant: line.consultant,
        reason: line.deactivationReason,
        severity: "amber",
        detail: "Back-allocate to original consultant and review clawback",
      }
    })
}
