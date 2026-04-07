"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Bell,
  CalendarRange,
  ChartColumn,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Cpu,
  LogOut,
  FlagTriangleRight,
  Gauge,
  LayoutDashboard,
  MessageSquare,
  PackageOpen,
  Sparkles,
  Store,
  Ticket,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { deriveRagStatus } from "@/lib/crm-utils.js"
import { loadCustomerTickets, saveCustomerTicket, updateCustomerTicket } from "@/lib/customer-feedback.js"
import CommissionModule from "./commission-module"
import SalesModule from "./sales-module"
import InventoryModule from "./inventory-module"

type TabKey = "overview" | "sales" | "customers" | "inventory" | "workforce" | "marketing" | "support" | "commission" | "ops"
type DashboardScope = "Company" | "Region" | "Area Manager" | "Supervisor" | "Store Consultant"
type DashboardTimeframe = "Day" | "Week" | "Month" | "Year"
type CustomerSegment = "Consumer" | "SME"

const dashboardScopeOptions: DashboardScope[] = ["Company", "Region", "Area Manager", "Supervisor", "Store Consultant"]
const dashboardTimeframeOptions: DashboardTimeframe[] = ["Day", "Week", "Month", "Year"]
const dashboardSegmentOptions: CustomerSegment[] = ["Consumer", "SME"]
const timeframeBadgeLabels: Record<DashboardTimeframe, string> = {
  Day: "DTD",
  Week: "WTD",
  Month: "MTD",
  Year: "YTD",
}
const storeDirectory = [
  {
    storeName: "Sandton Mall",
    area: "Gauteng North",
    physicalAddress: "Shop 12, Retail Level, Sandton City",
    sabcCode: "SND-004",
    tradingTimes: "08:00 - 18:00",
    region: "North",
    manager: "Nandi P.",
    supervisor: "Lerato M.",
    consultant: "Lerato M.",
  },
  {
    storeName: "Maponya Mall",
    area: "Gauteng South",
    physicalAddress: "Shop 21, Maponya Mall, Soweto",
    sabcCode: "MPN-112",
    tradingTimes: "08:30 - 18:30",
    region: "South",
    manager: "Sibusiso K.",
    supervisor: "Nandi P.",
    consultant: "Sibusiso K.",
  },
  {
    storeName: "Waterfall",
    area: "Gauteng North",
    physicalAddress: "Unit 7, Waterfall Corner",
    sabcCode: "WTR-221",
    tradingTimes: "09:00 - 17:30",
    region: "North",
    manager: "Tebogo R.",
    supervisor: "Musa D.",
    consultant: "Tebogo R.",
  },
]

const serviceRequestTypes = [
  "Contract",
  "Upgrade",
  "Addition sim",
  "Transfer",
  "Deceased",
  "Sim swop",
  "MSISDN Swop",
  "Blacklisting",
  "Migration",
  "OBF",
  "Repairs",
  "International Roaming",
  "Cancelation",
  "VAS Services",
] as const

const dashboardCategoryOptions = [
  "All Categories",
  "Consumer",
  "SME",
  "New Lines",
  "Upgrades",
  "Accessories",
  "Connectivity",
  "Prepaid / Cash Phones",
  "Airtime",
  "Starter Packs / Simkits",
  "Momo",
]

const attendanceStatusOptions = [
  "Staff present",
  "Staff absent",
  "Staff day off",
  "Staff on annual leave",
  "Staff on sick leave",
  "Staff on family responsibility leave",
  "Staff on maternity leave",
  "Staff on paternity leave",
  "Staff on training",
  "Staff Awol",
  "Other",
] as const

function formatCompactMetric(value: number, currency = false) {
  if (currency) {
    if (Math.abs(value) >= 1_000_000) return `R ${(value / 1_000_000).toFixed(2)}m`
    if (Math.abs(value) >= 1_000) return `R ${(value / 1_000).toFixed(0)}k`
    return `R ${Math.round(value).toLocaleString("en-ZA")}`
  }

  return Math.round(value).toLocaleString("en-ZA")
}

function getKpiTone(achievement: number) {
  if (achievement >= 100) return "green" as const
  if (achievement >= 80) return "amber" as const
  return "red" as const
}

const tabs: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "sales", label: "Sales", icon: ChartColumn },
  { key: "customers", label: "Customers", icon: MessageSquare },
  { key: "inventory", label: "Inventory", icon: PackageOpen },
  { key: "workforce", label: "Workforce", icon: Users },
  { key: "marketing", label: "Marketing", icon: Sparkles },
  { key: "support", label: "Support", icon: Ticket },
  { key: "commission", label: "Commission", icon: Gauge },
  { key: "ops", label: "Ops", icon: ClipboardList },
]

const kpis = [
  { label: "Total Active Base", value: "48,219", delta: "+1.9% MTD", tone: "green" },
  { label: "New Acquisitions Today", value: "186", delta: "+24 vs yesterday", tone: "amber" },
  { label: "Total Deactivations MTD", value: "413", delta: "-6.1% vs last month", tone: "red" },
  { label: "Commission MTD", value: "R 4.28m", delta: "88% of target", tone: "amber" },
]

const baseGrowth = [
  { month: "Jan", active: 44200, deactivated: 580 },
  { month: "Feb", active: 44720, deactivated: 540 },
  { month: "Mar", active: 45610, deactivated: 620 },
  { month: "Apr", active: 46280, deactivated: 600 },
  { month: "May", active: 47040, deactivated: 512 },
  { month: "Jun", active: 47620, deactivated: 498 },
]

const deactivationReasons = [
  { name: "Cancelled", value: 118 },
  { name: "Ported", value: 93 },
  { name: "Unpaid", value: 77 },
  { name: "Fraud", value: 26 },
  { name: "Other", value: 99 },
]

const commissionTrend = [
  { month: "Jan", actual: 3.5, target: 4.1 },
  { month: "Feb", actual: 3.8, target: 4.0 },
  { month: "Mar", actual: 4.0, target: 4.2 },
  { month: "Apr", actual: 4.15, target: 4.3 },
  { month: "May", actual: 4.22, target: 4.4 },
  { month: "Jun", actual: 4.28, target: 4.85 },
]

const inventoryAging = [
  { bucket: "0-30", value: 1420000 },
  { bucket: "31-60", value: 1260000 },
  { bucket: "61-90", value: 990000 },
  { bucket: "91-120", value: 670000 },
  { bucket: "120+", value: 410000 },
]

const storeLeaderboard = [
  { name: "Sandton Mall", actual: 128, target: 112, growth: "+14%", rag: "green" },
  { name: "Maponya Mall", actual: 94, target: 100, growth: "-6%", rag: "amber" },
  { name: "Eastgate", actual: 89, target: 101, growth: "-12%", rag: "red" },
  { name: "Waterfall", actual: 116, target: 108, growth: "+7%", rag: "green" },
  { name: "Rosebank", actual: 104, target: 103, growth: "+1%", rag: "amber" },
]

const consultantLeaderboard = [
  { name: "Lerato M.", lines: 44, upgrades: 19, commission: "R 76k" },
  { name: "Sibusiso K.", lines: 39, upgrades: 18, commission: "R 71k" },
  { name: "Nandi P.", lines: 35, upgrades: 17, commission: "R 66k" },
  { name: "Tebogo R.", lines: 33, upgrades: 15, commission: "R 61k" },
]

const tickets = [
  { id: "TCK-8041", type: "Complaint", status: "Open", age: "12 min", owner: "Store Supervisor", source: "Store CSR" },
  { id: "TCK-8042", type: "Compliment", status: "Resolved", age: "9 min", owner: "Dealer Principal", source: "Customer" },
  { id: "TCK-8043", type: "Suggestion", status: "Escalated", age: "22 min", owner: "Area Manager", source: "Manager" },
  { id: "TCK-8044", type: "Enquiry", status: "Pending", age: "31 min", owner: "Store Manager", source: "Network" },
]

const customerSnapshot = [
  { label: "Postpaid", value: "61%" },
  { label: "Prepaid", value: "39%" },
  { label: "SME", value: "18%" },
  { label: "Consumer", value: "82%" },
]

