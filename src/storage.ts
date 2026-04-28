import type { Slot, Booking, Settings } from './types'

/**
 * Storage abstraction layer.
 *
 * Currently uses localStorage — data is per-browser.
 *
 * ── To migrate to Firebase Firestore ────────────────────────────────────────
 * 1. npm install firebase
 * 2. Create src/firebase.ts with your config:
 *      import { initializeApp } from 'firebase/app'
 *      import { getFirestore } from 'firebase/firestore'
 *      export const db = getFirestore(initializeApp({ ... }))
 * 3. Replace each function below with Firestore read/write calls.
 *    Example for loadSlots():
 *      import { collection, getDocs } from 'firebase/firestore'
 *      const snap = await getDocs(collection(db, 'slots'))
 *      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Slot))
 * ────────────────────────────────────────────────────────────────────────────
 */

const KEY_SLOTS    = 'ln_slots'
const KEY_BOOKINGS = 'ln_bookings'
const KEY_SETTINGS = 'ln_settings'

export const DEFAULT_SETTINGS: Settings = {
  className:     '라스트원 넥스트원 보충',
  price:         20000,
  smartStoreUrl: '',
  adminPassword: '1234',
}

// ── Slots ────────────────────────────────────────────────────────────────────

export function loadSlots(): Slot[] {
  try {
    const raw = localStorage.getItem(KEY_SLOTS)
    return raw ? (JSON.parse(raw) as Slot[]) : []
  } catch {
    return []
  }
}

export function saveSlots(slots: Slot[]): void {
  localStorage.setItem(KEY_SLOTS, JSON.stringify(slots))
}

// ── Bookings ─────────────────────────────────────────────────────────────────

export function loadBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(KEY_BOOKINGS)
    return raw ? (JSON.parse(raw) as Booking[]) : []
  } catch {
    return []
  }
}

export function saveBookings(bookings: Booking[]): void {
  localStorage.setItem(KEY_BOOKINGS, JSON.stringify(bookings))
}

// ── Settings ─────────────────────────────────────────────────────────────────

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS)
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings))
}
