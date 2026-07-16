import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../lib/store'
import { Btn, Card, Badge, Metric, Avatar, Input, Notice, Divider, SectionTitle } from '../components/ui'
import { getDaysInMonth, getDay } from 'date-fns'
import { getPassword, setPassword } from '../lib/auth'
import { QRCodeSVG } from 'qrcode.react'

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

export default function AdminPage() {
  const [tab, setTab] = useState('dashboard')
  const tabs = [
    { id: 'dashboard', icon: '🏠', label: 'ダッシュボード' },
    { id: 'shift',     icon: '📅', label: 'シフト表' },
    { id: 'bookings',  icon: '📖', label: '予約一覧' },
    { id: 'announce',  icon: '📣', label: 'お知らせ' },
    { id: 'settings',  icon: '⚙️', label: '設定' },
  ]
  return (
    <div>
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'var(--surface)', borderRadius:'var(--radius-lg)', padding:6, boxShadow:'var(--shadow)', overflowX:'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'9px 14px', fontSize:12,
            background: tab===t.id ? 'var(--wood-gradient)' : 'transparent',
            border:'none', borderRadius:'var(--radius-sm)',
            color: tab===t.id ? '#FDF5E8' : 'var(--text3)',
            fontWeight: tab===t.id ? 700 : 500, cursor:'pointer',
            fontFamily:'inherit', whiteSpace:'nowrap',
            display:'flex', alignItems:'center', gap:5,
            boxShadow: tab===t.id ? '0 3px 10px rgba(101,79,54,0.3)' : 'none',
            transition:'all 0.15s', flexShrink:0,
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
      {tab==='dashboard' && <Dashboard />}
      {tab==='shift'     && <ShiftCalendar />}
      {tab==='bookings'  && <Bookings />}
      {tab==='announce'  && <Announcements />}
      {tab==='settings'  && <Settings />}
    </div>
  )
}

