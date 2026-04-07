export function nextTicketId(existingIds) {
  const maxNumber = existingIds.reduce((max, id) => {
    const match = /^TCK-(\d+)$/.exec(id)
    if (!match) return max
    const number = Number(match[1])
    return Number.isFinite(number) && number > max ? number : max
  }, 0)

  return `TCK-${String(maxNumber + 1).padStart(4, "0")}`
}

export function deriveRagStatus(achievementPercent) {
  if (achievementPercent >= 80) return "green"
  if (achievementPercent >= 50) return "amber"
  return "red"
}

export function formatAchievement(actual, target) {
  if (!target) return 0
  return Math.round((actual / target) * 100)
}
