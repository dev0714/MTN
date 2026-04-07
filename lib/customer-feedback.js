import { nextTicketId, deriveRagStatus } from "./crm-utils.js"

export const CUSTOMER_TICKET_STORAGE_KEY = "exquisite-cellular.customerTickets"

export function createCustomerTicket(input, existingTickets = []) {
  const id = nextTicketId(existingTickets.map((ticket) => ticket.id).filter(Boolean))
  const fullName = `${input.customerFirstName.trim()} ${input.customerLastName.trim()}`.trim()
  const responseMinutes = Number(input.responseMinutes ?? 0)

  return {
    id,
    fullName,
    customerFirstName: input.customerFirstName.trim(),
    customerLastName: input.customerLastName.trim(),
    contactNumber: input.contactNumber.trim(),
    email: input.email.trim(),
    category: input.category,
    message: input.message.trim(),
    store: input.store.trim(),
    consultant: input.consultant.trim(),
    source: input.source.trim(),
    status: "Open",
    responseMinutes,
    severity: deriveRagStatus(100 - responseMinutes * 2),
    createdAt: new Date().toISOString(),
    resolution: "",
    satisfactionRating: null,
    satisfactionComment: "",
  }
}

export function loadCustomerTickets(storage, fallback = []) {
  const raw = storage?.getItem(CUSTOMER_TICKET_STORAGE_KEY)
  if (!raw) return fallback

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export function saveCustomerTicket(storage, input) {
  const tickets = loadCustomerTickets(storage)
  const nextTicket = createCustomerTicket(input, tickets)
  storage?.setItem(CUSTOMER_TICKET_STORAGE_KEY, JSON.stringify([nextTicket, ...tickets]))
  return nextTicket
}

export function updateCustomerTicket(storage, ticketId, updates) {
  const tickets = loadCustomerTickets(storage)
  const nextTickets = tickets.map((ticket) =>
    ticket.id === ticketId
      ? {
          ...ticket,
          ...updates,
          severity:
            typeof updates.responseMinutes === "number"
              ? deriveRagStatus(100 - updates.responseMinutes * 2)
              : ticket.severity,
        }
      : ticket,
  )
  storage?.setItem(CUSTOMER_TICKET_STORAGE_KEY, JSON.stringify(nextTickets))
  return nextTickets
}

