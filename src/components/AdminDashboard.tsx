import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Tooltip, Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import type { Slot, Booking, Settings } from '../types'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

interface Props {
  slots: Slot[]
  bookings: Booking[]
  settings: Settings
}

function barColor(slot: Slot): string {
  const full = slot.bookedCount >= slot.capacity
  const few  = slot.bookedCount >= slot.capacity * 0.7 && !full
  return full ? '#E24B4A' : few ? '#BA7517' : '#185FA5'
}

export default function AdminDashboard({ slots, bookings, settings }: Props) {
  const today = new Date().toISOString().slice(0, 10)

  const totalBookings = bookings.length
  const totalRev      = totalBookings * settings.price
  const todayN        = bookings.filter(b => b.createdAt.startsWith(today)).length
  const totalSeats    = slots.reduce((a, s) => a + s.capacity, 0)
  const filledSeats   = slots.reduce((a, s) => a + s.bookedCount, 0)
  const utilPct       = totalSeats > 0 ? Math.round((filledSeats / totalSeats) * 100) : 0

  const sorted = [...slots].sort((a, b) => a.date.localeCompare(b.date))

  // ── Bar Chart Data ────────────────────────────────────────────────────────
  const barData = {
    labels: sorted.map(s => `${s.date.slice(5)}(${s.time})`),
    datasets: [
      {
        label: '신청',
        data: sorted.map(s => s.bookedCount),
        backgroundColor: '#185FA5',
        borderRadius: 4,
      },
      {
        label: '잔여',
        data: sorted.map(s => Math.max(0, s.capacity - s.bookedCount)),
        backgroundColor: 'rgba(0,0,0,0.06)',
        borderRadius: 4,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y}명` } },
    },
    scales: {
      x: {
        stacked: true,
        ticks: { color: '#888780', font: { size: 10 } },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      y: {
        stacked: true,
        ticks: { color: '#888780', font: { size: 10 }, stepSize: 1 },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
    },
  }

  // ── Donut Chart Data ──────────────────────────────────────────────────────
  const donutData = {
    labels: ['신청 완료', '잔여 좌석'],
    datasets: [{
      data: [filledSeats, Math.max(0, totalSeats - filledSeats)],
      backgroundColor: ['#185FA5', 'rgba(0,0,0,0.07)'],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  }

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%' as const,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${ctx.parsed}석` } },
    },
  }

  const recent = [...bookings]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  return (
    <>
      {/* ── Metrics ─────────────────────────────────────────────────────── */}
      <div className="metric-grid">
        <div className="metric">
          <div className="metric-val">{totalBookings}</div>
          <div className="metric-lbl">총 신청</div>
        </div>
        <div className="metric">
          <div className="metric-val" style={{ fontSize: 16 }}>₩{totalRev.toLocaleString()}</div>
          <div className="metric-lbl">예상 수입</div>
        </div>
        <div className="metric">
          <div className="metric-val">{utilPct}%</div>
          <div className="metric-lbl">전체 충원율</div>
        </div>
        <div className="metric">
          <div className="metric-val">{todayN}</div>
          <div className="metric-lbl">오늘 신청</div>
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            등록된 날짜가 없습니다.<br />날짜 관리 탭에서 보충 날짜를 추가해주세요.
          </div>
        </div>
      ) : (
        <>
          {/* ── Charts ──────────────────────────────────────────────────── */}
          <div className="charts-row">
            <div className="chart-card">
              <div className="card-title">날짜별 신청 현황</div>
              <div style={{ height: 200 }}>
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
            <div className="chart-card">
              <div className="card-title">전체 좌석 현황</div>
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                <div style={{ height: 150, width: '100%' }}>
                  <Doughnut data={donutData} options={donutOptions} />
                </div>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                  {['신청 완료', '잔여 좌석'].map((label, i) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? '#185FA5' : 'rgba(0,0,0,0.15)', flexShrink: 0 }} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Utilization Bars ────────────────────────────────────────── */}
          <div className="card">
            <div className="card-title">날짜별 충원율</div>
            {sorted.map(sl => {
              const pct = sl.capacity > 0 ? Math.round((sl.bookedCount / sl.capacity) * 100) : 0
              return (
                <div key={sl.id} className="util-row">
                  <div className="util-label">
                    <span>{sl.date} {sl.time}</span>
                    <span>{sl.bookedCount}/{sl.capacity}명 ({pct}%)</span>
                  </div>
                  <div className="util-track">
                    <div className="util-fill" style={{ width: `${pct}%`, background: barColor(sl) }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Recent Bookings ──────────────────────────────────────────── */}
          {recent.length > 0 && (
            <div className="card">
              <div className="card-title">최근 신청 내역</div>
              {recent.map(bk => {
                const sl = slots.find(s => s.id === bk.slotId)
                return (
                  <div key={bk.id} className="bk-row">
                    <div>
                      <div className="bk-name">{bk.name}</div>
                      <div className="bk-meta">
                        {bk.subject} · {sl ? `${sl.date} ${sl.time}` : '—'}
                      </div>
                    </div>
                    <span className="badge badge-blue">{bk.orderNumber}</span>
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