// ---- ダッシュボード ----
function Dashboard() {
  const { staff, wishes, bookings, shiftMonth, shifts, confirmedShifts } = useStore()
  const { year, month } = shiftMonth
  const mk = `${year}-${String(month+1).padStart(2,'0')}`
  const monthWishes = wishes[mk] || {}
  const monthShifts = shifts[mk] || {}
  const submitted = staff.filter(s => Object.keys(monthWishes[s.id]||{}).length>0).length
  const unsub = staff.length - submitted
  const isConfirmed = !!confirmedShifts[mk]
  const now = new Date()
  const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const todayBookings = bookings.filter(b => b.dateKey===todayKey)
  const todayDayIdx = now.getDate()-1
  const todayStaff = staff.filter(s => (monthShifts[s.id]||{})[todayDayIdx])

  return (
    <div>
      <Card gradient="linear-gradient(135deg, #6B4A2A 0%, #8B6340 40%, #5C3D1E 100%)" style={{ marginBottom:20, border:'none' }}>
        <div style={{ color:'rgba(253,245,232,0.8)', fontSize:12, fontWeight:600, marginBottom:10 }}>
          📅 今日 {now.getFullYear()}年{now.getMonth()+1}月{now.getDate()}日（{DAY_NAMES[now.getDay()]}）
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <div style={{ color:'rgba(253,245,232,0.7)', fontSize:11, marginBottom:8 }}>出勤スタッフ</div>
            {todayStaff.length===0
              ? <div style={{ color:'rgba(253,245,232,0.5)', fontSize:13 }}>なし</div>
              : todayStaff.map((s,i) => (
                <div key={s.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <Avatar name={s.name} size={28} colorIndex={staff.indexOf(s)} />
                  <span style={{ color:'#FDF5E8', fontSize:13, fontWeight:600 }}>{s.name.split(' ')[0]}</span>
                </div>
              ))
            }
          </div>
          <div>
            <div style={{ color:'rgba(253,245,232,0.7)', fontSize:11, marginBottom:8 }}>今日の予約</div>
            {todayBookings.length===0
              ? <div style={{ color:'rgba(253,245,232,0.5)', fontSize:13 }}>予約なし</div>
              : todayBookings.slice(0,4).map(b => (
                <div key={b.id} style={{ marginBottom:4 }}>
                  <span style={{ color:'#FDF5E8', fontSize:12, fontWeight:700 }}>{b.name}</span>
                  <span style={{ color:'rgba(253,245,232,0.7)', marginLeft:6, fontSize:11 }}>{b.slot}</span>
                </div>
              ))
            }
          </div>
        </div>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        <Metric icon="👥" label="スタッフ数" value={`${staff.length}人`} />
        <Metric icon="📖" label="総予約数" value={`${bookings.length}件`} />
        <Metric icon="📝" label="希望未提出" value={`${unsub}人`} color={unsub>0?'var(--red)':'var(--green)'} />
      </div>

      <Card style={{ marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>
              {year}年{month+1}月のシフト
              <span style={{ marginLeft:10 }}><Badge color={isConfirmed?'green':'amber'}>{isConfirmed?'✓ 確定済み':'未確定'}</Badge></span>
            </div>
            <div style={{ fontSize:12, color:'var(--text3)' }}>
              {isConfirmed?'スタッフのシフトページに確定済みと表示されています':'確定するとスタッフに通知されます'}
            </div>
          </div>
          <ConfirmButton year={year} month={month} isConfirmed={isConfirmed} />
        </div>
      </Card>

      <Card style={{ marginBottom:16 }}>
        <SectionTitle icon="📝" title="希望シフット提出状況" desc={`${year}年${month+1}月`} />
        {staff.map((s,i) => {
          const w = monthWishes[s.id]||{}
          const okDays = Object.entries(w).filter(([,v])=>v==='ok').map(([d])=>parseInt(d)+1).sort((a,b)=>a-b)
          const ngDays = Object.entries(w).filter(([,v])=>v==='ng').map(([d])=>parseInt(d)+1).sort((a,b)=>a-b)
          const hasData = okDays.length>0||ngDays.length>0
          return (
            <div key={s.id} style={{ borderBottom:i<staff.length-1?'1.5px solid var(--border)':'none', padding:'12px 0' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:hasData?8:0 }}>
                <Avatar name={s.name} size={34} colorIndex={i} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{s.name}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{s.role}</div>
                </div>
                <Badge color={hasData?'green':'amber'}>{hasData?`✓ ${okDays.length}日希望`:'未提出'}</Badge>
              </div>
              {hasData && (
                <div style={{ paddingLeft:44, display:'flex', flexDirection:'column', gap:3 }}>
                  {okDays.length>0 && <div style={{ fontSize:11, color:'var(--accent-text)' }}>🔵 {okDays.map(d=>`${d}日(${DAY_NAMES[getDay(new Date(year,month,d))]})`).join(' · ')}</div>}
                  {ngDays.length>0 && <div style={{ fontSize:11, color:'var(--red-text)' }}>🔴 {ngDays.map(d=>`${d}日(${DAY_NAMES[getDay(new Date(year,month,d))]})`).join(' · ')}</div>}
                </div>
              )}
            </div>
          )
        })}
      </Card>

      <Card>
        <SectionTitle icon="🗓️" title="直近の予約" />
        {bookings.length===0
          ? <div style={{ textAlign:'center', padding:'1.5rem 0', color:'var(--text3)', fontSize:13 }}><div style={{ fontSize:32, marginBottom:8 }}>📭</div>まだ予約はありません</div>
          : [...bookings].reverse().slice(0,6).map((b,i) => (
            <div key={b.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:i<5?'1.5px solid var(--border)':'none' }}>
              <Avatar name={b.name} size={34} colorIndex={0} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700 }}>{b.name}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{b.date} {b.slot}</div>
              </div>
              <Badge color="blue">確定</Badge>
            </div>
          ))
        }
      </Card>
    </div>
  )
}

function ConfirmButton({ year, month, isConfirmed }) {
  const { confirmShift, unconfirmShift } = useStore()
  return isConfirmed
    ? <Btn size="sm" variant="danger" onClick={() => { if(confirm('確定を取り消しますか？')) unconfirmShift(year,month) }}>確定を取り消す</Btn>
    : <Btn variant="primary" onClick={() => { if(confirm(`${year}年${month+1}月のシフトを確定しますか？`)) confirmShift(year,month) }}>✅ シフットを確定する</Btn>
}

