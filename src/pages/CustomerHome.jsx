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
  const [cancelName, setCancelName] = useState('')
  const [cancelMsg, setCancelMsg] = useState(null)
  const [cancelConfirmId, setCancelConfirmId] = useState(null) // インライン確認中のbooking id
  const [showCancelSection, setShowCancelSection] = useState(false)
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

  // 選択日が全時間帯満員か
  const selectedDateFull = selectedDate && settings.enabledSlots.every(i =>
    bookings.filter(b => b.dateKey===getDateKey(selectedDate) && b.slotIdx===i).length >= settings.maxPerSlot
  )

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', padding: '1rem' }}>

      {/* ショップヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {logoUrl
          ? <img src={logoUrl} alt="logo" style={{ width:48, height:48, borderRadius:'var(--radius)', objectFit:'cover', boxShadow:'var(--shadow)' }} onError={e=>e.target.style.display='none'} />
          : <div style={{ fontSize:36 }}>🗓️</div>
        }
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{shopName}</div>
          {shopDesc && <div style={{ fontSize: 13, color: 'var(--text2)' }}>{shopDesc}</div>}
        </div>
      </div>

      {/* ① メインCTAボタン（一番目立つ場所に） */}
      <button
        onClick={() => navigate('/book')}
        style={{
          width: '100%', padding: '20px 16px', marginBottom: 20,
          background: 'var(--wood-gradient)', color: '#FDF5E8',
          border: '1.5px solid rgba(92,64,32,0.4)', borderRadius: 'var(--radius)',
          fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 4px 16px rgba(101,79,54,0.35)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        }}>
        <span>🗓️ 予約する</span>
        <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.85 }}>かんたん3ステップで予約できます</span>
      </button>

      {/* ② 使い方3ステップ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
        {[
          { num: '①', icon: '📅', label: '日付を選ぶ' },
          { num: '②', icon: '🕐', label: '時間を選ぶ' },
          { num: '③', icon: '✍️', label: '名前を入力' },
        ].map(s => (
          <div key={s.num} style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginBottom: 3 }}>{s.num}</div>
            <div style={{ fontSize: 20, marginBottom: 3 }}>{s.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>{s.label}</div>
          </div>
        ))}
      </div>

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

      {/* 営業時間 */}
      <Card style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--accent-light)', border: '1px solid rgba(37,99,235,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--accent-text)', marginBottom: 2, fontWeight: 600 }}>🕐 営業時間</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-text)' }}>
              {settings.slots[settings.enabledSlots[0]].split('〜')[0]}〜{settings.slots[settings.enabledSlots[settings.enabledSlots.length-1]].split('〜')[1]}
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--accent-text)', textAlign: 'right' }}>
            <div>平日のみ営業</div>
            <div>土日祝はお休み</div>
          </div>
        </div>
      </Card>

      {/* ③ カレンダー（空き確認用） */}
      <Card style={{ marginBottom: 16, padding: '1rem 0.75rem' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>📌 空き状況カレンダー</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>気になる日をタップして空き確認できます</div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Btn size="sm" onClick={() => changeMonth(-1)}>‹ 前月</Btn>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{calYear}年{calMonth+1}月</span>
          <Btn size="sm" onClick={() => changeMonth(1)}>次月 ›</Btn>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 3, width: '100%' }}>
          {DAY_NAMES.map((d, i) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, padding: '3px 0',
              color: i===0?'var(--red)':i===6?'var(--accent)':'var(--text3)' }}>{d}</div>
          ))}
        </div>

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
                borderRadius: 'var(--radius-sm)',
                border: isSel ? '2px solid var(--accent)' : isToday ? '2px solid var(--text)' : '1px solid var(--border)',
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
                      <span style={{ fontSize: 9, fontWeight: 700, color: isFull ? 'var(--red-text)' : 'var(--accent-text)' }}>
                        {isFull ? '満' : `${dayBookings.length}`}
                      </span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap' }}>
          <span><span style={{ display:'inline-block',width:10,height:10,borderRadius:2,background:'var(--accent-light)',border:'1px solid rgba(37,99,235,0.3)',verticalAlign:'middle',marginRight:3 }}></span>予約あり</span>
          <span><span style={{ display:'inline-block',width:10,height:10,borderRadius:2,background:'#FEF2F2',border:'1px solid rgba(220,38,38,0.3)',verticalAlign:'middle',marginRight:3 }}></span>満員</span>
          <span><span style={{ display:'inline-block',width:10,height:10,borderRadius:2,background:'var(--surface2)',border:'1px solid var(--border)',verticalAlign:'middle',marginRight:3 }}></span>休業</span>
        </div>
      </Card>

      {/* ④ 日付選択後：空き詳細＋予約ボタン */}
      {selectedDate && (
        <Card style={{ marginBottom: 16, borderLeft: '3px solid var(--accent)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            {calMonth+1}月{selectedDate}日（{DAY_NAMES[getDay(new Date(calYear, calMonth, selectedDate))]}）の空き状況
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 16 }}>
            {settings.enabledSlots.map(i => {
              const cnt = bookings.filter(b => b.dateKey===getDateKey(selectedDate) && b.slotIdx===i).length
              const full = cnt >= settings.maxPerSlot
              return (
                <div key={i} style={{
                  padding: '12px', borderRadius: 'var(--radius-sm)',
                  background: full ? '#FEF2F2' : 'var(--green-light)',
                  border: `1.5px solid ${full ? 'rgba(220,38,38,0.25)' : 'rgba(22,163,74,0.25)'}`,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: full ? 'var(--red-text)' : 'var(--green-text)' }}>
                    {settings.slots[i]}
                  </div>
                  <div style={{ fontSize: 12, color: full ? 'var(--red-text)' : 'var(--green-text)', marginTop: 4, fontWeight: 600 }}>
                    {full ? '❌ 満員' : `✅ 残り ${settings.maxPerSlot - cnt} 枠`}
                  </div>
                </div>
              )
            })}
          </div>
          {!selectedDateFull ? (
            <button
              onClick={() => navigate('/book', { state: { year: calYear, month: calMonth, date: selectedDate } })}
              style={{
                width: '100%', padding: '18px', fontSize: 16, fontWeight: 700,
                background: 'var(--wood-gradient)', color: '#FDF5E8',
                border: '1.5px solid rgba(92,64,32,0.4)', borderRadius: 'var(--radius)',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 3px 12px rgba(101,79,54,0.3)',
              }}>
              この日を予約する →
            </button>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px', background: '#FEF2F2', borderRadius: 'var(--radius-sm)', color: 'var(--red-text)', fontWeight: 600, fontSize: 13 }}>
              😢 この日はすべて満員です。別の日をお選びください。
            </div>
          )}
        </Card>
      )}

      {/* ⑤ 予約キャンセル（折りたたみ） */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => { setShowCancelSection(!showCancelSection); setCancelName(''); setCancelMsg(null); setCancelConfirmId(null) }}
          style={{
            width: '100%', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: showCancelSection ? 'var(--radius) var(--radius) 0 0' : 'var(--radius)',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--text2)',
          }}>
          <span>🗑️ 予約のキャンセルはこちら</span>
          <span style={{ fontSize: 11 }}>{showCancelSection ? '▲ 閉じる' : '▼ 開く'}</span>
        </button>

        {showCancelSection && (
          <div style={{ padding: '16px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.6 }}>
              予約時のお名前を入力すると、キャンセルできます。<br/>
              ⚠️ キャンセルは前日までです。
            </div>
            <input
              type="text"
              value={cancelName}
              onChange={e => { setCancelName(e.target.value); setCancelMsg(null); setCancelConfirmId(null) }}
              placeholder="予約時のお名前（例：山田 花子）"
              style={{ width: '100%', padding: '12px 14px', fontSize: 14, borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box' }}
            />

            {cancelMsg && (
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: cancelMsg.ok ? 'var(--green-light)' : '#FEF2F2', color: cancelMsg.ok ? 'var(--green-text)' : 'var(--red-text)' }}>
                {cancelMsg.ok ? '✅' : '❌'} {cancelMsg.text}
              </div>
            )}

            {cancelName.trim().length > 0 && bookings.filter(b => b.name === cancelName.trim()).length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text3)', padding: '10px', textAlign: 'center' }}>
                「{cancelName}」の予約が見つかりません
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cancelName.trim().length > 0 && bookings.filter(b => b.name === cancelName.trim()).map(b => {
                const bookingDate = new Date(b.dateKey)
                const deadline = new Date(bookingDate)
                deadline.setDate(deadline.getDate() - 1)
                deadline.setHours(23, 59, 59, 999)
                const canCancel = new Date() <= deadline
                const isConfirming = cancelConfirmId === b.id

                return (
                  <div key={b.id} style={{ borderRadius: 'var(--radius-sm)', border: `1.5px solid ${isConfirming ? '#DC2626' : 'var(--border)'}`, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--surface2)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{b.date}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{b.slot}</div>
                      </div>
                      {canCancel ? (
                        <button
                          onClick={() => setCancelConfirmId(isConfirming ? null : b.id)}
                          style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, borderRadius: 'var(--radius-sm)', border: 'none', background: isConfirming ? '#DC2626' : 'var(--red-light)', color: isConfirming ? '#fff' : 'var(--red-text)', cursor: 'pointer', fontFamily: 'inherit' }}>
                          キャンセル
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, padding: '4px 8px', background: 'var(--surface)', borderRadius: 4 }}>期限切れ</span>
                      )}
                    </div>
                    {isConfirming && (
                      <div style={{ padding: '12px 14px', background: '#FEF2F2', borderTop: '1px solid rgba(220,38,38,0.2)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red-text)', marginBottom: 10 }}>
                          ⚠️ 本当にキャンセルしますか？
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--red-text)', marginBottom: 12 }}>
                          {b.date}　{b.slot}<br/>
                          キャンセル後は元に戻せません。
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => {
                              const ok = cancelBookingByToken(b.id, b.name)
                              setCancelMsg(ok ? { ok: true, text: 'キャンセルしました' } : { ok: false, text: 'キャンセルできませんでした' })
                              setCancelConfirmId(null)
                            }}
                            style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, borderRadius: 'var(--radius-sm)', border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                            はい、キャンセルする
                          </button>
                          <button
                            onClick={() => setCancelConfirmId(null)}
                            style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>
                            やめる
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
