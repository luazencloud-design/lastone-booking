import { Redis } from '@upstash/redis'

// Upstash Redis — env vars set in Vercel dashboard:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
export const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const KEYS = {
  sessions: 'ln:sessions',
  bookings: 'ln:bookings',
  settings: 'ln:settings',
} as const

export function checkAdmin(req: { headers: { [key: string]: string | string[] | undefined } }): boolean {
  const pw = req.headers['x-admin-password']
  return pw === process.env.ADMIN_PASSWORD
}