// ---- シフット表 ----
function ShiftCalendar() {
  const { staff, shifts, autoAssign, toggleShift, shiftMonth, setShiftMonth, bookings, confirmedShifts } = useStore()
  const { year, month } = shiftMonth
  const mk = `${year}-${String(month+1).padStart(2,'0')}`
  const monthShifts = shifts[mk] || {}
  const isConfirmed = !!confirmedShifts[mk]
  const daysInMonth = getDaysInMonth(new Date(year, month))
  const allDays = Array.from({ length: daysInMonth }, (_, i) => i)
  const [viewMode, setViewMode] = useState('both')
  const [selectedDay, setSelectedDay] = useState(null)
  const [screenshotMode, setScreenshotMode] = useState(false)

  // 開いた時に今月にリセット
  useEffect(() => {
    const now = new Date()
    setShiftMonth(now.getFullYear(), now.getMonth())
  }, [])

  const changeMonth = (delta) => {
    let m = month+delta, y = year
    if (m<0){m=11;y--} if (m>11){m=0;y++}
    setShiftMonth(y,m); setSelectedDay(null)
  }

  const getTotal = (staffId) => allDays.filter(d => monthShifts[staffId]?.[d]).length
  const getBookingsForDay = (d) => {
    const dk = `${year}-${String(month+1).padStart(2,'0')}-${String(d+1).padStart(2,'0')}`
    return bookings.filter(b => b.dateKey===dk)
  }

  const selectedDayBookings = selectedDay!==null ? getBookingsForDay(selectedDay) : []
  const selectedDayStaff = selectedDay!==null ? staff.filter(s => monthShifts[s.id]?.[selectedDay]) : []

  const modeBtn = (id, label, icon) => (
    <button onClick={() => setViewMode(id)} style={{
      padding:'8px 14px', fontSize:12, fontWeight:700, borderRadius:20, border:'none',
      background: viewMode===id ? 'var(--wood-gradient)' : 'var(--surface2)',
      color: viewMode===id ? '#FDF5E8' : 'var(--text3)',
      cursor:'pointer', fontFamily:'inherit',
      boxShadow: viewMode===id ? '0 3px 10px rgba(101,79,54,0.3)' : 'none',
    }}>{icon} {label}</button>
  )

  return (
    <div>
      {/* スクリーンショット全画面モード — 月カレンダー形式（1画面） */}
      {screenshotMode && (() => {
        const firstDow = getDay(new Date(year, month, 1))
        const weeks = []
        let week = Array(firstDow).fill(null)
        allDays.forEach(d => {
          week.push(d)
          if (week.length === 7) { weeks.push(week); week = [] }
        })
        if (week.length > 0) {
          while (week.length < 7) week.push(null)
          weeks.push(week)
        }
        // 各日に出勤するスタッフ名リスト
        const dayStaff = (d) => staff.filter(s => (monthShifts[s.id]||{})[d]).map(s => s.name.split(' ')[0])
        // セルの高さを週数に合わせて計算
        const cellH = weeks.length <= 5 ? '14vh' : '11vh'

        return (
          <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'#3D2509', zIndex:9999, display:'flex', flexDirection:'column', padding:'10px' }}>
            {/* ヘッダー */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontSize:16, fontWeight:700, color:'#FDF5E8' }}>
                {year}年{month+1}月
                {isConfirmed && <span style={{ marginLeft:8, fontSize:11, background:'#4A7C59', padding:'2px 8px', borderRadius:999 }}>✅ 確定</span>}
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:11, color:'#C49A6C' }}>📸 スクリーンショットで保存</span>
                <button onClick={() => setScreenshotMode(false)} style={{ padding:'7px 14px', background:'#6B4A2A', color:'#FDF5E8', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>✕</button>
              </div>
            </div>

            {/* カレンダー本体 */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', background:'white', borderRadius:12, overflow:'hidden' }}>
              {/* 曜日ヘッダー */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'#6B4A2A' }}>
                {DAY_NAMES.map((dn,di) => (
                  <div key={di} style={{ padding:'6px 2px', textAlign:'center', fontSize:12, fontWeight:700, color:di===0?'#FFB3B3':di===6?'#B3C8FF':'#FDF5E8' }}>{dn}</div>
                ))}
              </div>

              {/* 週の行 */}
              <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
                {weeks.map((week, wi) => (
                  <div key={wi} style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:wi<weeks.length-1?'1px solid #EDE4D7':'none' }}>
                    {week.map((d, di) => {
                      const dw = di
                      const names = d!==null ? dayStaff(d) : []
                      const isEmpty = d===null
                      const isToday = d!==null && new Date().getFullYear()===year && new Date().getMonth()===month && new Date().getDate()===d+1
                      const colors = ['#7B5E3A','#4A7C59','#2E5F9A','#8B4A6B','#C17F3A','#3A7B8C','#7B3A5A','#5A7B3A']
                      return (
                        <div key={di} style={{
                          borderRight: di<6?'1px solid #EDE4D7':'none',
                          background: isEmpty?'#F5EFE6':isToday?'#FDF3E0':'white',
                          padding:'3px 3px',
                          display:'flex', flexDirection:'column',
                          overflow:'hidden',
                        }}>
                          {d!==null && (
                            <>
                              <div style={{
                                fontSize:11, fontWeight:700, lineHeight:1.2, marginBottom:2,
                                color: dw===0?'#C0392B':dw===6?'#2E5F9A':isToday?'#C17F3A':'#3D2509',
                                width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center',
                                borderRadius:'50%', background:isToday?'#C17F3A':'transparent',
                                color:isToday?'white':dw===0?'#C0392B':dw===6?'#2E5F9A':'#3D2509',
                              }}>{d+1}</div>
                              <div style={{ display:'flex', flexDirection:'column', gap:1, flex:1, overflow:'hidden' }}>
                                {names.map((name, ni) => (
                                  <div key={ni} style={{
                                    fontSize:9, fontWeight:700, lineHeight:1.3,
                                    padding:'1px 3px', borderRadius:3,
                                    background:colors[staff.findIndex(s=>s.name.split(' ')[0]===name)%colors.length],
                                    color:'white', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis',
                                  }}>{name}</div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Btn size="sm" onClick={() => changeMonth(-1)}>‹ 前月</Btn>
          <span style={{ fontSize:15, fontWeight:700 }}>{year}年{month+1}月</span>
          <Btn size="sm" onClick={() => changeMonth(1)}>次月 ›</Btn>
          <Badge color={isConfirmed?'green':'amber'}>{isConfirmed?'✓ 確定済み':'未確定'}</Badge>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:6 }}>
            {modeBtn('both','両方','📋')}
            {modeBtn('shift','シフット','👤')}
            {modeBtn('booking','予約','🗓️')}
          </div>
          <ConfirmButton year={year} month={month} isConfirmed={isConfirmed} />
          <Btn variant="primary" onClick={() => { autoAssign(year,month); alert('割り振り完了！') }}>✦ 自動割り振り</Btn>
          <Btn onClick={() => setScreenshotMode(true)} style={{ background:'var(--green-light)', color:'var(--green-text)', borderColor:'rgba(74,124,89,0.3)' }}>
            📷 スクリーンショット用
          </Btn>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:selectedDay!==null?'1fr 260px':'1fr', gap:16, alignItems:'start' }}>
        {/* ── カレンダーグリッド ── */}
        <Card style={{ padding:'0.75rem' }}>
          {/* 曜日ヘッダー */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:4 }}>
            {DAY_NAMES.map((dn,di) => (
              <div key={di} style={{ textAlign:'center', fontSize:12, fontWeight:700, padding:'5px 0',
                color: di===0?'var(--red)':di===6?'var(--accent-text)':'var(--text3)' }}>{dn}</div>
            ))}
          </div>

          {/* 日付セル */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
            {Array.from({ length: getDay(new Date(year,month,1)) }, (_,i) => <div key={`e${i}`}/>)}
            {allDays.map(d => {
              const dw = getDay(new Date(year,month,d+1))
              const workingStaff = staff.filter(s => monthShifts[s.id]?.[d])
              const bks = getBookingsForDay(d)
              const isSel = selectedDay===d
              const isToday = new Date().getFullYear()===year && new Date().getMonth()===month && new Date().getDate()===d+1
              const isWeekend = dw===0||dw===6
              const staffColors = ['#7B5E3A','#4A7C59','#2E5F9A','#8B4A6B','#C17F3A','#3A7B8C','#7B3A5A']

              return (
                <div key={d} onClick={() => setSelectedDay(isSel?null:d)} style={{
                  minHeight: 72, borderRadius: 8, cursor:'pointer', padding:'5px 5px 4px',
                  border: isSel ? '2px solid #7B5E3A' : isToday ? '2px solid var(--text)' : '1px solid var(--border)',
                  background: isSel ? '#FDF5E0' : isWeekend ? (dw===0?'rgba(192,57,43,0.04)':'rgba(46,95,154,0.04)') : 'var(--surface)',
                  display:'flex', flexDirection:'column', gap:2,
                }}>
                  {/* 日付数字 */}
                  <div style={{
                    fontSize:13, fontWeight: isToday?800:600, lineHeight:1,
                    width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                    background: isToday?'#7B5E3A':'transparent',
                    color: isToday?'#FDF5E8':dw===0?'var(--red)':dw===6?'var(--accent-text)':'var(--text)',
                  }}>{d+1}</div>

                  {/* 出勤スタッフ名 */}
                  {(viewMode==='both'||viewMode==='shift') && workingStaff.map((s,si) => (
                    <div key={s.id} style={{
                      fontSize:10, fontWeight:700, lineHeight:1.3,
                      padding:'2px 4px', borderRadius:4,
                      background: staffColors[staff.indexOf(s)%staffColors.length],
                      color:'white', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                    }}>{s.name.split(' ')[0]}</div>
                  ))}

                  {/* 予約バッジ */}
                  {(viewMode==='both'||viewMode==='booking') && bks.length>0 && (
                    <div style={{
                      marginTop:'auto', fontSize:10, fontWeight:700,
                      color:'#7B5E3A', background:'var(--accent-light)',
                      borderRadius:4, padding:'2px 4px', textAlign:'center',
                    }}>予約{bks.length}件</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 凡例 */}
          <div style={{ display:'flex', gap:12, marginTop:10, fontSize:11, color:'var(--text3)', flexWrap:'wrap' }}>
            <span>日付タップ → 詳細・編集</span>
            {(viewMode==='both'||viewMode==='booking') && <span style={{ color:'#7B5E3A', fontWeight:600 }}>予約N件</span>}
          </div>
        </Card>

        {selectedDay!==null && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <Card style={{ borderLeft:'3px solid #7B5E3A' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:15, fontWeight:700 }}>{month+1}月{selectedDay+1}日（{DAY_NAMES[getDay(new Date(year,month,selectedDay+1))]}）</div>
                <button onClick={() => setSelectedDay(null)} style={{ background:'none',border:'none',fontSize:18,cursor:'pointer',color:'var(--text3)' }}>×</button>
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--green-text)', marginBottom:8 }}>👤 出勤（{selectedDayStaff.length}人）</div>
                {selectedDayStaff.length===0
                  ? <div style={{ fontSize:12, color:'var(--text3)' }}>なし</div>
                  : selectedDayStaff.map((s,i) => (
                    <div key={s.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:i<selectedDayStaff.length-1?'1px solid var(--border)':'none' }}>
                      <Avatar name={s.name} size={26} colorIndex={staff.indexOf(s)} />
                      <div><div style={{ fontSize:12, fontWeight:700 }}>{s.name}</div><div style={{ fontSize:10, color:'var(--text3)' }}>{s.role}</div></div>
                    </div>
                  ))
                }
              </div>
              <Divider />
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--accent-text)', marginBottom:8 }}>🗓️ 予約（{selectedDayBookings.length}件）</div>
                {selectedDayBookings.length===0
                  ? <div style={{ fontSize:12, color:'var(--text3)' }}>なし</div>
                  : selectedDayBookings.map((b,i) => (
                    <div key={b.id} style={{ padding:'8px 10px', borderRadius:'var(--radius-sm)', background:'var(--accent-light)', marginBottom:i<selectedDayBookings.length-1?8:0, border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:2 }}>{b.name} 様</div>
                      <div style={{ fontSize:11, color:'var(--accent-text)' }}>🕐 {b.slot}</div>
                      {b.tel && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>📞 {b.tel}</div>}
                    </div>
                  ))
                }
              </div>
            </Card>
            <Card style={{ padding:'0.75rem' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', marginBottom:8 }}>この日を手動編集</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {staff.map((s,i) => {
                  const hasShift = !!monthShifts[s.id]?.[selectedDay]
                  return (
                    <button key={s.id} onClick={() => toggleShift(s.id,selectedDay)} style={{
                      display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
                      borderRadius:'var(--radius-sm)', border:'1.5px solid',
                      borderColor:hasShift?'rgba(74,124,89,0.4)':'var(--border)',
                      background:hasShift?'var(--green-light)':'var(--surface)',
                      cursor:'pointer', fontFamily:'inherit',
                    }}>
                      <Avatar name={s.name} size={22} colorIndex={i} />
                      <span style={{ fontSize:12, fontWeight:700, flex:1, textAlign:'left', color:hasShift?'var(--green-text)':'var(--text3)' }}>{s.name.split(' ')[0]}</span>
                      <span style={{ fontSize:11, color:hasShift?'var(--green-text)':'var(--text3)' }}>{hasShift?'✓ 出勤':'休み'}</span>
                    </button>
                  )
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- 予約一覧 ----
function Bookings() {
  const { bookings, cancelBooking } = useStore()
  return (
    <div>
      <Notice color="blue">お客さんが予約ページから予約した内容の一覧です。「キャンセル」で削除できます。</Notice>
      {bookings.length===0
        ? <Card style={{ textAlign:'center', padding:'3rem' }}><div style={{ fontSize:40, marginBottom:12 }}>📭</div><div style={{ fontSize:14, fontWeight:700 }}>まだ予約はありません</div></Card>
        : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:13, color:'var(--text2)', fontWeight:600 }}>全 {bookings.length} 件</div>
            {[...bookings].reverse().map(b => (
              <Card key={b.id} style={{ padding:'1rem 1.25rem' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                  <Avatar name={b.name} size={40} colorIndex={0} />
                  <div style={{ flex:1, minWidth:160 }}>
                    <div style={{ fontSize:15, fontWeight:700, marginBottom:3 }}>{b.name} 様</div>
                    <div style={{ fontSize:13, color:'var(--text2)', marginBottom:2 }}>📅 {b.date}　🕐 {b.slot}</div>
                    {b.tel && <div style={{ fontSize:12, color:'var(--text3)' }}>📞 {b.tel}</div>}
                    {b.note && <div style={{ fontSize:12, color:'var(--text3)', marginTop:4, fontStyle:'italic' }}>「{b.note}」</div>}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                    <Badge color="blue">予約確定</Badge>
                    <Btn size="sm" variant="danger" onClick={() => { if(confirm(`${b.name}さんの予約をキャンセルしますか？`)) cancelBooking(b.id) }}>🗑️ キャンセル</Btn>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      }
    </div>
  )
}

// ---- お知らせ ----
function Announcements() {
  const { announcements, addAnnouncement, deleteAnnouncement } = useStore()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const submit = () => {
    if (!title.trim()) return alert('タイトルを入力してください')
    addAnnouncement(title.trim(), body.trim())
    setTitle(''); setBody('')
  }
  return (
    <div>
      <Notice color="wood">ここで作成したお知らせはスタッフ・お客さんのホーム画面に表示されます。</Notice>
      <Card style={{ marginBottom:16 }}>
        <SectionTitle icon="📣" title="お知らせを作成" />
        <Input label="タイトル" value={title} onChange={e=>setTitle(e.target.value)} placeholder="例：7月のシフット希望は6月25日までに！" />
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, color:'var(--text)', display:'block', marginBottom:5, fontWeight:700 }}>本文（任意）</label>
          <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="詳細内容…" style={{ width:'100%', height:80, padding:'10px 14px', fontSize:13, resize:'none', border:'1.5px solid var(--border-strong)', borderRadius:'var(--radius-sm)', background:'var(--surface)', color:'var(--text)', fontFamily:'inherit' }} />
        </div>
        <Btn variant="primary" size="lg" style={{ width:'100%' }} onClick={submit}>📣 お知らせを送信する</Btn>
      </Card>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {announcements.length===0
          ? <Card style={{ textAlign:'center', padding:'2rem' }}><div style={{ fontSize:32, marginBottom:8 }}>📭</div><div style={{ fontSize:13, color:'var(--text3)' }}>お知らせはありません</div></Card>
          : announcements.map((a,i) => (
            <Card key={a.id} style={{ borderLeft:'3px solid #C17F3A' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>📣 {a.title}</div>
                  {a.body && <div style={{ fontSize:13, color:'var(--text2)', marginBottom:4 }}>{a.body}</div>}
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{new Date(a.createdAt).toLocaleString('ja-JP')}</div>
                </div>
                <Btn size="sm" variant="danger" onClick={() => { if(confirm('このお知らせを削除しますか？')) deleteAnnouncement(a.id) }}>削除</Btn>
              </div>
            </Card>
          ))
        }
      </div>
    </div>
  )
}

// ---- 設定 ----
function Settings() {
  const { settings, updateSettings, staff, addStaff, removeStaff } = useStore()
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('学生')
  const [copied, setCopied] = useState(null)
  const [pwForm, setPwForm] = useState({ current:'', next:'', confirm:'' })
  const [pwMsg, setPwMsg] = useState(null)

  const changePw = () => {
    if (pwForm.current!==getPassword()) return setPwMsg({ ok:false, text:'現在のパスワードが違います' })
    if (pwForm.next.length<6) return setPwMsg({ ok:false, text:'6文字以上にしてください' })
    if (pwForm.next!==pwForm.confirm) return setPwMsg({ ok:false, text:'新しいパスワードが一致しません' })
    setPassword(pwForm.next)
    setPwMsg({ ok:true, text:'パスワードを変更しました！' })
    setPwForm({ current:'', next:'', confirm:'' })
  }

  const copy = (text, key) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(()=>setCopied(null),2000) }).catch(()=>alert('コピーできませんでした'))
  }

  const staffUrl  = 'https://shift-app-v10.vercel.app/staff.html'
  const bookUrl   = 'https://shift-app-v10.vercel.app/customer.html'

  const toggleSlot = (i) => {
    const s = settings.enabledSlots.includes(i) ? settings.enabledSlots.filter(x=>x!==i) : [...settings.enabledSlots,i].sort((a,b)=>a-b)
    updateSettings({ enabledSlots:s })
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <Card style={{ borderLeft:'3px solid var(--accent)' }}>
        <SectionTitle icon="🏪" title="店舗設定" desc="アプリに表示される店舗名・ロゴを設定します" />
        <Input label="店舗名" value={settings.shopName||''} onChange={e=>updateSettings({shopName:e.target.value})} placeholder="例：カフェ〇〇" />
        <Input label="店舗の説明（任意）" value={settings.shopDescription||''} onChange={e=>updateSettings({shopDescription:e.target.value})} placeholder="例：渋谷のおしゃれカフェ" />
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5, fontWeight:600 }}>ロゴ画像URL（任意）</label>
          <input type="text" value={settings.logoUrl||''} onChange={e=>updateSettings({logoUrl:e.target.value})} placeholder="https://example.com/logo.png" style={{ width:'100%', padding:'10px 14px', fontSize:13, border:'1.5px solid var(--border-strong)', borderRadius:'var(--radius-sm)', background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', marginBottom:6 }} />
          {settings.logoUrl && <img src={settings.logoUrl} alt="ロゴ" style={{ width:48, height:48, borderRadius:'var(--radius-sm)', objectFit:'cover' }} onError={e=>e.target.style.display='none'} />}
        </div>
      </Card>

      <Card style={{ borderLeft:'3px solid var(--amber)' }}>
        <SectionTitle icon="🔐" title="パスワード変更" />
        <Input label="現在のパスワード" type="password" value={pwForm.current} onChange={e=>{setPwForm(f=>({...f,current:e.target.value}));setPwMsg(null)}} placeholder="現在のパスワード" />
        <Input label="新しいパスワード（6文字以上）" type="password" value={pwForm.next} onChange={e=>{setPwForm(f=>({...f,next:e.target.value}));setPwMsg(null)}} placeholder="新しいパスワード" />
        <Input label="確認" type="password" value={pwForm.confirm} onChange={e=>{setPwForm(f=>({...f,confirm:e.target.value}));setPwMsg(null)}} placeholder="もう一度入力" />
        {pwMsg && <div style={{ fontSize:12, fontWeight:700, marginBottom:12, color:pwMsg.ok?'var(--green-text)':'var(--red-text)' }}>{pwMsg.ok?'✅':'❌'} {pwMsg.text}</div>}
        <Btn variant="primary" size="lg" style={{ width:'100%' }} onClick={changePw}>パスワードを変更する</Btn>
      </Card>

      <Card>
        <SectionTitle icon="👤" title="スタッフ用 QR・URL" desc="QRコードを見せるかURLを送るだけでOK！ホーム画面に追加してもらうとアプリみたいに使えます" />
        <div style={{ display:'flex', gap:20, alignItems:'flex-start', flexWrap:'wrap' }}>
          <div style={{ background:'var(--surface)', padding:12, borderRadius:'var(--radius)', border:'1.5px solid var(--border)', boxShadow:'var(--shadow)', flexShrink:0 }}>
            <QRCodeSVG value={staffUrl} size={140} bgColor="transparent" fgColor="#2C1A0E" level="M" />
            <div style={{ fontSize:10, color:'var(--text3)', textAlign:'center', marginTop:6, fontWeight:600 }}>スタッフ用QR</div>
          </div>
          <div style={{ flex:1, minWidth:160 }}>
            <div style={{ fontSize:12, color:'var(--text2)', fontWeight:600, marginBottom:8 }}>📱 スタッフへの案内手順</div>
            <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.8, marginBottom:12 }}>
              1. このQRをスキャン<br/>2. Safariで開く<br/>3. 共有ボタン → <strong>「ホーム画面に追加」</strong><br/>4. アイコンが追加されてアプリみたいに使える！
            </div>
            <div style={{ background:'var(--surface2)', borderRadius:'var(--radius-sm)', padding:'8px 12px', fontFamily:'monospace', fontSize:10, color:'var(--text2)', wordBreak:'break-all', marginBottom:10, border:'1.5px solid var(--border)' }}>{staffUrl}</div>
            <Btn size="sm" onClick={() => copy(staffUrl,'staff')} style={{ width:'100%' }}>{copied==='staff'?'✓ コピーしました！':'📋 URLをコピーする'}</Btn>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle icon="🗓️" title="お客さん用 QR・URL" desc="SNSに投稿するかQRを印刷して貼るとお客さんが予約できます" />
        <div style={{ display:'flex', gap:20, alignItems:'flex-start', flexWrap:'wrap' }}>
          <div style={{ background:'var(--surface)', padding:12, borderRadius:'var(--radius)', border:'1.5px solid var(--border)', boxShadow:'var(--shadow)', flexShrink:0 }}>
            <QRCodeSVG value={bookUrl} size={140} bgColor="transparent" fgColor="#2C1A0E" level="M" />
            <div style={{ fontSize:10, color:'var(--text3)', textAlign:'center', marginTop:6, fontWeight:600 }}>お客さん用QR</div>
          </div>
          <div style={{ flex:1, minWidth:160 }}>
            <div style={{ background:'var(--surface2)', borderRadius:'var(--radius-sm)', padding:'8px 12px', fontFamily:'monospace', fontSize:10, color:'var(--text2)', wordBreak:'break-all', marginBottom:10, border:'1.5px solid var(--border)' }}>{bookUrl}</div>
            <Btn size="sm" variant="primary" onClick={() => copy(bookUrl,'book')} style={{ width:'100%' }}>{copied==='book'?'✓ コピーしました！':'📋 予約URLをコピーする'}</Btn>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle icon="⏰" title="予約設定" />
        <div style={{ fontSize:12, color:'var(--text)', marginBottom:10, fontWeight:700 }}>受付する時間帯</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
          {settings.slots.map((t,i) => {
            const on = settings.enabledSlots.includes(i)
            return (
              <button key={i} onClick={() => toggleSlot(i)} style={{
                padding:'10px 16px', fontSize:13, fontWeight:700, borderRadius:20, border:'none',
                background: on?'var(--wood-gradient)':'var(--surface2)',
                color: on?'#FDF5E8':'var(--text3)',
                cursor:'pointer', fontFamily:'inherit',
                boxShadow: on?'0 3px 10px rgba(101,79,54,0.3)':'none',
              }}>{on?'✓ ':''}{t}</button>
            )
          })}
        </div>
        <div style={{ fontSize:12, color:'var(--text)', marginBottom:8, fontWeight:700 }}>1スロットの最大予約人数</div>
        <select value={settings.maxPerSlot} onChange={e=>updateSettings({maxPerSlot:parseInt(e.target.value)})} style={{ padding:'10px 14px', fontSize:14, borderRadius:'var(--radius-sm)', fontWeight:700, border:'1.5px solid var(--border-strong)', background:'var(--surface)', color:'var(--text)', fontFamily:'inherit' }}>
          {[1,2,3,5,10].map(n=><option key={n} value={n}>{n}人まで</option>)}
        </select>
      </Card>

      <Card>
        <SectionTitle icon="🔔" title="Discord通知設定" desc="各イベントの通知のオン/オフを切り替えます" />
        {[
          { key:'booking', icon:'🗓️', label:'予約が入ったとき' },
          { key:'cancel', icon:'🗑️', label:'予約がキャンセルされたとき' },
          { key:'shiftConfirm', icon:'✅', label:'シフットを確定したとき' },
          { key:'announcement', icon:'📣', label:'お知らせを送ったとき' },
        ].map(item => {
          const on = settings.notify?.[item.key]!==false
          return (
            <div key={item.key} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1.5px solid var(--border)' }}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              <div style={{ flex:1, fontSize:13, fontWeight:600 }}>{item.label}</div>
              <button onClick={() => updateSettings({notify:{...settings.notify,[item.key]:!on}})} style={{
                width:48, height:26, borderRadius:13, border:'none', cursor:'pointer',
                background: on?'var(--green)':'var(--surface2)', position:'relative', transition:'background 0.2s',
              }}>
                <div style={{ width:20,height:20,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:on?25:3,transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
              </button>
              <span style={{ fontSize:11, fontWeight:700, color:on?'var(--green-text)':'var(--text3)', width:28 }}>{on?'ON':'OFF'}</span>
            </div>
          )
        })}
      </Card>

      <Card>
        <SectionTitle icon="👥" title="スタッフ管理" />
        <div style={{ marginBottom:16 }}>
          {staff.map((s,i) => (
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:i<staff.length-1?'1.5px solid var(--border)':'none' }}>
              <Avatar name={s.name} size={36} colorIndex={i} />
              <div style={{ flex:1 }}><div style={{ fontSize:14, fontWeight:700 }}>{s.name}</div><div style={{ fontSize:11, color:'var(--text3)' }}>{s.role}</div></div>
              <Btn size="sm" variant="danger" onClick={() => { if(confirm(`${s.name}を削除しますか？`)) removeStaff(s.id) }}>削除</Btn>
            </div>
          ))}
        </div>
        <Divider label="スタッフを追加" />
        <div style={{ display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
          <div style={{ flex:2, minWidth:120 }}><Input label="名前" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="山田 太郎" /></div>
          <div style={{ flex:1, minWidth:80 }}><Input label="役割" value={newRole} onChange={e=>setNewRole(e.target.value)} placeholder="学生" /></div>
          <Btn variant="primary" size="lg" style={{ marginBottom:14 }} onClick={() => { if(newName.trim()){addStaff(newName.trim(),newRole.trim()||'学生');setNewName('');setNewRole('学生')} }}>＋ 追加</Btn>
        </div>
      </Card>
    </div>
  )
}
