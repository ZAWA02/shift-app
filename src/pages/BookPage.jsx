import React, { useState } from 'react'
import { useStore } from '../lib/store'
import { Btn, Card, Input, Notice, StepIndicator } from '../components/ui'
import { getDaysInMonth, getDay } from 'date-fns'
import { useNavigate, useLocation } from 'react-router-dom'

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

export default function BookPage() {
  const { settings, addBooking, getBookingsForSlot, bookings } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const now = new Date()
  const initState = location.state || {}

  const [calYear, setCalYear] = useState(initState.year || now.getFullYear())
  const [calMonth, setCalMonth] = useState(initState.month ?? now.getMonth())
  const [selDate, setSelDate] = useState(initState.date || null)
  const [selSlot, setSelSlot] = useState(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', tel: '', note: '' })
  const [done, setDone] = useState(null)

  const daysInMonth = getDaysInMonth(new Date(calYear, calMonth))
  const firstDay = getDay(new Date(calYear, calMonth, 1))
  const dateKey = selDate ? `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(selDate).padStart(2,'0')}` : null
  const dateLabel = selDate ? `${calYear}年${calMonth+1}月${selDate}日` : ''

  const prevMo = () => { if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1)}else setCalMonth(m=>m-1) }
  const nextMo = () => { if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1)}else setCalMonth(m=>m+1) }

  const confirmBooking = () => {
    if (!form.name.trim()) return alert('お名前を入力してください')
    const b = { name:form.name.trim(), tel:form.tel.trim(), note:form.note.trim(), date:dateLabel, dateKey, slot:settings.slots[selSlot], slotIdx:selSlot }
    addBooking(b)
    setDone(b)
    setStep(3)
  }

  const reset = () => {
    setSelDate(null); setSelSlot(null); setStep(1)
    setForm({ name:'', tel:'', note:'' }); setDone(null)
  }

  // ---- 完了画面（カレンダー付き） ----
  if (step === 3 && done) {
    const confirmYear = parseInt(done.dateKey.split('-')[0])
    const confirmMonth = parseInt(done.dateKey.split('-')[1]) - 1
    const confirmDays = getDaysInMonth(new Date(confirmYear, confirmMonth))
    const confirmFirstDay = getDay(new Date(confirmYear, confirmMonth, 1))
    const myBookings = bookings.filter(b => {
      const [y, m] = (b.dateKey||'').split('-')
      return parseInt(y)===confirmYear && parseInt(m)-1===confirmMonth && b.name===done.name
    })

    return (
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '1rem' }}>
        <div style={{ textAlign:'center', padding:'1.5rem 0 1rem' }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>予約完了！</div>
          <div style={{ fontSize: 14, color: 'var(--text2)' }}>ご予約ありがとうございます</div>
        </div>

        {/* 予約内容カード */}
        <Card style={{ marginBottom: 16, borderLeft: '3px solid var(--green)' }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>ご予約内容</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{done.name} 様</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 2 }}>📅 {done.date}</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: done.tel ? 2 : 0 }}>🕐 {done.slot}</div>
          {done.tel && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>📞 {done.tel}</div>}
        </Card>

        {/* 予約後カレンダー */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
            📅 {confirmYear}年{confirmMonth+1}月の予約カレンダー
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>
            ★ マークがあなたの予約日です
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:4 }}>
            {DAY_NAMES.map((d, i) => (
              <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, padding:'4px 0',
                color: i===0?'var(--red)':i===6?'var(--accent)':'var(--text3)' }}>{d}</div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
            {Array.from({ length: confirmFirstDay }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: confirmDays }, (_, i) => {
              const d = i + 1
              const dw = getDay(new Date(confirmYear, confirmMonth, d))
              const dk = `${confirmYear}-${String(confirmMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
              const isMyBooking = dk === done.dateKey
              const totalBookings = bookings.filter(b => b.dateKey === dk).length
              const hasAnyBook = totalBookings > 0
              const isToday = confirmYear===now.getFullYear() && confirmMonth===now.getMonth() && d===now.getDate()

              return (
                <div key={d} style={{
                  aspectRatio:'1', display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center',
                  borderRadius:'var(--radius-sm)',
                  border: isMyBooking ? '2px solid var(--green)' : isToday ? '2px solid var(--text)' : '1px solid var(--border)',
                  background: isMyBooking ? '#DCFCE7' : hasAnyBook ? 'var(--accent-light)' : 'var(--surface)',
                }}>
                  <span style={{
                    fontSize: 12, fontWeight: isMyBooking ? 700 : 400,
                    color: isMyBooking ? 'var(--green-text)' : dw===0?'var(--red)':dw===6?'var(--accent)':'var(--text)',
                  }}>
                    {isMyBooking ? '★' : d}
                  </span>
                  {hasAnyBook && !isMyBooking && (
                    <span style={{ fontSize: 8, color: 'var(--accent-text)', fontWeight: 700 }}>{totalBookings}</span>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ display:'flex', gap:12, marginTop:10, fontSize:11, color:'var(--text3)', flexWrap:'wrap' }}>
            <span><span style={{ color:'var(--green-text)', fontWeight:700 }}>★</span> あなたの予約</span>
            <span><span style={{ display:'inline-block',width:10,height:10,borderRadius:2,background:'var(--accent-light)',verticalAlign:'middle',marginRight:2 }}></span>他の予約あり</span>
          </div>
        </Card>

        <div style={{ display:'flex', gap:10 }}>
          <Btn style={{ flex:1 }} onClick={reset}>別の日を予約する</Btn>
          <Btn variant="primary" style={{ flex:1 }} onClick={() => navigate('/customer')}>
            ホームに戻る
          </Btn>
        </div>
      </div>
    )
  }

  // ---- 予約入力画面 ----
  return (
    <div style={{ maxWidth: 540, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <Btn size="sm" variant="ghost" onClick={() => navigate('/customer')}>←</Btn>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>ご予約</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>日付と時間帯を選んでください</div>
        </div>
      </div>

      <StepIndicator steps={['日付を選ぶ', '時間帯を選ぶ', 'お名前入力', '完了']} current={step-1} />

      {step === 1 && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <Btn size="sm" onClick={prevMo}>‹ 前月</Btn>
              <span style={{ fontWeight:700, fontSize:15 }}>{calYear}年{calMonth+1}月</span>
              <Btn size="sm" onClick={nextMo}>次月 ›</Btn>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:6 }}>
              {DAY_NAMES.map((d, i) => (
                <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, padding:'3px 0',
                  color: i===0?'var(--red)':i===6?'var(--accent)':'var(--text3)' }}>{d}</div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
              {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = i+1
                const dw = getDay(new Date(calYear, calMonth, d))
                const isPast = new Date(calYear, calMonth, d) < new Date(now.getFullYear(), now.getMonth(), now.getDate())
                const isSel = selDate === d
                const dk = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                const hasBook = useStore.getState().bookings.some(b => b.dateKey === dk)
                return (
                  <button key={d} onClick={() => { if(!isPast){ setSelDate(d); setSelSlot(null) } }} style={{
                    aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    borderRadius:'var(--radius-sm)', fontFamily:'inherit',
                    border: isSel?'2px solid var(--accent)':'1px solid var(--border)',
                    background: isSel?'var(--accent)':'var(--surface)',
                    color: isSel?'#fff':isPast?'var(--text3)':dw===0?'var(--red)':dw===6?'var(--accent)':'var(--text)',
                    opacity: isPast ? 0.3 : 1, cursor: isPast ? 'default' : 'pointer',
                    position:'relative', fontSize:14, fontWeight: isSel ? 700 : 400,
                  }}>
                    {d}
                    {hasBook && !isSel && <span style={{ position:'absolute', bottom:2, width:4, height:4, borderRadius:'50%', background:'var(--accent)' }} />}
                  </button>
                )
              })}
            </div>
            {!selDate && <div style={{ textAlign:'center', fontSize:12, color:'var(--text3)', marginTop:12 }}>👆 日付をタップしてください</div>}
          </Card>

          {selDate && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>📅 {dateLabel} の時間帯</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
                {settings.enabledSlots.map(i => {
                  const cnt = getBookingsForSlot(dateKey, i)
                  const full = cnt >= settings.maxPerSlot
                  const isSel = selSlot === i
                  return (
                    <button key={i} onClick={() => { if(!full) setSelSlot(i) }} style={{
                      padding:'14px 10px', borderRadius:'var(--radius)',
                      border: isSel?'2px solid var(--accent)':'1px solid var(--border-strong)',
                      background: full?'var(--surface2)':isSel?'var(--accent-light)':'var(--surface)',
                      color: full?'var(--text3)':isSel?'var(--accent-text)':'var(--text)',
                      cursor: full?'not-allowed':'pointer', textAlign:'center', fontFamily:'inherit',
                    }}>
                      <div style={{ fontSize:15, fontWeight:700 }}>{settings.slots[i]}</div>
                      <div style={{ fontSize:11, marginTop:4, color: full?'var(--red-text)':isSel?'var(--accent-text)':'var(--text3)', fontWeight:600 }}>
                        {full ? '❌ 満員' : `残り ${settings.maxPerSlot-cnt} 枠`}
                      </div>
                    </button>
                  )
                })}
              </div>
              {selSlot !== null && (
                <Btn variant="primary" size="lg" style={{ width:'100%', marginTop:16, padding: '14px', fontSize: 15 }} onClick={() => setStep(2)}>
                  次へ → お名前を入力する
                </Btn>
              )}
            </Card>
          )}
        </>
      )}

      {step === 2 && (
        <div>
          <Btn size="sm" style={{ marginBottom:16 }} onClick={() => setStep(1)}>‹ 戻る</Btn>
          <Card style={{ background:'var(--accent-light)', border:'1px solid rgba(37,99,235,0.2)', marginBottom:16 }}>
            <div style={{ fontSize:11, color:'var(--accent-text)', marginBottom:4, fontWeight:600 }}>予約内容</div>
            <div style={{ fontSize:15, fontWeight:700 }}>{dateLabel}</div>
            <div style={{ fontSize:13, color:'var(--accent-text)', marginTop:2 }}>{settings.slots[selSlot]}</div>
          </Card>
          <Card>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>お客様情報を入力してください</div>
            <Input label="お名前（必須）" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="山田 花子" />
            <Input label="電話番号" value={form.tel} onChange={e => setForm(f=>({...f,tel:e.target.value}))} placeholder="090-0000-0000" />
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5, fontWeight:500 }}>メモ・ご要望（任意）</label>
              <textarea value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} placeholder="初めての来店です…" style={{
                width:'100%', height:64, padding:'10px 12px', fontSize:13, resize:'none',
                border:'1px solid var(--border-strong)', borderRadius:'var(--radius-sm)',
                background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', lineHeight:1.6,
              }} />
            </div>
            <Btn variant="primary" size="lg" style={{ width:'100%', fontSize:16, padding:'16px', borderRadius:'var(--radius)' }} onClick={confirmBooking}>
              ✅ 予約を確定する
            </Btn>
          </Card>
        </div>
      )}
    </div>
  )
}
