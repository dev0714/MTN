import test from "node:test"
import assert from "node:assert/strict"
import { nextTicketId, deriveRagStatus } from "../lib/crm-utils.js"

test("nextTicketId increments from the highest numeric ticket suffix", () => {
  const id = nextTicketId(["TCK-8041", "TCK-8044", "TCK-7999"])
  assert.equal(id, "TCK-8045")
})

test("deriveRagStatus maps achievement percent into green amber and red", () => {
  assert.equal(deriveRagStatus(120), "green")
  assert.equal(deriveRagStatus(75), "amber")
  assert.equal(deriveRagStatus(49), "red")
})
