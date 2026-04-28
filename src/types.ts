// ─── Domain Types ────────────────────────────────────────────────────────────

export interface Slot {
  id: string
  date: string       // "YYYY-MM-DD"
  time: string       // "HH:MM"
  capacity: number
  bookedCount: number
}

export interface Booking {
  id: string
  slotId: string
  name: string
  phone: string
  subject: string
  orderNumber: string
  createdAt: string  // ISO string
}

export interface Settings {
  className: string
  price: number
  smartStoreUrl: string
  adminPassword: string
}

// ─── App State ───────────────────────────────────────────────────────────────

export type AppTab = 'student' | 'admin'
export type AdminTab = 'dashboard' | 'slots' | 'bookings' | 'settings'
export type StudentStep = 1 | 2 | 3

export interface StudentForm {
  name: string
  phone: string
  subject: string
  orderNumber: string
}

export interface SlotForm {
  date: string
  time: string
  capacity: string
}