const attendanceSummary = [
  { label: "Present", value: "128" },
  { label: "Absent", value: "9" },
  { label: "Day Off", value: "15" },
  { label: "Annual Leave", value: "6" },
  { label: "Sick Leave", value: "2" },
  { label: "Awol", value: "1" },
]

const marketingItems = [
  "Monthly Yellow Trader broadcast",
  "Weekly specials and promo push",
  "New device launch notifications",
  "Competition entry via QR and app download",
  "Mall activation and community event bulletin",
  "Social media and influencer role-play content",
]

const marketingCampaignBlocks = [
  {
    title: "Ping to all users",
    items: [
      "Upload campaigns to all users",
      "Monthly Yellow Trader pings",
      "Weekly and bi-weekly specials",
    ],
  },
  {
    title: "Device launches and bookings",
    items: [
      "Notify customers of new device launches",
      "Allow booking of phones and accessories",
      "Collect reservations from the app and CRM",
    ],
  },
  {
    title: "Top 10 picture pricing",
    items: [
      "Top 10 picture pricing packages",
      "Clear device and bundle pricing tiles",
      "Featured offers with mock images",
    ],
  },
  {
    title: "Events and giveaways",
    items: [
      "Store, mall centre court, and outdoor activations",
      "Weekly giveaway competitions",
      "Hampers, mall vouchers, smartphones, and tablets",
      "Manufacturer and supplier partner giveaways",
      "Refer a friend to enter by downloading the app",
    ],
  },
  {
    title: "QR and social promotion",
    items: [
      "QR codes at till points",
      "Host-led app download prompts",
      "QR codes for prepaid and postpaid customers",
      "SMS links to the base for downloads",
      "QR codes on windows and yellow trader stickers",
      "App promotion on website, Facebook, Instagram, TikTok, and mall websites",
    ],
  },
]

const orderWorksheet = [
  { sku: "IP16P-256-BLK", desc: "iPhone 16 Pro 256GB", soh: 18, sit: 11, forecast: 31, obsolescence: "NO" },
  { sku: "SGS26-512-GRY", desc: "Galaxy S26 512GB", soh: 24, sit: 5, forecast: 28, obsolescence: "NO" },
  { sku: "ACC-CHRG-20W", desc: "20W Fast Charger", soh: 143, sit: 80, forecast: 220, obsolescence: "YES" },
  { sku: "ROUT-4GLTE", desc: "Fixed LTE Router", soh: 26, sit: 9, forecast: 34, obsolescence: "NO" },
]

const customerLifecycle = [
  {
    name: "Thando Mokoena",
    segment: "Consumer",
    contract: "Postpaid",
    device: "iPhone 15",
    upgrade: "2026-05-14",
    status: "Active",
  },
  {
    name: "Ayesha Patel",
    segment: "SME",
    contract: "Postpaid",
    device: "Galaxy S25",
    upgrade: "2026-04-22",
    status: "Active",
  },
  {
    name: "Musa Dlamini",
    segment: "Consumer",
    contract: "Prepaid",
    device: "Nokia C32",
    upgrade: "2026-04-07",
    status: "Birthday ping",
  },
  {
    name: "Nadine Jacobs",
    segment: "Consumer",
    contract: "Postpaid",
    device: "iPhone 14",
    upgrade: "2026-03-18",
    status: "Welcome message",
  },
]

const automationAlerts = [
  "Birthday SMS sent at 08:00 with loyalty offer",
  "Upgrade notification sent 30 days before expiry",
  "Welcome message triggered on new contract creation",
  "Monthly Yellow Trader ping broadcast to all users",
]

const supportBreakdown = [
  { label: "Complaints", value: 38 },
  { label: "Compliments", value: 21 },
  { label: "Suggestions", value: 17 },
  { label: "Enquiries", value: 44 },
]

const supportQueue = [
  { ticket: "TCK-8041", subject: "SIM swap delay", owner: "Store Manager", sla: "14 min", status: "Green" },
  { ticket: "TCK-8042", subject: "Late activation complaint", owner: "Area Manager", sla: "19 min", status: "Amber" },
  { ticket: "TCK-8043", subject: "Device complaint", owner: "Dealer Principal", sla: "31 min", status: "Red" },
  { ticket: "TCK-8044", subject: "Package enquiry", owner: "Sales Consultant", sla: "11 min", status: "Green" },
]

const appointmentStats = [
  { label: "Booked", value: "42" },
  { label: "Attended", value: "36" },
  { label: "Cancelled", value: "4" },
  { label: "No show", value: "2" },
]

const appointmentQueue = [
  { customer: "Lerato M.", need: "Upgrade booking", consultant: "Nandi P.", time: "10:30" },
  { customer: "Sipho K.", need: "Device collection", consultant: "Sibusiso K.", time: "11:00" },
  { customer: "Nomsa R.", need: "SIM swap support", consultant: "Tebogo R.", time: "11:30" },
  { customer: "Bradley N.", need: "SME package review", consultant: "Lerato M.", time: "12:15" },
]

const salesCategoryRows = [
  { label: "New Lines SME", actual: 128, target: 120, rag: "green" },
  { label: "Upgrades SME", actual: 41, target: 50, rag: "amber" },
  { label: "New Lines Consumer", actual: 376, target: 350, rag: "green" },
  { label: "Upgrades Consumer", actual: 182, target: 210, rag: "amber" },
  { label: "Accessories", actual: 840, target: 900, rag: "amber" },
  { label: "Fibre", actual: 67, target: 55, rag: "green" },
  { label: "Prepaid/Cash Phones", actual: 104, target: 100, rag: "green" },
  { label: "Airtime", actual: 4110, target: 5000, rag: "red" },
  { label: "Starter Packs", actual: 620, target: 700, rag: "amber" },
  { label: "Momo", actual: 289, target: 250, rag: "green" },
]

const commissionClaims = [
  { imei: "356789012345678", consultant: "Lerato M.", packageType: "Postpaid", status: "Paid", note: "Matched" },
  { imei: "356789012345679", consultant: "Sibusiso K.", packageType: "SME", status: "Unpaid", note: "Missing in network report" },
  { imei: "356789012345680", consultant: "Nandi P.", packageType: "Consumer", status: "Paid", note: "Reconciled" },
  { imei: "356789012345681", consultant: "Tebogo R.", packageType: "Consumer", status: "Claim", note: "Under review" },
]

const attendanceRows = [
  { staff: "Lerato M.", status: "Present", clockIn: "08:02", clockOut: "17:11", break: "Tea 10m" },
  { staff: "Sibusiso K.", status: "Annual leave", clockIn: "-", clockOut: "-", break: "-" },
  { staff: "Nandi P.", status: "Present", clockIn: "08:05", clockOut: "16:58", break: "Lunch 30m" },
  { staff: "Tebogo R.", status: "Sick leave", clockIn: "-", clockOut: "-", break: "-" },
]

const storeInfo = [
  { label: "Store name", value: "Sandton Mall" },
  { label: "Area", value: "Gauteng North" },
  { label: "SABC code", value: "SND-004" },
  { label: "Trading times", value: "08:00 - 18:00" },
  { label: "Address", value: "Shop 12, Retail Level, Sandton City" },
]

const accessMatrix = [
  { role: "Dealer Principal", scope: "Company-wide", access: "All modules and exports" },
  { role: "Operations Manager", scope: "Regional", access: "Assigned stores and staff" },
  { role: "Store Supervisor", scope: "Store", access: "Tickets, attendance, sales, stock" },
  { role: "Sales Consultant", scope: "Self", access: "Own sales, commissions, bookings" },
]

const defaultSupportTickets = supportQueue.map((item, index) => ({
  id: item.ticket,
  ticket: item.ticket,
  fullName: ["Thando Mokoena", "Nandi Patel", "Musa Dlamini", "Sipho Khumalo"][index],
  customer: ["Thando M.", "Nandi P.", "Musa D.", "Sipho K."][index],
  category: ["Complaint", "Compliment", "Suggestion", "Enquiry"][index],
  issue: item.subject,
  message: item.subject,
  source: ["Store CSR", "Customer", "Manager", "Network"][index],
  responseMinutes: [12, 18, 24, 9][index],
  subject: item.subject,
  sla: item.sla,
  owner: item.owner,
  status: deriveRagStatus(100 - [12, 18, 24, 9][index] * 2),
  severity: deriveRagStatus(100 - [12, 18, 24, 9][index] * 2),
  createdAt: new Date().toISOString(),
  resolution: "",
  satisfactionRating: null,
  satisfactionComment: "",
}))

