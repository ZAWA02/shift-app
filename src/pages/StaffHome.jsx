import React, { useState } from 'react'
import { useStore } from '../lib/store'
import { Card, Badge, Avatar, Btn, Divider } from '../components/ui'
import { getDaysInMonth, getDay } from 'date-fns'
import { useNavigate } from 'react-router-dom'

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

export default function StaffHome() {
  const { staff, wishes, shifts, shiftMonth, addWorkReport, workReports, announcements, confirmedShifts, bookings, settings } = useStore()
  const navigate = useNavigate()
  const now = new Date()
  const [selYear, setSelYear] = useState(shiftMonth.year)
  const [selMonth, setSelMonth] = useState(shiftMonth.month)
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [reportDate, setReportDate] = useState('')
  const [reportHours, setReportHours] = useState('')
  const [reportMemo, setReportMemo] = useState('')
  const [reportDone, setReportDone] = useState(false)

  const mk = `${selYear}-${String(selMonth+1).padStart(2,'0')}`
  const monthShifts = shifts[mk] || {}
  const monthWishes = wishes[mk] || {}
  const days = getDaysInMonth(new Date(selYear, selMonth))
  const firstDay = getDay(new Date(selYear, selMonth, 1))

  const changeMonth = (delta) => {
    let m = selMonth + delta, y = selYear
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setSelYear(y); setSelMonth(m)
  }

  const selectedStaff = staff.find(s => s.id === selectedStaffId)
  const myShifts = selectedStaffId ? (monthShifts[selectedStaffId] || {}) : {}
  const myShiftDays = Object.keys(myShifts).filter(d => myShifts[d]).map(d => parseInt(d)+1).sort((a,b)=>a-b)

  // この月のシフト日を選択肢に
  const shiftDateOptions = myShiftDays.map(d => {
    const dw = getDay(new Date(selYear, selMonth, d))
    const dk = `${selYear}-${String(selMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return { label: `${selMonth+1}月${d}日（${DAY_NAMES[dw]}）`, value: dk }
  })

  const submitReport = () => {
    if (!selectedStaffId) return alert('名前を選んでください')
    if (!reportDate) return alert('日付を選んでください')
    if (!reportHours || parseFloat(reportHours) <= 0) return alert('労働時間を入力してください')
    addWorkReport({
      staffId: selectedStaffId,
      staffName: selectedStaff?.name || '',
      date: reportDate,
      hours: parseFloat(reportHours),
      memo: reportMemo,
    })
    setReportDone(true)
    setReportHours('')
    setReportMemo('')
    setReportDate('')
  }

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>スタッフページ</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>シフト確認・希望入力・勤務報告</div>
        </div>
        <div style={{ fontSize: 28 }}>👤</div>
      </div>

      {/* スタッフ選択 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>あなたの名前を選んでください</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
          {staff.map((s, i) => {
            const isSel = selectedStaffId === s.id
            const hasWish = Object.keys(monthWishes[s.id] || {}).length > 0
            return (
              <button key={s.id} onClick={() => { setSelectedStaffId(isSel ? '' : s.id); setShowReport(false); setReportDone(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                borderRadius: 'var(--radius)', border: isSel ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: isSel ? 'var(--accent-light)' : 'var(--surface)',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}>
                <Avatar name={s.name} size={30} colorIndex={i} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isSel ? 'var(--accent-text)' : 'var(--text)' }}>{s.name.split(' ')[0]}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>{s.role}</div>
                </div>
                {hasWish && <span style={{ fontSize: 10, color: 'var(--green-text)', fontWeight: 600 }}>✓</span>}
              </button>
            )
          })}
        </div>
      </Card>

      {/* お知らせ */}
      {announcements.length > 0 && (
        <Card style={{ marginBottom: 16, borderLeft: '3px solid #EC4899' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📣 お知らせ</div>
          {announcements.slice(0,3).map(a => (
            <div key={a.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{a.title}</div>
              {a.body && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{a.body}</div>}
            </div>
          ))}
        </Card>
      )}

      {/* 月切り替え */}
      <Card style={{ marginBottom: 16, padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Btn size="sm" onClick={() => changeMonth(-1)}>‹</Btn>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700 }}>{selYear}年{selMonth+1}月</div>
          <Btn size="sm" onClick={() => changeMonth(1)}>›</Btn>
        </div>
      </Card>

      {/* シフトカレンダー */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            📅 {selectedStaff ? `${selectedStaff.name.split(' ')[0]}さんの` : ''}{selYear}年{selMonth+1}月のシフト
          </div>
          {(() => {
            const mk2 = `${selYear}-${String(selMonth+1).padStart(2,'0')}`
            const confirmed = !!confirmedShifts[mk2]
            return confirmed
              ? <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:999, background:'var(--green-light)', color:'var(--green-text)', border:'1px solid rgba(74,124,89,0.25)' }}>✅ 確定済み</span>
              : <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600, padding:'4px 12px', borderRadius:999, background:'var(--amber-light)', color:'var(--amber-text)', border:'1px solid rgba(193,127,58,0.25)' }}>⏳ 調整中</span>
          })()}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 4 }}>
          {DAY_NAMES.map((d, i) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, padding: '4px 0',
              color: i===0?'var(--red)':i===6?'var(--accent)':'var(--text3)' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
          {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const d = i + 1
            const dw = getDay(new Date(selYear, selMonth, d))
            const dayIdx = d - 1
            const hasShift = selectedStaffId ? !!myShifts[dayIdx] : staff.some(s => (monthShifts[s.id]||{})[dayIdx])
            const isNg = (monthWishes[selectedStaffId]||{})[dayIdx] === 'ng'
            const isToday = selYear===now.getFullYear() && selMonth===now.getMonth() && d===now.getDate()
            const staffCount = selectedStaffId ? null : staff.filter(s => (monthShifts[s.id]||{})[dayIdx]).length
            return (
              <div key={d} style={{
                aspectRatio: '1', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)',
                border: isToday ? '2px solid var(--text)' : '1px solid var(--border)',
                background: hasShift ? (selectedStaffId ? '#DCFCE7' : '#E6F1FB') : isNg ? '#FEF2F2' : 'var(--surface)',
              }}>
                <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 400,
                  color: hasShift ? (selectedStaffId ? 'var(--green-text)' : 'var(--accent-text)') : isNg ? 'var(--red-text)' : dw===0?'var(--red)':dw===6?'var(--accent)':'var(--text)',
                }}>
                  {hasShift && selectedStaffId ? '◯' : d}
                </span>
                {!selectedStaffId && staffCount > 0 && (
                  <span style={{ fontSize: 9, color: 'var(--accent-text)', fontWeight: 700 }}>{staffCount}人</span>
                )}
                {selectedStaffId && isNg && !hasShift && (
                  <span style={{ fontSize: 9, color: 'var(--red-text)' }}>×</span>
                )}
              </div>
            )
          })}
        </div>
        {selectedStaffId && myShiftDays.length > 0 && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--green-light)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-text)', marginBottom: 4 }}>出勤予定日</div>
            <div style={{ fontSize: 13, color: 'var(--green-text)' }}>
              {myShiftDays.map(d => `${d}日(${DAY_NAMES[getDay(new Date(selYear, selMonth, d))]})`).join(' · ')}
            </div>
          </div>
        )}
      </Card>

      {/* 勤務時間報告 */}
      {selectedStaffId && (
        <Card style={{ marginBottom: 16, borderLeft: '3px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showReport ? 14 : 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>⏱️ 勤務時間を報告する</div>
            <Btn size="sm" onClick={() => { setShowReport(!showReport); setReportDone(false) }}>
              {showReport ? '閉じる' : '入力する'}
            </Btn>
          </div>

          {showReport && !reportDone && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5, fontWeight: 600 }}>日付を選ぶ</label>
                <select value={reportDate} onChange={e => setReportDate(e.target.value)} style={{
                  width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit',
                }}>
                  <option value="">選択してください</option>
                  {shiftDateOptions.length > 0
                    ? shiftDateOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
                    : <option disabled>シフトの登録がありません</option>
                  }
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5, fontWeight: 600 }}>実際に働いた時間（時間）</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="number" min="0" max="24" step="0.5"
                    value={reportHours}
                    onChange={e => setReportHours(e.target.value)}
                    placeholder="例：6.5"
                    style={{
                      flex: 1, padding: '10px 12px', fontSize: 16, borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit',
                    }}
                  />
                  <span style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 600 }}>時間</span>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5, fontWeight: 600 }}>メモ（任意）</label>
                <textarea
                  value={reportMemo}
                  onChange={e => setReportMemo(e.target.value)}
                  placeholder="例：早退しました / 残業しました など"
                  style={{
                    width: '100%', height: 60, padding: '8px 12px', fontSize: 13, resize: 'none',
                    border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit',
                  }}
                />
              </div>
              <Btn variant="primary" size="lg" style={{ width: '100%' }} onClick={submitReport}>
                ✅ 勤務時間を送信する
              </Btn>
            </div>
          )}

          {showReport && reportDone && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>送信しました！</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>管理者に通知されました</div>
              <Btn size="sm" onClick={() => { setReportDone(false) }}>続けて報告する</Btn>
            </div>
          )}
        </Card>
      )}

      {/* お客さん予約状況 */}
      {(() => {
        const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
        const mk2 = `${selYear}-${String(selMonth+1).padStart(2,'0')}`
        const monthBookings = bookings.filter(b => (b.dateKey||'').startsWith(mk2))
        const todayBookings = bookings.filter(b => b.dateKey === todayKey)
        const upcomingBookings = bookings
          .filter(b => b.dateKey && b.dateKey >= todayKey)
          .sort((a,b) => a.dateKey.localeCompare(b.dateKey))
          .slice(0, 5)
        return (
          <Card style={{ marginBottom: 16, borderLeft: '3px solid #EC4899' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🗓️ お客さんの予約状況</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
              <div style={{ textAlign:'center', padding:'8px 4px', background:'var(--surface2)', borderRadius:'var(--radius-sm)' }}>
                <div style={{ fontSize:9, color:'var(--text3)', marginBottom:3 }}>今日</div>
                <div style={{ fontSize:18, fontWeight:700, color: todayBookings.length>0 ? '#EC4899' : 'var(--text3)' }}>{todayBookings.length}件</div>
              </div>
              <div style={{ textAlign:'center', padding:'8px 4px', background:'var(--surface2)', borderRadius:'var(--radius-sm)' }}>
                <div style={{ fontSize:9, color:'var(--text3)', marginBottom:3 }}>{selMonth+1}月合計</div>
                <div style={{ fontSize:18, fontWeight:700 }}>{monthBookings.length}件</div>
              </div>
              <div style={{ textAlign:'center', padding:'8px 4px', background:'var(--surface2)', borderRadius:'var(--radius-sm)' }}>
                <div style={{ fontSize:9, color:'var(--text3)', marginBottom:3 }}>直近5件</div>
                <div style={{ fontSize:18, fontWeight:700, color:'var(--accent-text)' }}>{upcomingBookings.length}件</div>
              </div>
            </div>
            {upcomingBookings.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {upcomingBookings.map((b,i) => {
                  const [y,m,d] = (b.dateKey||'').split('-')
                  const dw = getDay(new Date(parseInt(y), parseInt(m)-1, parseInt(d)))
                  const isToday = b.dateKey === todayKey
                  return (
                    <div key={b.id||i} style={{
                      display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
                      background: isToday ? '#FDF2F8' : 'var(--surface2)',
                      borderRadius:'var(--radius-sm)',
                      border: isToday ? '1px solid rgba(236,72,153,0.3)' : '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize:11, fontWeight:700, color: isToday?'#EC4899':'var(--text2)', minWidth:60 }}>
                        {parseInt(m)}月{parseInt(d)}日({DAY_NAMES[dw]})
                        {isToday && <span style={{ display:'block', fontSize:9, color:'#EC4899' }}>今日</span>}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:600 }}>{b.name} 様</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{b.slot}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign:'center', fontSize:12, color:'var(--text3)', padding:'8px 0' }}>直近の予約はありません</div>
            )}
          </Card>
        )
      })()}

      {/* アクションボタン */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Btn variant="primary" size="lg" style={{ width: '100%', flexDirection: 'column', padding: '16px 10px', gap: 6 }}
          onClick={() => navigate('/staff/wish')}>
          <span style={{ fontSize: 24 }}>📝</span>
          <span style={{ fontSize: 13 }}>希望シフトを入力</span>
        </Btn>
        <Btn size="lg" style={{ width: '100%', flexDirection: 'column', padding: '20px 10px', gap: 8, border: '1px solid var(--border-strong)' }}
          onClick={() => navigate('/staff/wish')}>
          <span style={{ fontSize: 28 }}>🔄</span>
          <span style={{ fontSize: 14, marginTop: 2 }}>希望を修正する</span>
        </Btn>
      </div>
    </div>
  )
}
