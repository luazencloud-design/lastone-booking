// ─── Domain Types ────────────────────────────────────────────────────────────

export interface Session {
  id: string
  subject: string          // 수강 과목
  date: string             // "YYYY-MM-DD"
  startTime: string        // "HH:MM"
  durationMinutes: number  // 소요 시간 (분)
  capacity: number
  bookedCount: number
  isFree: boolean
  customPriceEnabled: boolean
  price: number            // 0 = free, else actual price
}

export interface Booking {
  id: string
  sessionId: string
  name: string
  phone: string
  paymentMethod: PaymentMethod
  orderNumber: string      // 스마트스토어 주문번호 or 입금자명
  createdAt: string
}

export type PaymentMethod = 'card' | 'easypay' | 'transfer' | 'free'

export interface Settings {
  className: string
  defaultPrice: number
  smartStoreUrl: string
  bankName: string
  bankAccount: string
  bankHolder: string
  paymentMethods: {
    card: boolean
    easypay: boolean
    transfer: boolean
  }
}

export const DEFAULT_SETTINGS: Settings = {
  className: '라스트원 넥스트원 보충',
  defaultPrice: 20000,
  smartStoreUrl: '',
  bankName: '',
  bankAccount: '',
  bankHolder: '',
  paymentMethods: { card: true, easypay: true, transfer: true },
}

// ─── App State ───────────────────────────────────────────────────────────────

export type AppTab = 'student' | 'admin'
export type AdminTab = 'dashboard' | 'sessions' | 'bookings' | 'settings'
export type StudentStep = 1 | 2 | 3

export interface StudentForm {
  name: string
  phone: string
  paymentMethod: PaymentMethod | ''
  orderNumber: string
}

export interface SessionForm {
  subject: string
  date: string
  startTime: string
  durationMinutes: string
  capacity: string
  isFree: boolean
  customPriceEnabled: boolean
  customPrice: string
}
