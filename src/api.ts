import type { Session, Booking, Settings } from './types'

const BASE = '/api'

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...opts?.headers },
      ...opts,
    })
  } catch (e: any) {
    // 네트워크 오류 (API 라우트 자체에 못 닿은 경우)
    throw new Error(`네트워크 오류 - API에 연결할 수 없습니다: ${e.message || ''}`)
  }

  if (!res.ok) {
    // HTTP/2는 statusText가 빈 문자열 → 상태코드로 폴백
    const fallback = `HTTP ${res.status} 오류`
    let errMsg = fallback
    try {
      const json = await res.json()
      errMsg = json.error || fallback
    } catch {
      errMsg = fallback
    }
    throw new Error(errMsg)
  }
  return res.json()
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function verifyAdmin(password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await req('/auth', { method: 'POST', body: JSON.stringify({ password }) })
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message || '알 수 없는 오류' }
  }
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const getSessions   = ()                       => req<Session[]>('/sessions')
export const createSession = (s: Session, pw: string) =>
  req<Session>('/sessions', { method: 'POST', body: JSON.stringify(s), headers: { 'x-admin-password': pw } })
export const deleteSession = (id: string, pw: string) =>
  req<void>('/sessions', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'x-admin-password': pw } })

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const getBookings   = (pw: string)    => req<Booking[]>("/bookings", { headers: { "x-admin-password": pw } })
export const createBooking = (b: Booking)  => req<Booking>('/bookings', { method: 'POST', body: JSON.stringify(b) })
export const deleteBooking = (id: string, pw: string) =>
  req<void>('/bookings', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'x-admin-password': pw } })

// ─── Settings ─────────────────────────────────────────────────────────────────
export const getSettings    = ()                         => req<Settings>('/settings')
export const updateSettings = (s: Settings, pw: string) =>
  req<Settings>('/settings', { method: 'PUT', body: JSON.stringify(s), headers: { 'x-admin-password': pw } })
