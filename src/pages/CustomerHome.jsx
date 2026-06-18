import React, { useState } from 'react'
import { useStore } from '../lib/store'
import { Card, Btn, Badge } from '../components/ui'
import { getDaysInMonth, getDay } from 'date-fns'
import { useNavigate } from 'react-router-dom'

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

function nthWeekday(year, month, nth, weekday) {
  let count = 0
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month, d)
    if (date.getMonth() !== month) break
    if (date.getDay() === weekday) { count++; if (count === nth) return d }
  }
  return null
}
const shubun = y => Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4))
const shunbun = y => Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4))

function isHoliday(year, month, day) {
  const fixed = [[0,1],[1,11],[1,23],[3,29],[4,3],[4,4],[4,5],[7,11],[10,3],[10,23]]
  if (fixed.some(([m,d]) => m===month && d===day)) return true
  if (month===2 && day===shunbun(year)) return true
  if (month===8 && day===shubun(year)) return true
  if (month===6 && day===nthWeekday(year,6,3,1)) return true
  if (month===8 && day===nthWeekday(year,8,3,1)) return true
  if (month===9 && day===nthWeekday(year,9,2,1)) return true
  // 振替休日（月曜かつ前日が祝日）
  if (new Date(year,month,day).getDay()===1) {
    const pd=day-1, pm=month, py=year
    if (isHolidayFixed(py,pm,pd)) return true
  }
  return false
}
function isHolidayFixed(y,m,d) {
  const fixed=[[0,1],[1,11],[1,23],[3,29],[4,3],[4,4],[4,5],[7,11],[10,3],[10,23]]
  if (fixed.some(([fm,fd])=>fm===m&&fd===d)) return true
  if (m===2&&d===shunbun(y)) return true
  if (m===8&&d===shubun(y)) return true
  if (m===6&&d===nthWeekday(y,6,3,1)) return true
  if (m===8&&d===nthWeekday(y,8,3,1)) return true
  if (m===9&&d===nthWeekday(y,9,2,1)) return true
  return false
}
function isRestDay(year, month, day) {
  const dw = getDay(new Date(year, month, day))
  return dw === 0 || dw === 6 || isHoliday(year, month, day)
}

