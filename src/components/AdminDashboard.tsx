import type { Session, Booking, Settings } from '../types'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

interface Props {
  sessions: Session[]
  bookings: Booking[]
  settings: Settings
  adminPw: string
  onSessionsChange: (s: Session[]) => void
  onBookingsChange: (b: Booking[]) => void
  onRefresh: () => Promise<void>
}

function barColor(s: Session) {
  const full = s.bookedCount >= s.capacity
  return full ? '#E24B4A' : s.bookedCount >= s.capacity * 0.7 ? '#BA7517' : '#185FA5'
}

function endTime(startTime: string, dur: number) {
  const [h, m] = startTime.split(':').map(Number)
  const total = h * 60 + m + dur
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`
}

export default function AdminDashboard({ sessions, bookings, settings }: Props) {
  const today     = new Date().toISOString().slice(0, 10)
  const todayN    = bookings.filter(b => b.createdAt.startsWith(today)).length
  const totalRev  = bookings.reduce((acc, bk) => {
    const s = sessions.find(s => s.id === bk.sessionId)
    return acc + (s?.price ?? 0)
  }, 0)
  const totalSeats  = sessions.reduce((a, s) => a + s.capacity, 0)
  const filledSeats = sessions.reduce((a, s) => a + s.bookedCount, 0)
  const utilPct     = totalSeats > 0 ? Math.round((filledSeats / totalSeats) * 100) : 0

  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))

  const barData = {
    labels: sorted.map(s => `${s.subject}\n${s.date.slice(5)}`),
    datasets: [
      { label: '신청', data: sorted.map(s => s.bookedCount),                           backgroundColor: '#185FA5', borderRadius: 4 },
      { label: '잔여', data: sorted.map(s => Math.max(0, s.capacity - s.bookedCount)), backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 4 },
    ],
  }
  const chartOpts: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => `${c.dataset.label}: ${c.parsed.y}명` } } },
    scales: {
      x: { stacked: true, ticks: { color: '#888780', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
      y: { stacked: true, ticks: { color: '#888780', font: { size: 10 }, stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
    },
  }

  const donutData = {
    labels: ['신청 완료', '잔여 좌석'],
    datasets: [{ data: [filledSeats, Math.max(0, totalSeats - filledSeats)], backgroundColor: ['#185FA5', 'rgba(0,0,0,0.07)'], borderWidth: 0 }],
  }
  const donutOpts: any = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => `${c.label}: ${c.parsed}석` } } },
  }

  const recent = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  return (
    <>
      <div className="metric-grid">
        <div className="metric"><div className="metric-val">{bookings.length}</div><div className="metric-lbl">총 신청</div></div>
        <div className="metric"><div className="metric-val" style={{ fontSize: 16 }}>₩{totalRev.toLocaleString()}</div><div className="metric-lbl">예상 수입</div></div>
        <div className="metric"><div className="metric-val">{utilPct}%</div><div className="metric-lbl">충원율</div></div>
        <div className="metric"><div className="metric-val">{todayN}</div><div className="metric-lbl">오늘 신청</div></div>
      </div>

      {sessions.length === 0 ? (
        <div className="card"><div className="empty-state">세션을 추가하면 차트가 표시됩니다.</div></div>
      ) : (
        <>
          <div className="charts-row">
            <div className="chart-card">
              <div className="card-title">세션별 신청 현황</div>
              <div style={{ height: 200 }}><Bar data={barData} options={chartOpts} /></div>
            </div>
            <div className="chart-card">
              <div className="card-title">전체 좌석 현황</div>
              <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <div style={{ height: 140, width: '100%' }}><Doughnut data={donutData} options={donutOpts} /></div>
                <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                  {['신청 완료', '잔여 좌석'].map((label, i) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#185FA5' : 'rgba(0,0,0,0.15)' }} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">세션별 충원율</div>
            {sorted.map(s => {
              const pct = s.capacity > 0 ? Math.round((s.bookedCount / s.capacity) * 100) : 0
              return (
                <div key={s.id} className="util-row">
                  <div className="util-label">
                    <span>{s.subject} · {s.date} {s.startTime}–{endTime(s.startTime, s.durationMinutes)}</span>
                    <span>{s.bookedCount}/{s.capacity}명 ({pct}%)</span>
                  </div>
                  <div className="util-track">
                    <div className="util-fill" style={{ width: `${pct}%`, background: barColor(s) }} />
                  </div>
                </div>
              )
            })}
          </div>

          {recent.length > 0 && (
            <div className="card">
              <div className="card-title">최근 신청 내역</div>
              {recent.map(bk => {
                const s = sessions.find(x => x.id === bk.sessionId)
                return (
                  <div key={bk.id} className="bk-row">
                    <div>
                      <div className="bk-name">{bk.name}</div>
                      <div className="bk-meta">{s ? `${s.subject} · ${s.date} ${s.startTime}` : '—'}</div>
                    </div>
                    <span className="badge badge-blue">{bk.paymentMethod === 'free' ? '무료' : bk.orderNumber}</span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </>
  )
}