const initialCampaigns = [
  {
    id: "CMP-1001",
    title: "Monthly Yellow Trader",
    audience: "All users",
    channel: "Push + SMS",
    message: "Monthly offer blast with weekly special tiles and app download CTA.",
    sentAt: "Today 08:00",
  },
  {
    id: "CMP-1002",
    title: "New device launch",
    audience: "iPhone users",
    channel: "App + WhatsApp",
    message: "New device alert with booking link and accessory bundle offer.",
    sentAt: "Today 10:15",
  },
]

const initialReservations = [
  {
    id: "ORD-2001",
    customer: "Lerato M.",
    item: "iPhone 16 Pro",
    qty: 1,
    store: "Sandton Mall",
    status: "Reserved",
  },
  {
    id: "ORD-2002",
    customer: "Ayesha P.",
    item: "20W Charger",
    qty: 2,
    store: "Rosebank",
    status: "Awaiting collection",
  },
]

const performanceColor = {
  green: "rag-green",
  amber: "rag-amber",
  red: "rag-red",
} as const

const salesOverviewKpis = [
  { label: "Total Revenue", actual: "R 4.28m", target: "R 4.85m", achievement: 88 },
  { label: "Total Unit Volume", actual: "8,642", target: "9,400", achievement: 92 },
  { label: "Forecasted Sales", actual: "R 4.92m", target: "R 4.85m", achievement: 101 },
]

const salesMetricRows = [
  {
    metric: "Actuals",
    definition: "The confirmed net sales value or volume for the selected reporting period.",
    purpose: "The true performance data.",
  },
  {
    metric: "Targets",
    definition: "The pre-defined goal (revenue or volume) for the selected reporting period.",
    purpose: "The benchmark for success.",
  },
  {
    metric: "Deficit/Surplus",
    definition: "Actuals minus Targets. A positive number is a Surplus; a negative is a Deficit.",
    purpose: "Shows the gap (or overachievement) in absolute terms.",
  },
  {
    metric: "Achievement %",
    definition: "(Actuals ÷ Targets) × 100.",
    purpose: "The primary driver for visual performance grading.",
  },
]

const achievementRules = [
  { range: "1% to 49%", color: "Red", interpretation: "Significant underperformance. Requires immediate intervention.", tone: "red" as const },
  { range: "50% to 79%", color: "Amber", interpretation: "Approaching target but requiring focused effort.", tone: "amber" as const },
  { range: "80% and Above", color: "Green", interpretation: "Target achieved or exceeded. A positive result.", tone: "green" as const },
]

const salesTrendData = [
  { label: "W1", actual: 2.8, target: 3.1 },
  { label: "W2", actual: 3.0, target: 3.2 },
  { label: "W3", actual: 3.2, target: 3.3 },
  { label: "W4", actual: 3.05, target: 3.35 },
]

const salesCategoryStack = [
  { category: "Newlines", actual: 112, target: 100 },
  { category: "Upgrades", actual: 76, target: 85 },
  { category: "Accessories", actual: 180, target: 190 },
  { category: "Fibre", actual: 33, target: 30 },
  { category: "Prepaid", actual: 146, target: 140 },
  { category: "Airtime", actual: 520, target: 600 },
  { category: "Starter Packs", actual: 88, target: 100 },
  { category: "Momo", actual: 124, target: 110 },
]

const salesTrendFrames = {
  Day: [
    { label: "Mon", actual: 0.42, target: 0.5 },
    { label: "Tue", actual: 0.48, target: 0.52 },
    { label: "Wed", actual: 0.5, target: 0.54 },
    { label: "Thu", actual: 0.44, target: 0.56 },
    { label: "Fri", actual: 0.57, target: 0.6 },
    { label: "Sat", actual: 0.62, target: 0.64 },
    { label: "Sun", actual: 0.39, target: 0.45 },
  ],
  Week: salesTrendData,
  Month: [
    { label: "W1", actual: 2.8, target: 3.1 },
    { label: "W2", actual: 3.0, target: 3.2 },
    { label: "W3", actual: 3.2, target: 3.3 },
    { label: "W4", actual: 3.05, target: 3.35 },
  ],
  Quarter: [
    { label: "M1", actual: 8.8, target: 9.2 },
    { label: "M2", actual: 9.3, target: 9.6 },
    { label: "M3", actual: 9.9, target: 10.1 },
  ],
  Year: [
    { label: "Q1", actual: 27, target: 28.5 },
    { label: "Q2", actual: 28.6, target: 29.2 },
    { label: "Q3", actual: 29.5, target: 30.1 },
    { label: "Q4", actual: 30.8, target: 31.5 },
  ],
} as const

const salesCategoryFrames = {
  Day: [
    { category: "Newlines", actual: 18, target: 15 },
    { category: "Upgrades", actual: 11, target: 12 },
    { category: "Accessories", actual: 24, target: 26 },
    { category: "Airtime", actual: 62, target: 70 },
    { category: "Momo", actual: 16, target: 14 },
  ],
  Week: salesCategoryStack,
  Month: salesCategoryStack.map((item) => ({ ...item, actual: item.actual * 4, target: item.target * 4 })),
  Quarter: salesCategoryStack.map((item) => ({ ...item, actual: item.actual * 12, target: item.target * 12 })),
  Year: salesCategoryStack.map((item) => ({ ...item, actual: item.actual * 48, target: item.target * 48 })),
} as const

const salesMatrixRows = [
  { store: "Sandton Mall", consultant: "Lerato M.", achievement: 112 },
  { store: "Sandton Mall", consultant: "Sibusiso K.", achievement: 76 },
  { store: "Waterfall", consultant: "Nandi P.", achievement: 83 },
  { store: "Rosebank", consultant: "Tebogo R.", achievement: 48 },
  { store: "Maponya Mall", consultant: "Ayesha P.", achievement: 91 },
]

function getAchievementTone(achievement: number) {
  if (achievement >= 80) return "green" as const
  if (achievement >= 50) return "amber" as const
  return "red" as const
}

function MetricTableRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[#d9cf9b]">{label}</p>
      <p className="mt-2 font-[var(--font-heading)] text-3xl font-black text-white">{value}</p>
    </div>
  )
}

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview")
  const [salesSubTab, setSalesSubTab] = useState<"overview" | "analytics">("overview")
  const [salesTimeframe, setSalesTimeframe] = useState<"Day" | "Week" | "Month" | "Quarter" | "Year">("Month")
  const [dashboardScope, setDashboardScope] = useState<DashboardScope>("Company")
  const [dashboardTimeframe, setDashboardTimeframe] = useState<DashboardTimeframe>("Day")
  const [dashboardSegment, setDashboardSegment] = useState<CustomerSegment>("Consumer")
  const [dashboardStore, setDashboardStore] = useState(storeDirectory[0]?.storeName ?? "Sandton Mall")
  const [dashboardCategory, setDashboardCategory] = useState("All Categories")
  const [attendanceCounts, setAttendanceCounts] = useState({
    present: 128,
    absent: 9,
    dayOff: 15,
    annualLeave: 6,
    sickLeave: 2,
    familyLeave: 2,
    maternityLeave: 1,
    paternityLeave: 1,
    training: 3,
    awol: 1,
    other: 0,
  })
  const [attendanceDraft, setAttendanceDraft] = useState({
    staff: "Lerato M.",
    status: "Staff present",
    note: "",
  })
  const [customerRequestType, setCustomerRequestType] = useState<(typeof serviceRequestTypes)[number]>("Contract")
  const [opsNote, setOpsNote] = useState("")
  const [activityFeed, setActivityFeed] = useState<string[]>([
    "Company-wide dashboard opened by Dealer Principal",
    "Monthly Yellow Trader campaign is live",
    "Inventory and sales modules linked to daily reporting",
  ])
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [campaignDraft, setCampaignDraft] = useState({
    title: "",
    audience: "All users",
    channel: "Push + SMS",
    message: "",
  })
  const [supportInbox, setSupportInbox] = useState(
    defaultSupportTickets,
  )
  const [ticketDraft, setTicketDraft] = useState({
    customer: "",
    category: "Complaint",
    issue: "",
    responseMinutes: "15",
  })
  const [appointments, setAppointments] = useState(appointmentQueue)
  const [appointmentDraft, setAppointmentDraft] = useState({
    customer: "",
    need: "Upgrade booking",
    consultant: "Lerato M.",
    time: "09:00",
  })
  const [reservations, setReservations] = useState(initialReservations)
  const [reservationDraft, setReservationDraft] = useState({
    customer: "",
    item: "iPhone 16 Pro",
    qty: "1",
    store: "Sandton Mall",
  })
  const [resolutionDraft, setResolutionDraft] = useState({
    ticketId: defaultSupportTickets[0]?.id ?? "",
    resolution: "",
    rating: "5",
    source: "Store-level CSR",
  })

  const selectedSalesTrend = salesTrendFrames[salesTimeframe]
  const selectedCategoryData = salesCategoryFrames[salesTimeframe]
  const selectedStoreInfo = storeDirectory.find((store) => store.storeName === dashboardStore) ?? storeDirectory[0]
  const currentTimeframeLabel = timeframeBadgeLabels[dashboardTimeframe]
  const cycleDashboardTimeframe = () => {
    const currentIndex = dashboardTimeframeOptions.indexOf(dashboardTimeframe)
    const nextIndex = (currentIndex + 1) % dashboardTimeframeOptions.length
    setDashboardTimeframe(dashboardTimeframeOptions[nextIndex])
  }
  const cycleDashboardStore = () => {
    const currentIndex = storeDirectory.findIndex((store) => store.storeName === dashboardStore)
    const nextIndex = (currentIndex + 1) % storeDirectory.length
    setDashboardStore(storeDirectory[nextIndex]?.storeName ?? storeDirectory[0].storeName)
  }
  const scopeWeights: Record<DashboardScope, number> = {
    Company: 1,
    Region: 0.52,
    "Area Manager": 0.31,
    Supervisor: 0.18,
    "Store Consultant": 0.08,
  }
  const timeframeWeights: Record<DashboardTimeframe, number> = {
    Day: 0.08,
    Week: 0.28,
    Month: 1,
    Year: 11.8,
  }
  const segmentWeights: Record<CustomerSegment, number> = {
    Consumer: 1,
    SME: 0.36,
  }
  const storeWeights: Record<string, number> = {
    "Sandton Mall": 1,
    "Maponya Mall": 0.89,
    Waterfall: 0.78,
  }
  const categoryWeights: Record<string, number> = {
    "All Categories": 1,
    Consumer: 0.64,
    SME: 0.36,
    "New Lines": 0.48,
    Upgrades: 0.34,
    Accessories: 0.28,
    Connectivity: 0.22,
    "Prepaid / Cash Phones": 0.18,
    Airtime: 0.61,
    "Starter Packs / Simkits": 0.16,
    Momo: 0.14,
  }
  const combinedWeight =
    scopeWeights[dashboardScope] *
    timeframeWeights[dashboardTimeframe] *
    segmentWeights[dashboardSegment] *
    (storeWeights[selectedStoreInfo.storeName] ?? 1) *
    (categoryWeights[dashboardCategory] ?? 1)
  const revenueBase = dashboardSegment === "SME" ? 1320000 : 4280000
  const revenueTargetBase = dashboardSegment === "SME" ? 1440000 : 4850000
  const unitBase = dashboardSegment === "SME" ? 2860 : 8642
  const unitTargetBase = dashboardSegment === "SME" ? 3100 : 9400
  const currentRevenueActual = Math.max(1, Math.round(revenueBase * combinedWeight))
  const currentRevenueTarget = Math.max(1, Math.round(revenueTargetBase * combinedWeight))
  const currentUnitsActual = Math.max(1, Math.round(unitBase * combinedWeight))
  const currentUnitsTarget = Math.max(1, Math.round(unitTargetBase * combinedWeight))
  const currentRevenueAchievement = Math.round((currentRevenueActual / currentRevenueTarget) * 100)
  const currentUnitsAchievement = Math.round((currentUnitsActual / currentUnitsTarget) * 100)
  const currentForecastActual = Math.max(1, Math.round(currentRevenueActual * 1.06))
  const currentForecastTarget = Math.max(1, Math.round(currentRevenueTarget * 1.05))
  const currentForecastAchievement = Math.round((currentForecastActual / currentForecastTarget) * 100)
  const totalFeedback = supportInbox.length
  const openQueries = supportInbox.filter((ticket) => String(ticket.status ?? "Open").toLowerCase() !== "resolved").length
  const pendingQueries = supportInbox.filter((ticket) => String(ticket.status ?? "Open").toLowerCase() === "pending").length
  const resolvedQueries = supportInbox.filter((ticket) => String(ticket.status ?? "Open").toLowerCase() === "resolved").length
  const overdueQueries = supportInbox.filter((ticket) => Number(ticket.responseMinutes ?? 0) > 30).length
  const attendedAppointments = appointments.length
  const customerOrdersBooked = reservations.length

  const logActivity = (message: string) => {
    setActivityFeed((current) => [message, ...current].slice(0, 8))
  }

  const launchCampaign = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!campaignDraft.title.trim() || !campaignDraft.message.trim()) return

    const id = `CMP-${String(campaigns.length + 1001).padStart(4, "0")}`
    setCampaigns((current) => [
      {
        id,
        title: campaignDraft.title.trim(),
        audience: campaignDraft.audience,
        channel: campaignDraft.channel,
        message: campaignDraft.message.trim(),
        sentAt: "Just now",
      },
      ...current,
    ])
    setCampaignDraft({ title: "", audience: "All users", channel: "Push + SMS", message: "" })
    logActivity(`Campaign launched: ${campaignDraft.title.trim()}`)
  }

  const launchQuickCampaign = (title: string, audience: string, channel: string, message: string) => {
    const id = `CMP-${String(campaigns.length + 1001).padStart(4, "0")}`
    setCampaigns((current) => [
      {
        id,
        title,
        audience,
        channel,
        message,
        sentAt: "Just now",
      },
      ...current,
    ])
    logActivity(`Campaign launched: ${title}`)
  }

  const logTicket = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!ticketDraft.customer.trim() || !ticketDraft.issue.trim()) return

    const [firstName, ...rest] = ticketDraft.customer.trim().split(/\s+/)
    const lastName = rest.join(" ") || "Customer"
    saveCustomerTicket(typeof window !== "undefined" ? window.localStorage : undefined, {
      customerFirstName: firstName,
      customerLastName: lastName,
      contactNumber: "0000000000",
      email: "customer@example.com",
      category: ticketDraft.category,
      message: ticketDraft.issue.trim(),
      store: "Sandton Mall",
      consultant: "Store Supervisor",
      source: "CRM Desk",
      responseMinutes: ticketDraft.responseMinutes,
    })
    if (typeof window !== "undefined") {
      setSupportInbox(loadCustomerTickets(window.localStorage, defaultSupportTickets))
    }
    setTicketDraft({ customer: "", category: "Complaint", issue: "", responseMinutes: "15" })
  }

  const bookAppointment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!appointmentDraft.customer.trim()) return

    setAppointments((current) => [
      {
        customer: appointmentDraft.customer.trim(),
        need: appointmentDraft.need,
        consultant: appointmentDraft.consultant,
        time: appointmentDraft.time,
      },
      ...current,
    ])
    setAppointmentDraft({ customer: "", need: "Upgrade booking", consultant: "Lerato M.", time: "09:00" })
  }

  const reserveItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!reservationDraft.customer.trim()) return

    setReservations((current) => [
      {
        id: `ORD-${String(current.length + 2001).padStart(4, "0")}`,
        customer: reservationDraft.customer.trim(),
        item: reservationDraft.item,
        qty: Number(reservationDraft.qty) || 1,
        store: reservationDraft.store,
        status: "Reserved",
      },
      ...current,
    ])
    setReservationDraft({ customer: "", item: "iPhone 16 Pro", qty: "1", store: "Sandton Mall" })
    logActivity(`Customer order reserved for ${reservationDraft.customer.trim()}`)
  }

  const logAttendance = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    const keyMap: Record<string, keyof typeof attendanceCounts> = {
      "staff present": "present",
      "staff absent": "absent",
      "staff day off": "dayOff",
      "staff on annual leave": "annualLeave",
      "staff on sick leave": "sickLeave",
      "staff on family responsibility leave": "familyLeave",
      "staff on maternity leave": "maternityLeave",
      "staff on paternity leave": "paternityLeave",
      "staff on training": "training",
      "staff awol": "awol",
      other: "other",
    }
    const counterKey = keyMap[attendanceDraft.status.toLowerCase()] ?? "other"
    setAttendanceCounts((current) => ({
      ...current,
      [counterKey]: current[counterKey] + 1,
    }))
    logActivity(
      `${attendanceDraft.staff} marked ${attendanceDraft.status}${attendanceDraft.note ? ` - ${attendanceDraft.note}` : ""}`,
    )
    setAttendanceDraft((current) => ({ ...current, note: "" }))
  }

  const logOpsChallenge = () => {
    if (!opsNote.trim()) return
    logActivity(`Ops note logged: ${opsNote.trim()}`)
    setOpsNote("")
  }

  const logCustomerRequest = () => {
    logActivity(`Customer info request selected: ${customerRequestType}`)
  }

  const resolveTicket = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!resolutionDraft.ticketId.trim() || !resolutionDraft.resolution.trim()) return

    updateCustomerTicket(typeof window !== "undefined" ? window.localStorage : undefined, resolutionDraft.ticketId, {
      status: "Resolved",
      resolution: resolutionDraft.resolution.trim(),
      satisfactionRating: Number(resolutionDraft.rating),
      satisfactionComment: "Pending customer feedback",
      source: resolutionDraft.source,
    })
    if (typeof window !== "undefined") {
      setSupportInbox(loadCustomerTickets(window.localStorage, defaultSupportTickets))
    }
    setResolutionDraft({
      ticketId: defaultSupportTickets[0]?.id ?? "",
      resolution: "",
      rating: "5",
      source: "Store-level CSR",
    })
    logActivity(`Ticket resolved: ${resolutionDraft.ticketId}`)
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const savedTickets = loadCustomerTickets(window.localStorage, defaultSupportTickets)
    setSupportInbox(savedTickets.length ? savedTickets : defaultSupportTickets)

    const syncTickets = () => {
      const current = loadCustomerTickets(window.localStorage, defaultSupportTickets)
      setSupportInbox(current.length ? current : defaultSupportTickets)
    }

    window.addEventListener("storage", syncTickets)
    window.addEventListener("focus", syncTickets)
    return () => {
      window.removeEventListener("storage", syncTickets)
      window.removeEventListener("focus", syncTickets)
    }
  }, [])

  const tabContent = (() => {
    switch (activeTab) {
      case "sales":
        return <SalesModule />
      case "customers":
        return (
          <div className="grid gap-4 2xl:grid-cols-[1fr_0.9fr]">
            <section className="mtn-card rounded-[1.75rem] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Customer base monitoring</p>
                  <h2 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                    Active base and deactivation reasons
                  </h2>
                </div>
                <span className="mtn-chip">
                  <UsersRound className="h-3.5 w-3.5" />
                  base count snapshots
                </span>
              </div>
              <div className="mt-5 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deactivationReasons} dataKey="value" innerRadius={70} outerRadius={120} paddingAngle={5}>
                      {deactivationReasons.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={["#ffd000", "#a77f00", "#d8b13c", "#ff5d5d", "#5d5d5d"][index % 5]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#111111", border: "1px solid rgba(255,201,0,0.2)" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="mtn-card rounded-[1.75rem] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Tickets</p>
              <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                Complaint, compliment, suggestion, enquiry
              </h3>
              <div className="mt-5 space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">{ticket.id}</p>
                        <p className="text-sm text-[#d9cf9b]">
                          {ticket.type} · Source: {ticket.source}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          ticket.status === "Resolved"
                            ? "bg-emerald-500/15 text-emerald-200"
                            : ticket.status === "Escalated"
                              ? "bg-red-500/15 text-red-200"
                              : "bg-amber-500/15 text-amber-200"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-[#ede5b8]">
                      Age: {ticket.age} · Owner: {ticket.owner}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )
      case "inventory":
        return <InventoryModule />
      case "workforce":
        return (
          <div className="grid gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
            <section className="mtn-card rounded-[1.75rem] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Attendance</p>
              <h2 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                Clock in, breaks, leave, and approvals
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {attendanceSummary.map((item) => (
                  <MetricTableRow key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            </section>

            <section className="mtn-card rounded-[1.75rem] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Performance</p>
              <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                Store and consultant leaderboard
              </h3>
              <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-[#ffd000]">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Actual</th>
                      <th className="px-4 py-3">Target</th>
                      <th className="px-4 py-3">RAG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeLeaderboard.map((row) => (
                      <tr key={row.name} className="border-t border-white/10">
                        <td className="px-4 py-3 text-white">{row.name}</td>
                        <td className="px-4 py-3 text-[#f5f0d1]">{row.actual}</td>
                        <td className="px-4 py-3 text-[#f5f0d1]">{row.target}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${performanceColor[row.rag as keyof typeof performanceColor]}`}>
                            {row.growth}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )
      case "marketing":
        return (
          <div className="grid gap-4 2xl:grid-cols-[1.05fr_0.95fr]">
            <section className="mtn-card rounded-[1.75rem] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Marketing engine</p>
              <h2 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                Ping, launch, promote, and activate
              </h2>
              <form onSubmit={launchCampaign} className="mt-4 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-[#f4edcb]">
                    Campaign title
                    <input
                      value={campaignDraft.title}
                      onChange={(event) => setCampaignDraft((current) => ({ ...current, title: event.target.value }))}
                      className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                      placeholder="Monthly Yellow Trader"
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-[#f4edcb]">
                    Audience
                    <select
                      value={campaignDraft.audience}
                      onChange={(event) => setCampaignDraft((current) => ({ ...current, audience: event.target.value }))}
                      className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                    >
                      <option>All users</option>
                      <option>Postpaid</option>
                      <option>Prepaid</option>
                      <option>SME</option>
                      <option>Device owners</option>
                    </select>
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-[#f4edcb]">
                    Channel
                    <select
                      value={campaignDraft.channel}
                      onChange={(event) => setCampaignDraft((current) => ({ ...current, channel: event.target.value }))}
                      className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                    >
                      <option>Push + SMS</option>
                      <option>App only</option>
                      <option>WhatsApp</option>
                      <option>Website + social</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm text-[#f4edcb]">
                    Message
                    <input
                      value={campaignDraft.message}
                      onChange={(event) => setCampaignDraft((current) => ({ ...current, message: event.target.value }))}
                      className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                      placeholder="Weekly special and booking link..."
                    />
                  </label>
                </div>
                <button type="submit" className="mtn-button mtn-button-primary w-fit focus-ring">
                  Launch campaign
                </button>
              </form>
              <div className="mt-5 space-y-4">
                {marketingCampaignBlocks.map((block) => (
                  <div key={block.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <h3 className="font-semibold text-white">{block.title}</h3>
                    <ul className="mt-3 space-y-2">
                      {block.items.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#f3ebc5]">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#ffd000]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section className="mtn-card rounded-[1.75rem] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Live campaigns</p>
              <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                Broadcast history and launch queue
              </h3>
              <div className="mt-4 space-y-3">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{campaign.title}</p>
                        <p className="text-sm text-[#d9cf9b]">
                          {campaign.audience} · {campaign.channel}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#ffd000]/15 px-3 py-1 text-xs font-semibold text-[#ffd000]">
                        {campaign.sentAt}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#f3ebc5]">{campaign.message}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )
      case "support":
        return (
          <div className="grid gap-4 2xl:grid-cols-[1fr_0.95fr]">
            <section className="mtn-card rounded-[1.75rem] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Customer experience</p>
              <h2 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                Complaints, compliments, suggestions, and enquiries
              </h2>
              <form onSubmit={logTicket} className="mt-4 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-[#f4edcb]">
                    Customer name
                    <input
                      value={ticketDraft.customer}
                      onChange={(event) => setTicketDraft((current) => ({ ...current, customer: event.target.value }))}
                      className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                      placeholder="Customer name"
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-[#f4edcb]">
                    Category
                    <select
                      value={ticketDraft.category}
                      onChange={(event) => setTicketDraft((current) => ({ ...current, category: event.target.value }))}
                      className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                    >
                      <option>Complaint</option>
                      <option>Compliment</option>
                      <option>Suggestion</option>
                      <option>Enquiry</option>
                    </select>
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-[#f4edcb]">
                    Ticket issue
                    <input
                      value={ticketDraft.issue}
                      onChange={(event) => setTicketDraft((current) => ({ ...current, issue: event.target.value }))}
                      className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                      placeholder="SIM swap delay, complaint, etc."
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-[#f4edcb]">
                    Response mins
                    <input
                      type="number"
                      min="1"
                      value={ticketDraft.responseMinutes}
                      onChange={(event) => setTicketDraft((current) => ({ ...current, responseMinutes: event.target.value }))}
                      className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                    />
                  </label>
                </div>
                <button type="submit" className="mtn-button mtn-button-primary w-full justify-center md:w-fit focus-ring">
                  Log ticket
                </button>
              </form>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {supportBreakdown.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#d9cf9b]">{item.label}</p>
                    <p className="mt-2 font-[var(--font-heading)] text-3xl font-black text-white">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3">
                {supportInbox.map((ticket) => (
                  <div key={ticket.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">{ticket.id}</p>
                        <p className="text-sm text-[#d9cf9b]">
                          {ticket.category} · {ticket.fullName ?? ticket.customer}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          String(ticket.severity ?? ticket.status).toLowerCase() === "green"
                            ? "rag-green"
                            : String(ticket.severity ?? ticket.status).toLowerCase() === "amber"
                              ? "rag-amber"
                              : "rag-red"
                        }`}
                      >
                        {ticket.responseMinutes} min
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#f1e8c0]">{ticket.message ?? ticket.issue}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#d9cf9b]">
                      Source: {ticket.source ?? "Unknown"} · Status: {ticket.status ?? "Open"}
                    </p>
                    {ticket.resolution ? (
                      <p className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-[#f3ebc5]">
                        Resolution: {ticket.resolution}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              <form onSubmit={resolveTicket} className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Resolve ticket and send satisfaction prompt</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-[#f4edcb]">
                    Ticket
                    <select
                      value={resolutionDraft.ticketId}
                      onChange={(event) => setResolutionDraft((current) => ({ ...current, ticketId: event.target.value }))}
                      className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                    >
                      {supportInbox.map((ticket) => (
                        <option key={ticket.id} value={ticket.id}>
                          {ticket.id} - {ticket.fullName ?? ticket.customer}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm text-[#f4edcb]">
                    Problem source
                    <select
                      value={resolutionDraft.source}
                      onChange={(event) => setResolutionDraft((current) => ({ ...current, source: event.target.value }))}
                      className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                    >
                      <option>Store-level CSR</option>
                      <option>Manager</option>
                      <option>Network</option>
                      <option>Customer</option>
                    </select>
                  </label>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_140px]">
                  <label className="grid gap-2 text-sm text-[#f4edcb]">
                    Resolution
                    <textarea
                      rows={3}
                      value={resolutionDraft.resolution}
                      onChange={(event) => setResolutionDraft((current) => ({ ...current, resolution: event.target.value }))}
                      className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                      placeholder="How was the ticket resolved?"
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-[#f4edcb]">
                    Satisfaction
                    <select
                      value={resolutionDraft.rating}
                      onChange={(event) => setResolutionDraft((current) => ({ ...current, rating: event.target.value }))}
                      className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                    >
                      <option value="5">5 stars</option>
                      <option value="4">4 stars</option>
                      <option value="3">3 stars</option>
                      <option value="2">2 stars</option>
                      <option value="1">1 star</option>
                    </select>
                  </label>
                </div>
                <button type="submit" className="mt-4 mtn-button mtn-button-primary focus-ring">
                  Mark resolved
                </button>
              </form>
            </section>

            <section className="mtn-card rounded-[1.75rem] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Ticket workflow</p>
              <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                Escalation and resolution trail
              </h3>
              <div className="mt-5 space-y-3">
                {[
                  "Green: feedback within 15 minutes",
                  "Amber: feedback between 16 and 20 minutes",
                  "Red: feedback over 21 minutes",
                  "Auto-escalate after 30 minutes without response",
                  "Route issue source to Store CSR, Manager, Network, or Customer",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#f3ebc5]">
                    <CheckCircle2 className="h-4 w-4 text-[#ffd000]" />
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )
      case "commission":
        return <CommissionModule />
      case "ops":
        return (
          <div className="grid gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
            <section className="mtn-card rounded-[1.75rem] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Store details</p>
              <h2 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">Store and area profile</h2>
              <div className="mt-5 space-y-3">
                {storeInfo.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#d9cf9b]">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mtn-card rounded-[1.75rem] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Attendance and leave</p>
              <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                Clock in, breaks, leave, and daily status
              </h3>
              <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-[#ffd000]">
                    <tr>
                      <th className="px-4 py-3">Staff</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Clock in</th>
                      <th className="px-4 py-3">Clock out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRows.map((row) => (
                      <tr key={row.staff} className="border-t border-white/10">
                        <td className="px-4 py-3 text-white">{row.staff}</td>
                        <td className="px-4 py-3 text-[#f5f0d1]">{row.status}</td>
                        <td className="px-4 py-3 text-[#f5f0d1]">{row.clockIn}</td>
                        <td className="px-4 py-3 text-[#f5f0d1]">{row.clockOut}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mtn-card rounded-[1.75rem] p-5 xl:col-span-2">
              <div className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Appointments</p>
                  <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                    Book customers into the right consultant
                  </h3>
                  <form onSubmit={bookAppointment} className="mt-4 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-2 text-sm text-[#f4edcb]">
                        Customer
                        <input
                          value={appointmentDraft.customer}
                          onChange={(event) => setAppointmentDraft((current) => ({ ...current, customer: event.target.value }))}
                          className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                          placeholder="Customer name"
                        />
                      </label>
                      <label className="grid gap-2 text-sm text-[#f4edcb]">
                        Consultant
                        <input
                          value={appointmentDraft.consultant}
                          onChange={(event) => setAppointmentDraft((current) => ({ ...current, consultant: event.target.value }))}
                          className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                        />
                      </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-2 text-sm text-[#f4edcb]">
                        Need
                        <select
                          value={appointmentDraft.need}
                          onChange={(event) => setAppointmentDraft((current) => ({ ...current, need: event.target.value }))}
                          className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                        >
                          <option>Upgrade booking</option>
                          <option>Device collection</option>
                          <option>SIM swap support</option>
                          <option>SME package review</option>
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm text-[#f4edcb]">
                        Time
                        <input
                          value={appointmentDraft.time}
                          onChange={(event) => setAppointmentDraft((current) => ({ ...current, time: event.target.value }))}
                          className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                        />
                      </label>
                    </div>
                    <button type="submit" className="mtn-button mtn-button-primary w-fit focus-ring">
                      Book appointment
                    </button>
                  </form>
                  <div className="mt-4 space-y-3">
                    {appointments.map((item) => (
                      <div key={`${item.customer}-${item.time}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="font-semibold text-white">{item.customer}</p>
                        <p className="mt-1 text-sm text-[#d9cf9b]">
                          {item.need} · {item.consultant} · {item.time}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Customer orders</p>
                  <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                    Reserve phones and accessories before collection
                  </h3>
                  <form onSubmit={reserveItem} className="mt-4 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-2 text-sm text-[#f4edcb]">
                        Customer
                        <input
                          value={reservationDraft.customer}
                          onChange={(event) => setReservationDraft((current) => ({ ...current, customer: event.target.value }))}
                          className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                          placeholder="Customer name"
                        />
                      </label>
                      <label className="grid gap-2 text-sm text-[#f4edcb]">
                        Qty
                        <input
                          type="number"
                          min="1"
                          value={reservationDraft.qty}
                          onChange={(event) => setReservationDraft((current) => ({ ...current, qty: event.target.value }))}
                          className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                        />
                      </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-2 text-sm text-[#f4edcb]">
                        Item
                        <select
                          value={reservationDraft.item}
                          onChange={(event) => setReservationDraft((current) => ({ ...current, item: event.target.value }))}
                          className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                        >
                          <option>iPhone 16 Pro</option>
                          <option>Galaxy S26</option>
                          <option>20W Fast Charger</option>
                          <option>Fixed LTE Router</option>
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm text-[#f4edcb]">
                        Store
                        <input
                          value={reservationDraft.store}
                          onChange={(event) => setReservationDraft((current) => ({ ...current, store: event.target.value }))}
                          className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                        />
                      </label>
                    </div>
                    <button type="submit" className="mtn-button mtn-button-primary w-fit focus-ring">
                      Reserve item
                    </button>
                  </form>
                  <div className="mt-4 space-y-3">
                    {reservations.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-white">{item.id}</p>
                          <span className="rounded-full bg-[#ffd000]/15 px-3 py-1 text-xs font-semibold text-[#ffd000]">
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[#d9cf9b]">
                          {item.customer} · {item.item} x{item.qty} · {item.store}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="mtn-card rounded-[1.75rem] p-5 xl:col-span-2">
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Role permissions</p>
              <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                Hierarchical data access and filters
              </h3>
              <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-[#ffd000]">
                    <tr>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Scope</th>
                      <th className="px-4 py-3">Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessMatrix.map((row) => (
                      <tr key={row.role} className="border-t border-white/10">
                        <td className="px-4 py-3 text-white">{row.role}</td>
                        <td className="px-4 py-3 text-[#f5f0d1]">{row.scope}</td>
                        <td className="px-4 py-3 text-[#f5f0d1]">{row.access}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )
      default: {
        const metricTone = (achievement: number) => getKpiTone(achievement)
        const kpiTiles = [
          { label: "Total Revenue", actual: currentRevenueActual, target: currentRevenueTarget, currency: true },
          { label: "Total Unit Volume", actual: currentUnitsActual, target: currentUnitsTarget, currency: false },
          { label: "Achievement %", actual: currentRevenueAchievement, target: 100, currency: false },
          { label: "Shortfall View", actual: Math.max(0, currentRevenueTarget - currentRevenueActual), target: currentRevenueTarget, currency: true },
        ]
        const acquisitionTiles = [
          { label: "Total New Lines SME", actual: Math.round(128 * combinedWeight), target: Math.round(120 * combinedWeight) },
          { label: "Total Upgrades SME", actual: Math.round(41 * combinedWeight), target: Math.round(50 * combinedWeight) },
          { label: "Total New Lines Consumer", actual: Math.round(376 * combinedWeight), target: Math.round(350 * combinedWeight) },
          { label: "Total Upgrades Consumer", actual: Math.round(182 * combinedWeight), target: Math.round(210 * combinedWeight) },
        ]

        return (
          <div className="space-y-4">
            <section className="mtn-card rounded-[1.75rem] p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Dealer Principal Dashboard</p>
                  <h2 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                    Live company, regional, store, and consultant control
                  </h2>
                </div>
                <span className="mtn-chip">
                  <FlagTriangleRight className="h-3.5 w-3.5" />
                  {dashboardScope} · {dashboardTimeframe} · {dashboardSegment}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {dashboardScopeOptions.map((scope) => (
                  <button key={scope} type="button" onClick={() => setDashboardScope(scope)} className={`rounded-full px-4 py-2 text-sm font-semibold ${dashboardScope === scope ? "bg-[#ffd000] text-black" : "border border-white/10 bg-black/20 text-white"}`}>{scope}</button>
                ))}
                {dashboardTimeframeOptions.map((frame) => (
                  <button key={frame} type="button" onClick={() => setDashboardTimeframe(frame)} className={`rounded-full px-4 py-2 text-sm font-semibold ${dashboardTimeframe === frame ? "bg-[#ffd000] text-black" : "border border-white/10 bg-black/20 text-white"}`}>{frame}</button>
                ))}
                {dashboardSegmentOptions.map((segment) => (
                  <button key={segment} type="button" onClick={() => setDashboardSegment(segment)} className={`rounded-full px-4 py-2 text-sm font-semibold ${dashboardSegment === segment ? "bg-[#ffd000] text-black" : "border border-white/10 bg-black/20 text-white"}`}>{segment}</button>
                ))}
              </div>
            </section>

            <div className="grid gap-4 2xl:grid-cols-[1.05fr_0.95fr]">
              <section className="mtn-card rounded-[1.75rem] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Store Details</p>
                    <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">{selectedStoreInfo.storeName}</h3>
                  </div>
                  <span className="mtn-chip"><Store className="h-3.5 w-3.5" />{selectedStoreInfo.sabcCode}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MetricTableRow label="Area" value={selectedStoreInfo.area} />
                  <MetricTableRow label="Region" value={selectedStoreInfo.region} />
                  <MetricTableRow label="Address" value={selectedStoreInfo.physicalAddress} />
                  <MetricTableRow label="Trading times" value={selectedStoreInfo.tradingTimes} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                  {kpiTiles.map((tile) => {
                    const achievement = tile.target ? Math.round((tile.actual / tile.target) * 100) : 0
                    const tone = metricTone(achievement)
                    return (
                      <div key={tile.label} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-[#d9cf9b]">{tile.label}</p>
                        <p className="mt-2 font-[var(--font-heading)] text-3xl font-black text-white">{formatCompactMetric(tile.actual, tile.currency)}</p>
                        <p className="mt-1 text-sm text-[#efe5ba]">Target {formatCompactMetric(tile.target, tile.currency)}</p>
                        <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${performanceColor[tone]}`}>
                          {tile.label === "Shortfall View" ? `${formatCompactMetric(tile.actual, tile.currency)} short` : `Achievement ${achievement}%`}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {acquisitionTiles.map((tile) => {
                    const achievement = Math.round((tile.actual / tile.target) * 100)
                    const tone = metricTone(achievement)
                    return (
                      <div key={tile.label} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[#d9cf9b]">{tile.label}</p>
                        <p className="mt-2 font-[var(--font-heading)] text-2xl font-bold text-white">{formatCompactMetric(tile.actual)}</p>
                        <p className="mt-1 text-sm text-[#efe5ba]">Target {formatCompactMetric(tile.target)}</p>
                        <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${performanceColor[tone]}`}>{achievement}%</span>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="mtn-card rounded-[1.75rem] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Customer info</p>
                <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">Service routes and shortfall view</h3>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {serviceRequestTypes.map((requestType) => (
                    <button key={requestType} type="button" onClick={() => { setCustomerRequestType(requestType); logCustomerRequest(); }} className={`rounded-2xl border px-3 py-3 text-left text-sm ${customerRequestType === requestType ? "border-[#ffd000] bg-[#ffd000]/15 text-white" : "border-white/10 bg-black/20 text-[#f1e8c0]"}`}>{requestType}</button>
                  ))}
                </div>
                <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[#d9cf9b]">Selected request type</p>
                  <p className="mt-2 font-semibold text-white">{customerRequestType}</p>
                </div>
                <div className="mt-4 grid gap-3">
                  {[
                    { label: "Consumer", actual: Math.round(currentUnitsActual * 0.72), target: Math.round(currentUnitsTarget * 0.72) },
                    { label: "SME", actual: Math.round(currentUnitsActual * 0.28), target: Math.round(currentUnitsTarget * 0.28) },
                  ].map((row) => {
                    const achievement = Math.round((row.actual / row.target) * 100)
                    const tone = metricTone(achievement)
                    return (
                      <div key={row.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-[#d9cf9b]">{row.label}</p>
                            <p className="mt-1 text-sm text-white">Actual {formatCompactMetric(row.actual)} vs Target {formatCompactMetric(row.target)}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${performanceColor[tone]}`}>{achievement}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>

            <div className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
              <section className="mtn-card rounded-[1.75rem] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Staff attendance</p>
                <form onSubmit={logAttendance} className="mt-4 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input value={attendanceDraft.staff} onChange={(event) => setAttendanceDraft((current) => ({ ...current, staff: event.target.value }))} className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" />
                    <select value={attendanceDraft.status} onChange={(event) => setAttendanceDraft((current) => ({ ...current, status: event.target.value }))} className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none">
                      {attendanceStatusOptions.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </div>
                  <input value={attendanceDraft.note} onChange={(event) => setAttendanceDraft((current) => ({ ...current, note: event.target.value }))} className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" placeholder="Note" />
                  <button type="submit" className="mtn-button mtn-button-primary w-fit focus-ring">Save attendance</button>
                </form>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                  {[
                    { label: "Present", value: attendanceCounts.present },
                    { label: "Absent", value: attendanceCounts.absent },
                    { label: "Annual leave", value: attendanceCounts.annualLeave },
                    { label: "Sick leave", value: attendanceCounts.sickLeave },
                  ].map((item) => <MetricTableRow key={item.label} label={item.label} value={String(item.value)} />)}
                </div>
              </section>

              <section className="mtn-card rounded-[1.75rem] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Customer queries</p>
                <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-[#ffd000]"><tr><th className="px-4 py-3">Ticket</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Age</th></tr></thead>
                    <tbody>{supportQueue.map((ticket) => <tr key={ticket.ticket} className="border-t border-white/10"><td className="px-4 py-3 text-white">{ticket.ticket}</td><td className="px-4 py-3 text-[#f5f0d1]">{ticket.subject}</td><td className="px-4 py-3 text-[#f5f0d1]">{ticket.sla}</td></tr>)}</tbody>
                  </table>
                </div>
                <form onSubmit={logTicket} className="mt-4 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <input value={ticketDraft.customer} onChange={(event) => setTicketDraft((current) => ({ ...current, customer: event.target.value }))} className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" placeholder="Customer name" />
                  <select value={ticketDraft.category} onChange={(event) => setTicketDraft((current) => ({ ...current, category: event.target.value }))} className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"><option>Complaint</option><option>Compliment</option><option>Suggestion</option><option>Enquiry</option></select>
                  <input value={ticketDraft.issue} onChange={(event) => setTicketDraft((current) => ({ ...current, issue: event.target.value }))} className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" placeholder="Query details" />
                  <button type="submit" className="mtn-button mtn-button-primary w-fit focus-ring">Log query</button>
                </form>
              </section>
            </div>

            <div className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
              <section className="mtn-card rounded-[1.75rem] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Appointments & orders</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <form onSubmit={bookAppointment} className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                    <input value={appointmentDraft.customer} onChange={(event) => setAppointmentDraft((current) => ({ ...current, customer: event.target.value }))} className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" placeholder="Customer" />
                    <button type="submit" className="mtn-button mtn-button-primary w-fit focus-ring">Book appointment</button>
                  </form>
                  <form onSubmit={reserveItem} className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                    <input value={reservationDraft.customer} onChange={(event) => setReservationDraft((current) => ({ ...current, customer: event.target.value }))} className="focus-ring rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" placeholder="Customer" />
                    <button type="submit" className="mtn-button mtn-button-primary w-fit focus-ring">Reserve item</button>
                  </form>
                </div>
                <div className="mt-4 space-y-3">
                  {appointments.slice(0, 2).map((item) => <div key={`${item.customer}-${item.time}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[#f1e8c0]">{item.customer} · {item.need}</div>)}
                  {reservations.slice(0, 2).map((item) => <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[#f1e8c0]">{item.customer} · {item.item} x{item.qty}</div>)}
                </div>
              </section>

              <section className="mtn-card rounded-[1.75rem] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Marketing and notes</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => launchQuickCampaign("Monthly Yellow Trader", "All users", "Push + SMS", "Monthly Yellow Trader ping to all users.")} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-[#f1e8c0]">Ping all users</button>
                  <button type="button" onClick={() => launchQuickCampaign("New device launch", "Device users", "App + WhatsApp", "Notify customers of new devices and allow bookings.")} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-[#f1e8c0]">New device</button>
                </div>
                <textarea value={opsNote} onChange={(event) => setOpsNote(event.target.value)} rows={4} className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" placeholder="Log system challenge..." />
                <button type="button" onClick={logOpsChallenge} className="mt-3 mtn-button mtn-button-primary focus-ring">Save note</button>
                <div className="mt-4 space-y-2">
                  {activityFeed.map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-[#f1e8c0]">{item}</div>)}
                </div>
              </section>
            </div>
          </div>
        )
      }
    }
  })()

  return (
    <main className="px-4 py-5 text-[#f8f1d2] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-[1800px] gap-5">
        <aside className="mtn-card hidden w-[290px] shrink-0 rounded-[2rem] p-4 xl:flex xl:flex-col">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffd000] text-[#111111]">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <p className="font-[var(--font-heading)] text-lg font-bold text-white">CRM Core</p>
              <p className="text-xs uppercase tracking-[0.22em] text-[#ffd000]">Exquisite Cellular</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`focus-ring flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                  activeTab === tab.key ? "bg-[#ffd000] text-[#111111]" : "bg-white/5 text-[#f7f0ca] hover:bg-white/10"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto rounded-[1.5rem] border border-[#ffd000]/20 bg-[#111111] p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-[#ffd000]">Role access</p>
            <p className="mt-2 text-sm leading-6 text-[#e8dfaf]">
              Access is filtered by company, region, store, supervisor, and consultant views.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-white">
              <UserCog className="h-4 w-4 text-[#ffd000]" />
              Dealer Principal preview
            </div>
          </div>
        </aside>

        <section className="flex-1 space-y-5 pb-8">
          <header className="mtn-panel rounded-[2rem] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="mtn-chip">
                  <Sparkles className="h-3.5 w-3.5" />
                  {activeTab} module
                </span>
                <h1 className="mt-3 font-[var(--font-heading)] text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                  Dealer Principal dashboard
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#d9cf9b]">
                  An operational CRM combining the full business workflow: sales, customer base, inventory,
                  attendance, marketing, appointments, customer orders, and reporting.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={cycleDashboardTimeframe} className="mtn-button mtn-button-ghost focus-ring">
                  <CalendarRange className="h-4 w-4" />
                  {currentTimeframeLabel}
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={cycleDashboardStore} className="mtn-button mtn-button-ghost focus-ring">
                  <Store className="h-4 w-4" />
                  {dashboardStore}
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button className="mtn-button mtn-button-primary focus-ring">
                  <ClipboardCheck className="h-4 w-4" />
                  Export report
                </button>
                <a href="/login" className="mtn-button mtn-button-ghost focus-ring">
                  <LogOut className="h-4 w-4" />
                  Logout
                </a>
              </div>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {kpis.map((item) => (
              <article key={item.label} className="mtn-card rounded-[1.5rem] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-[#d9cf9b]">{item.label}</p>
                    <p className="mt-2 font-[var(--font-heading)] text-3xl font-black text-white">{item.value}</p>
                  </div>
                  <div
                    className={`rounded-2xl px-3 py-2 text-xs font-semibold ${
                      item.tone === "green" ? "rag-green" : item.tone === "amber" ? "rag-amber" : "rag-red"
                    }`}
                  >
                    {item.delta}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mtn-panel rounded-[1.75rem] p-3">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`focus-ring inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab.key ? "bg-[#ffd000] text-[#111111]" : "bg-white/5 text-[#f5efcc] hover:bg-white/10"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {tabContent}

          <div className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
            <section className="mtn-card rounded-[1.75rem] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Quick controls</p>
              <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                Core business modules
              </h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Staff attendance and leave workflow",
                  "Customer base and deactivation analysis",
                  "Inventory forecasting and stock rotation",
                  "Customer orders, appointments, and reservations",
                  "Complaints, compliments, suggestions, and enquiries",
                  "Marketing pings, launches, and competitions",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[#f1e8c0]">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="mtn-card rounded-[1.75rem] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#ffd000]">Performance leaderboard</p>
              <h3 className="mt-1 font-[var(--font-heading)] text-2xl font-bold text-white">
                Store and consultant ranking
              </h3>
              <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-[#ffd000]">
                    <tr>
                      <th className="px-4 py-3">Entity</th>
                      <th className="px-4 py-3">New lines</th>
                      <th className="px-4 py-3">Upgrades</th>
                      <th className="px-4 py-3">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultantLeaderboard.map((row) => (
                      <tr key={row.name} className="border-t border-white/10">
                        <td className="px-4 py-3 text-white">{row.name}</td>
                        <td className="px-4 py-3 text-[#f5f0d1]">{row.lines}</td>
                        <td className="px-4 py-3 text-[#f5f0d1]">{row.upgrades}</td>
                        <td className="px-4 py-3 text-[#f5f0d1]">{row.commission}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

        </section>
      </div>
    </main>
  )
}

