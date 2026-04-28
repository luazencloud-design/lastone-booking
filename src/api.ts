import type { Session, Booking, Settings } from './types'

const BASE = '/api'

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function verifyAdmin(password: string): Promise<boolean> {
  try {
    await req('/auth', { method: 'POST', body: JSON.stringify({ password }) })
    return true
  } catch {
    return false
  }
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const getSessions  = ()                    => req<Session[]>('/sessions')
export const createSession = (s: Session, pw: string) =>
  req<Session>('/sessions', { method: 'POST', body: JSON.stringify(s), headers: { 'x-admin-password': pw } })
export const deleteSession = (id: string, pw: string) =>
  req<void>('/sessions', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'x-admin-password': pw } })

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const getBookings   = ()                     => req<Booking[]>('/bookings')
export const createBooking = (b: Booking)            => req<Booking>('/bookings', { method: 'POST', body: JSON.stringify(b) })
export const deleteBooking = (id: string, pw: string) =>
  req<void>('/bookings', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'x-admin-password': pw } })

// ─── Settings ─────────────────────────────────────────────────────────────────
export const getSettings   = ()                          => req<Settings>('/settings')
export const updateSettings = (s: Settings, pw: string)  =>
  req<Settings>('/settings', { method: 'PUT', body: JSON.stringify(s), headers: { 'x-admin-password': pw } })
