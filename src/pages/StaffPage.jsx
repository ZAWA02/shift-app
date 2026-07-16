import React, { useState } from 'react'
import { useStore } from '../lib/store'
import { Btn, Card, Notice, StepIndicator, Badge } from '../components/ui'
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
function shubun(year) { return Math.floor(23.2488 + 0.242194*(year-1980) - Math.floor((year-1980)/4)) }
function shunbun(year) { return Math.floor(20.8431 + 0.242194*(year-1980) - Math.floor((year-1980)/4)) }
function isHolidayFixed(year, month, day) {
  const fixed = [[0,1],[1,11],[1,23],[3,29],[4,3],[4,4],[4,5],[7,11],[10,3],[10,23]]
  if (fixed.some(([m,d]) => m===month && d===day)) return true
  if (month===2 && day===shunbun(year)) return true
  if (month===8 && day===shubun(year)) return true
  if (month===6 && day===nthWeekday(year,6,3,1)) return true
  if (month===8 && day===nthWeekday(year,8,3,1)) return true
  if (month===9 && day===nthWeekday(year,9,2,1)) return true
  return false
}
function isHoliday(year, month, day) {
  if (isHolidayFixed(year, month, day)) return true
  const prev = new Date(year, month, day - 1)
  if (new Date(year,month,day).getDay()===1 && isHolidayFixed(prev.getFullYear(),prev.getMonth(),prev.getDate())) return true
  return false
}
function isRestDay(year, month, day) {
  const dw = getDay(new Date(year, month, day))
  return dw === 0 || dw === 6 || isHoliday(year, month, day)
}

