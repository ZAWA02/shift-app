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
  const [tappedDay, setTappedDay] = useState(null) // カレンダーでタップした日

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
    setTappedDay(null)
  }

  const selectedStaff = staff.find(s => s.id === selectedStaffId)
  const myShifts = selectedStaffId ? (monthShifts[selectedStaffId] || {}) : {}
  const myShiftDays = Object.keys(myShifts).filter(d => myShifts[d]).map(d => parseInt(d)+1).sort((a,b)=>a-b)

  // この月の勤務報告（選択スタッフ）
  const myReports = workReports
    .filter(r => r.staffId === selectedStaffId && (r.date||'').startsWith(mk))
    .sort((a,b) => a.date.localeCompare(b.date))

  // シフト日を選択肢に
  const shiftDateOptions = myShiftDays.map(d => {
    const dw = getDay(new Date(selYear, selMonth, d))
    const dk = `${selYear}-${String(selMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return { label: `${selMonth+1}月${d}日（${DAY_NAMES[dw]}）`, value: dk }
  })

  // タップした日の予約一覧
  const tappedDayKey = tappedDay ? `${selYear}-${String(selMonth+1).padStart(2,'0')}-${String(tappedDay).padStart(2,'0')}` : null
  const tappedBookings = tappedDay ? bookings.filter(b => b.dateKey === tappedDayKey) : []

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
              <button key={s.id} onClick={() => { setSelectedStaffId(isSel ? '' : s.id); setShowReport(false); setReportDone(false); setTappedDay(null) }} style={{
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

      {/* シフト＋予約統合カレンダー */}
      <Card style={{ marginBottom: 16, padding: '1rem 0.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, flexWrap:'wrap', gap:8 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            📅 {selectedStaff ? `${selectedStaff.name.split(' ')[0]}さんの` : ''}{selYear}年{selMonth+1}月
          </div>
          {(() => {
            const confirmed = !!confirmedShifts[mk]
            return confirmed
              ? <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:999, background:'var(--green-light)', color:'var(--green-text)', border:'1px solid rgba(74,124,89,0.25)' }}>✅ 確定済み</span>
              : <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:999, background:'var(--amber-light)', color:'var(--amber-text)', border:'1px solid rgba(193,127,58,0.25)' }}>⏳ 調整中</span>
          })()}
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
            const dw = getDay(new Date(selYear, selMonth, d))
            const dayIdx = d - 1
            const dk = `${selYear}-${String(selMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`

            // シフト情報
            const hasShift = selectedStaffId ? !!myShifts[dayIdx] : staff.some(s => (monthShifts[s.id]||{})[dayIdx])
            const staffCount = !selectedStaffId ? staff.filter(s => (monthShifts[s.id]||{})[dayIdx]).length : 0
            const isNg = selectedStaffId ? (monthWishes[selectedStaffId]||{})[dayIdx] === 'ng' : false

            // 予約情報
            const dayBookingCount = bookings.filter(b => b.dateKey === dk).length
            const hasBooking = dayBookingCount > 0

            const isToday = selYear===now.getFullYear() && selMonth===now.getMonth() && d===now.getDate()
            const isTapped = tappedDay === d

            // 背景色の優先度：タップ > シフト > 予約のみ > NG > 通常
            let bg = 'var(--surface)'
            if (isTapped) bg = '#FDF2F8'
            else if (hasShift && selectedStaffId) bg = '#DCFCE7'
            else if (hasShift && !selectedStaffId) bg = '#E6F1FB'
            else if (isNg) bg = '#FEF2F2'

            return (
              <button key={d}
                onClick={() => setTappedDay(isTapped ? null : d)}
                style={{
                  aspectRatio: '1', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)',
                  border: isTapped ? '2px solid #EC4899' : isToday ? '2px solid var(--text)' : '1px solid var(--border)',
                  background: bg,
                  cursor: 'pointer', fontFamily: 'inherit', padding: 0, position: 'relative',
                }}>
                {/* メインラベル */}
                <span style={{
                  fontSize: 11, fontWeight: isToday||isTapped ? 700 : 400, lineHeight: 1,
                  color: hasShift && selectedStaffId ? 'var(--green-text)'
                    : hasShift ? 'var(--accent-text)'
                    : isNg ? 'var(--red-text)'
                    : dw===0?'var(--red)':dw===6?'var(--accent)':'var(--text)',
                }}>
                  {hasShift && selectedStaffId ? '◯' : d}
                </span>

                {/* シフト人数（全体表示時）*/}
                {!selectedStaffId && staffCount > 0 && (
                  <span style={{ fontSize: 8, color: 'var(--accent-text)', fontWeight: 700, lineHeight: 1 }}>{staffCount}人</span>
                )}

                {/* NG */}
                {selectedStaffId && isNg && !hasShift && (
                  <span style={{ fontSize: 8, color: 'var(--red-text)', lineHeight: 1 }}>×</span>
                )}

                {/* 予約件数バッジ（ピンク） */}
                {hasBooking && (
                  <span style={{
                    position: 'absolute', bottom: 2, right: 2,
                    fontSize: 7, fontWeight: 700, lineHeight: 1,
                    color: '#EC4899',
                    background: 'rgba(236,72,153,0.12)',
                    borderRadius: 3,
                    padding: '1px 2px',
                  }}>
                    予{dayBookingCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* 凡例 */}
        <div style={{ display:'flex', gap:10, marginTop:10, fontSize:10, color:'var(--text3)', flexWrap:'wrap' }}>
          {selectedStaffId && <span><span style={{ color:'var(--green-text)', fontWeight:700 }}>◯</span> 出勤確定</span>}
          {!selectedStaffId && <span><span style={{ display:'inline-block', width:8, height:8, borderRadius:2, background:'#E6F1FB', border:'1px solid #93C5FD', verticalAlign:'middle', marginRight:2 }}></span>出勤あり</span>}
          <span><span style={{ color:'#EC4899', fontWeight:700 }}>予N</span> お客さん予約数</span>
          {selectedStaffId && <span><span style={{ color:'var(--red-text)', fontWeight:700 }}>×</span> NG</span>}
          <span style={{ color:'var(--text3)' }}>← 日付タップで予約詳細</span>
        </div>

        {/* タップした日の予約詳細 */}
        {tappedDay && (
          <div style={{ marginTop:12, padding:'10px 12px', background:'#FDF2F8', borderRadius:'var(--radius-sm)', border:'1px solid rgba(236,72,153,0.25)' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#9D174D', marginBottom:6 }}>
              {selMonth+1}月{tappedDay}日（{DAY_NAMES[getDay(new Date(selYear, selMonth, tappedDay))]}）の予約
            </div>
            {tappedBookings.length === 0 ? (
              <div style={{ fontSize:12, color:'var(--text3)' }}>予約はありません</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {tappedBookings.map((b, i) => (
                  <div key={b.id||i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', background:'white', borderRadius:'var(--radius-sm)', border:'1px solid rgba(236,72,153,0.2)' }}>
                    <div style={{ fontSize:18 }}>👤</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700 }}>{b.name} 様</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{b.slot}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 出勤予定日リスト */}
        {selectedStaffId && myShiftDays.length > 0 && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--green-light)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green-text)', marginBottom: 4 }}>出勤予定日</div>
            <div style={{ fontSize: 12, color: 'var(--green-text)' }}>
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
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5, fontWeight: 600 }}>実際に働いた時間</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="number" min="0" max="24" step="0.5" value={reportHours}
                    onChange={e => setReportHours(e.target.value)} placeholder="例：6.5"
                    style={{ flex: 1, padding: '10px 12px', fontSize: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit' }} />
                  <span style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 600 }}>時間</span>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5, fontWeight: 600 }}>メモ（任意）</label>
                <textarea value={reportMemo} onChange={e => setReportMemo(e.target.value)}
                  placeholder="例：早退しました / 残業しました など"
                  style={{ width: '100%', height: 60, padding: '8px 12px', fontSize: 13, resize: 'none', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit' }} />
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
              <Btn size="sm" onClick={() => setReportDone(false)}>続けて報告する</Btn>
            </div>
          )}
        </Card>
      )}

      {/* 自分の勤務報告履歴（スタッフ別） */}
      {selectedStaffId && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
            📋 {selectedStaff?.name.split(' ')[0]}さんの{selMonth+1}月勤務報告
          </div>
          {myReports.length === 0 ? (
            <div style={{ textAlign:'center', padding:'1rem 0', color:'var(--text3)', fontSize:12 }}>
              <div style={{ fontSize:24, marginBottom:6 }}>📭</div>
              まだ勤務報告はありません
            </div>
          ) : (
            <>
              {myReports.map((r, i) => {
                const [,rm,rd] = r.date.split('-')
                const dw = getDay(new Date(r.date))
                const submittedAt = r.createdAt ? new Date(r.createdAt) : null
                return (
                  <div key={r.id} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom: i < myReports.length-1 ? '1px solid var(--border)' : 'none' }}>
                    {/* 日付バッジ */}
                    <div style={{ textAlign:'center', minWidth:38, padding:'6px 4px', background:'var(--accent-light)', borderRadius:'var(--radius-sm)', flexShrink:0 }}>
                      <div style={{ fontSize:10, color:'var(--accent-text)', fontWeight:600 }}>{parseInt(rm)}月</div>
                      <div style={{ fontSize:16, fontWeight:700, color:'var(--accent-text)', lineHeight:1 }}>{parseInt(rd)}</div>
                      <div style={{ fontSize:9, color:'var(--accent-text)' }}>{DAY_NAMES[dw]}</div>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:3, flexWrap:'wrap' }}>
                        <span style={{ fontSize:13, fontWeight:700, color:'var(--accent-text)' }}>⏱️ {r.hours}時間</span>
                        {selectedStaff && (
                          <span style={{ fontSize:12, color:'var(--green-text)', fontWeight:600 }}>
                            💴 ¥{(selectedStaff.hourlyWage * r.hours).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {r.memo && <div style={{ fontSize:11, color:'var(--text3)', fontStyle:'italic', marginBottom:2 }}>「{r.memo}」</div>}
                      {submittedAt && (
                        <div style={{ fontSize:10, color:'var(--text3)' }}>
                          提出：{submittedAt.getMonth()+1}/{submittedAt.getDate()} {String(submittedAt.getHours()).padStart(2,'0')}:{String(submittedAt.getMinutes()).padStart(2,'0')}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {/* 月合計 */}
              <div style={{ marginTop:10, padding:'8px 12px', background:'var(--surface2)', borderRadius:'var(--radius-sm)', display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, color:'var(--text2)', fontWeight:600 }}>{selMonth+1}月合計</span>
                <div style={{ display:'flex', gap:12 }}>
                  <span style={{ fontSize:13, fontWeight:700 }}>
                    ⏱️ {myReports.reduce((s,r) => s + (parseFloat(r.hours)||0), 0)}時間
                  </span>
                  {selectedStaff && (
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--green-text)' }}>
                      💴 ¥{myReports.reduce((s,r) => s + selectedStaff.hourlyWage * (parseFloat(r.hours)||0), 0).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </Card>
      )}

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
