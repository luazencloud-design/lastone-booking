const { Redis } = require('@upstash/redis')

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const KEYS = {
  sessions: 'ln:sessions',
  bookings: 'ln:bookings',
  settings: 'ln:settings',
}

function checkAdmin(req) {
  return req.headers['x-admin-password'] === process.env.ADMIN_PASSWORD
}

module.exports = { redis, KEYS, checkAdmin }