export default function StaffPage() {
  const { staff, wishes, saveWish, shifts, shiftMonth } = useStore()
  const navigate = useNavigate()
  const now = new Date()
  const [selectedStaff, setSelectedStaff] = useState('')
  const [wishState, setWishState] = useState({})
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [selYear, setSelYear] = useState(now.getFullYear())
  const [selMonth, setSelMonth] = useState(now.getMonth())
  const [editPastMode, setEditPastMode] = useState(false)

  const mk = `${selYear}-${String(selMonth+1).padStart(2,'0')}`
  const monthWishes = wishes[mk] || {}
  const monthShifts = shifts[mk] || {}
  const days = getDaysInMonth(new Date(selYear, selMonth))
  const firstDay = getDay(new Date(selYear, selMonth, 1))
  const displayMonth = `${selYear}年${selMonth+1}月`

  const changeMonth = (delta) => {
    let m = selMonth + delta, y = selYear
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setSelYear(y); setSelMonth(m)
    setWishState({}); setSelectedStaff(''); setSubmitted(false)
  }

  const handleStaffChange = (id) => {
    setSelectedStaff(id)
    setWishState({ ...(monthWishes[id] || {}) })
    setSubmitted(false)
    setEditPastMode(false)
  }

  const toggle = (d) => {
    if (!selectedStaff) return
    setWishState(prev => {
      const cur = prev[d]
      if (!cur) return { ...prev, [d]: 'ok' }
      if (cur === 'ok') return { ...prev, [d]: 'ng' }
      const next = { ...prev }; delete next[d]; return next
    })
  }

  const submit = () => {
    if (!selectedStaff) return alert('名前を選んでください')
    if (!Object.values(wishState).some(v => v === 'ok')) return alert('出勤できる日を1日以上選んでください')
    saveWish(selectedStaff, wishState, selYear, selMonth)
    setSubmitted(true)
  }

  const okCount = Object.values(wishState).filter(v => v === 'ok').length
  const ngCount = Object.values(wishState).filter(v => v === 'ng').length
  const step = !selectedStaff ? 0 : okCount === 0 ? 1 : 2

  const myName = staff.find(s => s.id === selectedStaff)?.name || ''
  const myShifts = monthShifts[selectedStaff] || {}
  const myShiftDays = Object.keys(myShifts).filter(d => myShifts[d]).map(d => parseInt(d)+1).sort((a,b)=>a-b)

  // ---- 送信完了画面（カレンダー付き） ----
  if (submitted) {
    return (
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '1rem' }}>
        <div style={{ textAlign: 'center', padding: '1.5rem 0 1rem' }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>送信完了！</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>
            {myName.split(' ')[0]}さんの{displayMonth}の希望を受け付けました
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
            🔵 出勤希望 {okCount}日　🔴 入れない {ngCount}日
          </div>
        </div>

        {/* 送信後カレンダー */}
        <Card style={{ marginBottom: 16, padding: '1rem 0.75rem' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>📅 {displayMonth}のシフト予定</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>
            管理者が確定したシフトが緑で表示されます
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4, width: '100%' }}>
            {DAY_NAMES.map((d, i) => (
              <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, padding:'4px 0',
                color: i===0?'var(--red)':i===6?'var(--accent)':'var(--text3)' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, width: '100%' }}>
            {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: days }, (_, i) => {
              const d = i + 1
              const dw = getDay(new Date(selYear, selMonth, d))
              const dayIdx = d - 1
              const hasShift = !!myShifts[dayIdx]
              const wish = wishState[dayIdx]
              const isToday = selYear===now.getFullYear() && selMonth===now.getMonth() && d===now.getDate()
              const isRest = isRestDay(selYear, selMonth, d)
              const restColor = dw===0?'var(--red)':dw===6?'var(--accent)':'var(--text3)'
              return (
                <div key={d} style={{
                  aspectRatio:'1', display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center',
                  borderRadius:'var(--radius-sm)',
                  border: isToday ? '2px solid var(--text)' : '1px solid var(--border)',
                  background: hasShift ? '#DCFCE7' : isRest ? 'var(--surface2)' : wish==='ok' ? '#EFF4FF' : wish==='ng' ? '#FEF2F2' : 'var(--surface)',
                }}>
                  {isRest && !hasShift ? (
                    <>
                      <span style={{ fontSize:10, color:restColor, lineHeight:1 }}>{d}</span>
                      <span style={{ fontSize:8, color:restColor, fontWeight:700, lineHeight:1, marginTop:1 }}>休</span>
                    </>
                  ) : (
                    <>
                      <span style={{
                        fontSize: 12, fontWeight: hasShift ? 700 : 400,
                        color: hasShift ? 'var(--green-text)' : wish==='ok' ? 'var(--accent-text)' : wish==='ng' ? 'var(--red-text)' : dw===0?'var(--red)':dw===6?'var(--accent)':'var(--text)',
                      }}>
                        {hasShift ? '◯' : wish==='ng' ? '×' : d}
                      </span>
                      {!hasShift && wish==='ok' && <span style={{ fontSize:8, color:'var(--accent-text)' }}>希望</span>}
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* 凡例 */}
          <div style={{ display:'flex', gap:12, marginTop:10, fontSize:11, color:'var(--text3)', flexWrap:'wrap' }}>
            <span><span style={{ color:'var(--green-text)',fontWeight:700 }}>◯</span> 出勤確定</span>
            <span><span style={{ color:'var(--accent-text)',fontWeight:700 }}>希望</span> 希望提出済（確定待ち）</span>
            <span><span style={{ color:'var(--red-text)',fontWeight:700 }}>×</span> NG</span>
          </div>

          {myShiftDays.length > 0 && (
            <div style={{ marginTop:12, padding:'10px 12px', background:'var(--green-light)', borderRadius:'var(--radius-sm)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--green-text)', marginBottom:4 }}>確定済みの出勤日</div>
              <div style={{ fontSize:13, color:'var(--green-text)' }}>
                {myShiftDays.map(d => `${d}日(${DAY_NAMES[getDay(new Date(selYear, selMonth, d))]})`).join(' · ')}
              </div>
            </div>
          )}
        </Card>

        <div style={{ display:'flex', gap:10 }}>
          <Btn style={{ flex:1 }} onClick={() => setSubmitted(false)}>✏️ 修正する</Btn>
          <Btn variant="primary" style={{ flex:1 }} onClick={() => { setSubmitted(false); setSelectedStaff(''); setWishState({}); changeMonth(1) }}>
            来月分も入力 →
          </Btn>
        </div>
        <Btn style={{ width:'100%', marginTop:10 }} onClick={() => { window.scrollTo(0,0); navigate('/staff', { replace: true }) }}>
          ← スタッフホームに戻る
        </Btn>
      </div>
    )
  }

  // ---- 入力画面 ----
  return (
    <div style={{ maxWidth: 540, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <Btn size="sm" variant="ghost" onClick={() => { window.scrollTo(0,0); navigate('/staff', { replace: true }) }}>←</Btn>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>希望シフト入力</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>{displayMonth}分</div>
        </div>
      </div>

      {/* 月選択 */}
      <Card style={{ marginBottom: 16, padding: '10px 16px' }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8, fontWeight: 600 }}>何月分？</div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Btn size="sm" onClick={() => changeMonth(-1)}>‹ 前月</Btn>
          <div style={{ flex:1, textAlign:'center', fontSize:16, fontWeight:700 }}>{displayMonth}</div>
          <Btn size="sm" onClick={() => changeMonth(1)}>次月 ›</Btn>
        </div>
      </Card>

      <StepIndicator steps={['名前を選ぶ', '希望日を選ぶ', '送信する']} current={step} />

      <Notice color="blue">
        <div style={{ lineHeight:1.8 }}>
          <strong>📅 カレンダーの使い方</strong><br />
          <span>1回タップ → <span style={{ background:'#EFF4FF', color:'#1D4ED8', fontWeight:700, padding:'1px 6px', borderRadius:4 }}>○ 出勤希望</span></span><br />
          <span>2回タップ → <span style={{ background:'#FEF2F2', color:'#991B1B', fontWeight:700, padding:'1px 6px', borderRadius:4 }}>× 入れない</span></span><br />
          <span>3回タップ → リセット</span>
        </div>
      </Notice>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>① 名前を選んでください</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>あなたの名前を選んでから日付を選んでください</div>
        <select value={selectedStaff} onChange={e => handleStaffChange(e.target.value)} style={{
          width: '100%', padding: '14px 14px', fontSize: 16, fontWeight: 600,
          borderRadius: 'var(--radius-sm)', border: selectedStaff ? '2px solid var(--accent)' : '2px solid var(--border-strong)',
          background: selectedStaff ? 'var(--accent-light)' : 'var(--surface)',
          color: selectedStaff ? 'var(--accent-text)' : 'var(--text3)',
          fontFamily: 'inherit', cursor: 'pointer',
        }}>
          <option value="">👤 名前を選択してください</option>
          {staff.map(s => <option key={s.id} value={s.id}>{s.name}（{s.role}）</option>)}
        </select>
        {selectedStaff && (
          <div style={{ marginTop:10, padding:'8px 12px', background:'#ECFDF5', borderRadius:'var(--radius-sm)', fontSize:13, color:'var(--green-text)', fontWeight:600 }}>
            ✅ {myName}さんとして入力します
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: 16, opacity: selectedStaff ? 1 : 0.5, pointerEvents: selectedStaff ? 'auto' : 'none', padding: '1rem 0.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>② 出勤できる日・できない日を選んでください</div>
          {selectedStaff && selYear === now.getFullYear() && selMonth === now.getMonth() && (
            <button onClick={() => setEditPastMode(v => !v)} style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: editPastMode ? '#FEF2F2' : 'var(--surface2)',
              color: editPastMode ? '#991B1B' : 'var(--text3)',
            }}>
              {editPastMode ? '✏️ 修正モード中' : '過去の日も修正する'}
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4, width: '100%' }}>
          {DAY_NAMES.map((d, i) => (
            <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, padding:'4px 0',
              color: i===0?'var(--red)':i===6?'var(--accent)':'var(--text3)' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, width: '100%' }}>
          {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }, (_, i) => i+1).map(d => {
            const dw = getDay(new Date(selYear, selMonth, d))
            const state = wishState[d-1]
            const isPastMonth = selYear < now.getFullYear() || (selYear === now.getFullYear() && selMonth < now.getMonth())
            const isPastDay = (selYear===now.getFullYear() && selMonth===now.getMonth()) && d < now.getDate()
            const isPast = isPastMonth || isPastDay
            const isRest = isRestDay(selYear, selMonth, d)
            const isDisabled = isRest || (isPast && !editPastMode)
            const restColor = dw===0?'var(--red)':dw===6?'var(--accent)':'var(--text3)'
            return (
              <button key={d} onClick={() => !isDisabled && toggle(d-1)} style={{
                aspectRatio:'1', display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                borderRadius:'var(--radius-sm)',
                border: state==='ok'?'2px solid #2563EB':state==='ng'?'2px solid #DC2626':'1px solid var(--border)',
                background: isRest?'var(--surface2)':state==='ok'?'#EFF4FF':state==='ng'?'#FEF2F2':'var(--surface)',
                color: state==='ok'?'#1D4ED8':state==='ng'?'#991B1B':isDisabled?'var(--text3)':dw===0?'var(--red)':dw===6?'var(--accent)':'var(--text)',
                opacity: (isPast && !editPastMode) ? 0.35 : 1,
                cursor: isDisabled ? 'default' : 'pointer',
                fontFamily:'inherit', fontSize:13, fontWeight: state ? 700 : 400,
              }}>
                {isRest && !state ? (
                  <>
                    <span style={{ fontSize:10, color:restColor, lineHeight:1 }}>{d}</span>
                    <span style={{ fontSize:8, color:restColor, fontWeight:700, lineHeight:1, marginTop:1 }}>休</span>
                  </>
                ) : (
                  <>
                    {state==='ok'?'○':state==='ng'?'×':d}
                    {!state && !isRest && <span style={{ fontSize:8, color:dw===0?'var(--red)':dw===6?'var(--accent)':'var(--text3)' }}>{DAY_NAMES[dw]}</span>}
                  </>
                )}
              </button>
            )
          })}
        </div>
        <div style={{ marginTop:14, display:'flex', gap:16, fontSize:13 }}>
          <span style={{ color:'#1D4ED8', fontWeight:600 }}>🔵 希望：{okCount}日</span>
          <span style={{ color:'#991B1B', fontWeight:600 }}>🔴 NG：{ngCount}日</span>
        </div>
      </Card>

      <Card style={{ marginBottom: 16, opacity: selectedStaff ? 1 : 0.5, pointerEvents: selectedStaff ? 'auto' : 'none' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>③ ひとこと（任意）</div>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="例：今月は〇日から旅行があります" style={{
          width:'100%', height:64, padding:'10px 12px', fontSize:13, resize:'none',
          border:'1px solid var(--border-strong)', borderRadius:'var(--radius-sm)',
          background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', lineHeight:1.6,
        }} />
      </Card>

      {selectedStaff && okCount === 0 && (
        <div style={{ padding:'12px 16px', background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:'var(--radius-sm)', marginBottom:12, fontSize:13, color:'#92400E' }}>
          ⬆️ カレンダーで出勤できる日を選んでください（🔵 ○ にする）
        </div>
      )}
      <Btn variant="primary" size="lg"
        style={{ width:'100%', fontSize:15, padding:'16px', opacity:(selectedStaff && okCount>0)?1:0.4 }}
        onClick={submit} disabled={!selectedStaff || okCount===0}>
        ✅ {displayMonth}の希望を送信する
        {selectedStaff && okCount > 0 && <span style={{ fontSize:12, opacity:0.8, marginLeft:6 }}>({okCount}日選択中)</span>}
      </Btn>
      {!selectedStaff && (
        <div style={{ textAlign:'center', fontSize:12, color:'var(--text3)', marginTop:8 }}>
          ① まず名前を選んでください
        </div>
      )}
    </div>
  )
}