export default function CustomerHome() {
  const { settings, bookings, cancelBookingByToken, announcements } = useStore()
  const shopName = settings?.shopName || 'My Shop'
  const logoUrl = settings?.logoUrl || ''
  const shopDesc = settings?.shopDescription || ''
  const [cancelId, setCancelId] = useState('')
  const [cancelName, setCancelName] = useState('')
  const [cancelMsg, setCancelMsg] = useState(null)
  const navigate = useNavigate()
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)

  const days = getDaysInMonth(new Date(calYear, calMonth))
  const firstDay = getDay(new Date(calYear, calMonth, 1))

  const changeMonth = (delta) => {
    let m = calMonth + delta, y = calYear
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setCalYear(y); setCalMonth(m); setSelectedDate(null)
  }

  const getDateKey = (d) => `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

  const getBookingsForDay = (d) => bookings.filter(b => b.dateKey === getDateKey(d))

  const selectedDayBookings = selectedDate ? getBookingsForDay(selectedDate) : []
  const totalThisMonth = bookings.filter(b => {
    const [y, m] = (b.dateKey||'').split('-')
    return parseInt(y)===calYear && parseInt(m)-1===calMonth
  }).length

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', padding: '1rem' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {logoUrl
            ? <img src={logoUrl} alt="logo" style={{ width:48, height:48, borderRadius:'var(--radius)', objectFit:'cover', boxShadow:'var(--shadow)' }} onError={e=>e.target.style.display='none'} />
            : <div style={{ fontSize:36 }}>🗓️</div>
          }
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{shopName}</div>
            {shopDesc && <div style={{ fontSize: 13, color: 'var(--text2)' }}>{shopDesc}</div>}
          </div>
        </div>
      </div>

      {/* 今月の予約数サマリー */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 16 }}>
        <Card style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>今月の予約数</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{totalThisMonth}件</div>
        </Card>
        <Card style={{ padding: '12px 14px', background: 'var(--accent-light)', border: '1px solid rgba(37,99,235,0.2)' }}>
          <div style={{ fontSize: 11, color: 'var(--accent-text)', marginBottom: 4 }}>営業時間</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-text)' }}>
            {settings.slots[settings.enabledSlots[0]].split('〜')[0]}〜{settings.slots[settings.enabledSlots[settings.enabledSlots.length-1]].split('〜')[1]}
          </div>
        </Card>
      </div>

      {/* カレンダー */}
      <Card style={{ marginBottom: 16, padding: '1rem 0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Btn size="sm" onClick={() => changeMonth(-1)}>‹ 前月</Btn>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{calYear}年{calMonth+1}月</span>
          <Btn size="sm" onClick={() => changeMonth(1)}>次月 ›</Btn>
        </div>

        {/* 曜日ヘッダー */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 3, width: '100%' }}>
          {DAY_NAMES.map((d, i) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, padding: '3px 0',
              color: i===0?'var(--red)':i===6?'var(--accent)':'var(--text3)' }}>{d}</div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, width: '100%' }}>
          {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const d = i + 1
            const dw = getDay(new Date(calYear, calMonth, d))
            const dk = getDateKey(d)
            const dayBookings = bookings.filter(b => b.dateKey === dk)
            const isPast = new Date(calYear, calMonth, d) < new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const isToday = calYear===now.getFullYear() && calMonth===now.getMonth() && d===now.getDate()
            const isSel = selectedDate === d
            const hasBook = dayBookings.length > 0
            const isFull = settings.enabledSlots.every(i =>
              bookings.filter(b => b.dateKey===dk && b.slotIdx===i).length >= settings.maxPerSlot
            )
            const isRest = isRestDay(calYear, calMonth, d)
            const restColor = dw===0?'var(--red)':dw===6?'var(--accent)':'var(--text3)'

            return (
              <button key={d} onClick={() => { if(!isPast && !isRest) setSelectedDate(isSel ? null : d) }} style={{
                aspectRatio: '1', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--radius-sm)', border: isSel ? '2px solid var(--accent)' : isToday ? '2px solid var(--text)' : '1px solid var(--border)',
                background: isSel ? 'var(--accent)' : isRest ? 'var(--surface2)' : isFull && !isPast ? '#FEF2F2' : hasBook && !isPast ? 'var(--accent-light)' : 'var(--surface)',
                color: isSel ? '#fff' : isPast||isRest ? 'var(--text3)' : dw===0?'var(--red)':dw===6?'var(--accent)':'var(--text)',
                opacity: isPast ? 0.35 : 1,
                cursor: isPast || isRest ? 'default' : 'pointer',
                fontFamily: 'inherit', position: 'relative',
              }}>
                {isRest && !isPast ? (
                  <>
                    <span style={{ fontSize:11, color:restColor, lineHeight:1 }}>{d}</span>
                    <span style={{ fontSize:9, color:restColor, fontWeight:700, lineHeight:1, marginTop:1 }}>休</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 13, fontWeight: isToday||isSel ? 700 : 400 }}>{d}</span>
                    {hasBook && !isPast && !isSel && (
                      <span style={{ fontSize: 9, fontWeight: 700,
                        color: isFull ? 'var(--red-text)' : 'var(--accent-text)' }}>
                        {isFull ? '満' : `${dayBookings.length}`}
                      </span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>

        {/* 凡例 */}
        <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap' }}>
          <span><span style={{ display:'inline-block',width:10,height:10,borderRadius:2,background:'var(--accent-light)',border:'1px solid rgba(37,99,235,0.3)',verticalAlign:'middle',marginRight:3 }}></span>予約あり</span>
          <span><span style={{ display:'inline-block',width:10,height:10,borderRadius:2,background:'#FEF2F2',border:'1px solid rgba(220,38,38,0.3)',verticalAlign:'middle',marginRight:3 }}></span>満員</span>
          <span style={{ color:'var(--text3)' }}>← 日付をタップで詳細</span>
        </div>
      </Card>

      {/* 選択した日の詳細 */}
      {selectedDate && (
        <Card style={{ marginBottom: 16, borderLeft: '3px solid var(--accent)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            {calMonth+1}月{selectedDate}日（{DAY_NAMES[getDay(new Date(calYear, calMonth, selectedDate))]}）の空き状況
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 12 }}>
            {settings.enabledSlots.map(i => {
              const cnt = bookings.filter(b => b.dateKey===getDateKey(selectedDate) && b.slotIdx===i).length
              const full = cnt >= settings.maxPerSlot
              return (
                <div key={i} style={{
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  background: full ? '#FEF2F2' : 'var(--green-light)',
                  border: `1px solid ${full ? 'rgba(220,38,38,0.2)' : 'rgba(22,163,74,0.2)'}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: full ? 'var(--red-text)' : 'var(--green-text)' }}>
                    {settings.slots[i]}
                  </div>
                  <div style={{ fontSize: 11, color: full ? 'var(--red-text)' : 'var(--green-text)', marginTop: 2 }}>
                    {full ? '❌ 満員' : `残り ${settings.maxPerSlot - cnt} 枠`}
                  </div>
                </div>
              )
            })}
          </div>
          {!settings.enabledSlots.every(i => bookings.filter(b => b.dateKey===getDateKey(selectedDate) && b.slotIdx===i).length >= settings.maxPerSlot) && (
            <Btn variant="primary" size="lg" style={{ width: '100%' }}
              onClick={() => navigate('/book', { state: { year: calYear, month: calMonth, date: selectedDate } })}>
              この日に予約する →
            </Btn>
          )}
        </Card>
      )}

      {/* お知らせ */}
      {announcements.length > 0 && (
        <Card style={{ marginBottom: 16, borderLeft: '3px solid #EC4899' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📣 お知らせ</div>
          {announcements.slice(0,3).map(a => (
            <div key={a.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{a.title}</div>
              {a.body && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{a.body}</div>}
            </div>
          ))}
        </Card>
      )}

      {/* 予約キャンセル */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🗑️ 予約をキャンセルする</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>予約時のお名前を入力してキャンセルできます</div>
        <input type="text" value={cancelName} onChange={e => { setCancelName(e.target.value); setCancelMsg(null) }} placeholder="予約時のお名前" style={{ width:'100%', padding:'10px 14px', fontSize:14, borderRadius:'var(--radius-sm)', border:'2px solid var(--border-strong)', background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', marginBottom:10 }} />
        {cancelMsg && <div style={{ fontSize:12, fontWeight:700, marginBottom:10, color:cancelMsg.ok?'var(--green-text)':'var(--red-text)' }}>{cancelMsg.ok?'✅':'❌'} {cancelMsg.text}</div>}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {cancelName.trim().length > 0 && bookings.filter(b => b.name === cancelName.trim()).map(b => (
            <div key={b.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'var(--surface2)', borderRadius:'var(--radius-sm)', border:'1.5px solid var(--border)' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700 }}>{b.date}</div>
                <div style={{ fontSize:12, color:'var(--text2)' }}>{b.slot}</div>
              </div>
              {(() => {
                // 前日24時までキャンセル可能
                const bookingDate = new Date(b.dateKey)
                const deadline = new Date(bookingDate)
                deadline.setDate(deadline.getDate() - 1)
                deadline.setHours(23, 59, 59, 999)
                const canCancel = new Date() <= deadline
                return canCancel
                  ? <button onClick={() => { if(confirm('この予約をキャンセルしますか？')){ const ok=cancelBookingByToken(b.id,b.name); setCancelMsg(ok?{ok:true,text:'キャンセルしました'}:{ok:false,text:'キャンセルできませんでした'}) } }} style={{ padding:'7px 14px', fontSize:12, fontWeight:700, borderRadius:'var(--radius-sm)', border:'none', background:'var(--red-light)', color:'var(--red-text)', cursor:'pointer', fontFamily:'inherit' }}>キャンセル</button>
                  : <span style={{ fontSize:11, color:'var(--text3)', fontWeight:600 }}>期限切れ</span>
              })()}
            </div>
          ))}
        </div>
      </Card>

      {/* 予約ボタン */}
      {!selectedDate && (
        <Btn variant="primary" size="lg" style={{ width: '100%', padding: '16px', fontSize: 15 }}
          onClick={() => navigate('/book')}>
          🗓️ 予約する
        </Btn>
      )}
    </div>
  )
}
