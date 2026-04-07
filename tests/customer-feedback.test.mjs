import test from "node:test"
import assert from "node:assert/strict"
import { createCustomerTicket, loadCustomerTickets, saveCustomerTicket } from "../lib/customer-feedback.js"

test("createCustomerTicket assigns the next ticket id and normalizes fields", () => {
  const ticket = createCustomerTicket(
    {
      customerFirstName: "Lerato",
      customerLastName: "Mokoena",
      contactNumber: "0821234567",
      email: "lerato@example.com",
      category: "Complaint",
      message: "My order was delayed",
      store: "Sandton Mall",
      consultant: "Nandi P.",
      source: "Store CSR",
    },
    [{ id: "TCK-8041" }, { id: "TCK-8044" }],
  )

  assert.equal(ticket.id, "TCK-8045")
  assert.equal(ticket.category, "Complaint")
  assert.equal(ticket.status, "Open")
  assert.equal(ticket.fullName, "Lerato Mokoena")
  assert.equal(ticket.store, "Sandton Mall")
})

test("saveCustomerTicket persists and loadCustomerTickets returns stored tickets", () => {
  const storage = {
    data: {},
    getItem(key) {
      return this.data[key] ?? null
    },
    setItem(key, value) {
      this.data[key] = String(value)
    },
  }

  const saved = saveCustomerTicket(storage, {
    customerFirstName: "Ayesha",
    customerLastName: "Patel",
    contactNumber: "0830000000",
    email: "ayesha@example.com",
    category: "Enquiry",
    message: "Can I book a phone?",
    store: "Rosebank",
    consultant: "Lerato M.",
    source: "Website",
  })

  const loaded = loadCustomerTickets(storage)
  assert.equal(saved.category, "Enquiry")
  assert.equal(loaded[0].id, saved.id)
  assert.equal(loaded[0].fullName, "Ayesha Patel")
})
