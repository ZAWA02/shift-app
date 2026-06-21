import React, { useState } from 'react'
import { useStore } from '../lib/store'
import { Card, Badge, Avatar, SectionTitle, Btn, Divider } from '../components/ui'
import { getDay } from 'date-fns'
import { checkPassword } from '../lib/auth'

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

export default function WagePage() {
  const { staff, calcWage, shiftMonth, setShiftMonth, settings, updateSettings, updateStaff, workReports, deleteWorkReport, addWorkReport } = useStore()
  const { year, month } = shiftMonth
  const [editingWage, setEditingWage] = useState(false)
  const [wageInputs, setWageInputs] = useState({})
  const [shiftHoursInput, setShiftHoursInput] = useState(settings.shiftHours ?? 6)
  const [hoursOverride, setHoursOverride] = useState({}) // staffId → 手動入力時間
  const [editingHours, setEditingHours] = useState({}) // staffId → 編集中かどうか
  const [expandedStaff, setExpandedStaff] = useState({}) // staffId → 詳細展開中かどうか

  // パスワード確認
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState(false)
  const [pwUnlocked, setPwUnlocked] = useState(false)

  const changeMonth = (delta) => {
    let m = month + delta, y = year
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    setShiftMonth(y, m)
    setHoursOverride({})
    setEditingHours({})
  }

  const cutoff = settings.cutoffDay || 20
  const prevMonth = month === 0 ? 12 : month
  const prevYear = month === 0 ? year - 1 : year
  const periodLabel = `${prevYear}年${prevMonth}月${cutoff+1}日 〜 ${year}年${month+1}月${cutoff}日`

  // 締め日に基づく対象期間のworkReports（例：20日締め → 前月21日〜当月20日）
  const prevM = month === 0 ? 11 : month - 1
  const prevY = month === 0 ? year - 1 : year
  const periodStart = `${prevY}-${String(prevM+1).padStart(2,'0')}-${String(cutoff+1).padStart(2,'0')}`
  const periodEnd = `${year}-${String(month+1).padStart(2,'0')}-${String(cutoff).padStart(2,'0')}`
  const monthReports = workReports.filter(r => r.date && r.date >= periodStart && r.date <= periodEnd)

  // スタッフごとの実績計算
  const calcActualWage = (s) => {
    // 手動上書きがあればそれを使う
    if (hoursOverride[s.id] !== undefined) {
      const h = parseFloat(hoursOverride[s.id]) || 0
      return {
        shiftDays: h > 0 ? 1 : 0,
        hours: h,
        wage: Math.round(s.hourlyWage * h),
        isActual: true,
        isOverride: true,
      }
    }
    const reports = monthReports.filter(r => r.staffId === s.id)
    if (reports.length > 0) {
      const totalHours = reports.reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0)
      return {
        shiftDays: reports.length,
        hours: totalHours,
        wage: Math.round(s.hourlyWage * totalHours),
        isActual: true,
        isOverride: false,
      }
    }
    // 基本時間が0の場合は勤務報告待ち（0時間表示）
    if ((settings.shiftHours ?? 6) === 0) {
      return { shiftDays: 0, hours: 0, wage: 0, isActual: false, isOverride: false }
    }
    const base = calcWage(s.id, year, month)
    return { ...base, isActual: false, isOverride: false }
  }

  const results = staff.map(s => ({ ...s, ...calcActualWage(s) }))
  const totalWage = results.reduce((sum, s) => sum + s.wage, 0)
  const totalHours = results.reduce((sum, s) => sum + s.hours, 0)

  const handleUnlock = () => {
    if (checkPassword(pwInput)) {
      setPwUnlocked(true); setPwError(false); setPwInput('')
    } else {
      setPwError(true); setPwInput('')
    }
  }

  const saveWages = () => {
    Object.entries(wageInputs).forEach(([id, wage]) => {
      const parsed = parseInt(wage)
      if (!isNaN(parsed) && parsed > 0) updateStaff(id, { hourlyWage: parsed })
    })
    const parsedHours = parseFloat(shiftHoursInput)
    if (!isNaN(parsedHours) && parsedHours >= 0) updateSettings({ shiftHours: parsedHours })
    setEditingWage(false); setPwUnlocked(false); setWageInputs({})
  }

  return (
    <div>
      {/* 月切り替え */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Btn size="sm" onClick={() => changeMonth(-1)}>‹ 前月</Btn>
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>{year}年{month+1}月分 給与計算</div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>対象期間：{periodLabel}</div>
          </div>
          <Btn size="sm" onClick={() => changeMonth(1)}>次月 ›</Btn>
        </div>
        <Btn size="sm" onClick={() => { setEditingWage(!editingWage); setPwUnlocked(false); setPwInput('') }}>
          {editingWage ? '✕ 閉じる' : '⚙️ 時給を編集'}
        </Btn>
      </div>

      {/* 時給編集パネル（パスワード保護） */}
      {editingWage && (
        <Card style={{ marginBottom:16, borderLeft:'3px solid var(--amber)' }}>
          <SectionTitle icon="🔐" title="時給・シフット時間の編集" desc="変更にはパスワードが必要です" />
          {!pwUnlocked ? (
            <div>
              <div style={{ fontSize:13, color:'var(--text2)', marginBottom:10 }}>管理者パスワードを入力してください</div>
              <div style={{ display:'flex', gap:8 }}>
                <input type="password" value={pwInput}
                  onChange={e => { setPwInput(e.target.value); setPwError(false) }}
                  onKeyDown={e => e.key==='Enter' && handleUnlock()}
                  placeholder="パスワード"
                  style={{ flex:1, padding:'10px 12px', fontSize:14, borderRadius:'var(--radius-sm)', border:pwError?'2px solid var(--red)':'1px solid var(--border-strong)', background:'var(--surface)', color:'var(--text)', fontFamily:'inherit' }}
                />
                <Btn variant="primary" onClick={handleUnlock}>確認</Btn>
              </div>
              {pwError && <div style={{ fontSize:12, color:'var(--red-text)', marginTop:6 }}>❌ パスワードが違います</div>}
            </div>
          ) : (
            <div>
              <div style={{ fontSize:12, color:'var(--green-text)', marginBottom:14, fontWeight:600 }}>✅ 認証済み — 編集できます</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:6, fontWeight:600 }}>1シフットあたりの基本時間</label>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <input type="number" step="0.5" min="0" max="12" value={shiftHoursInput}
                      onChange={e => setShiftHoursInput(e.target.value)}
                      style={{ padding:'8px 12px', fontSize:14, borderRadius:'var(--radius-sm)', border:'1px solid var(--border-strong)', background:'var(--surface)', color:'var(--text)', width:80, fontFamily:'inherit' }}
                    />
                    <span style={{ fontSize:12, color:'var(--text3)' }}>時間</span>
                  </div>
                  <div style={{ fontSize:10, color:'var(--amber-text)', marginTop:4 }}>
                    {parseFloat(shiftHoursInput) === 0 ? '⚠️ 0時間 = 勤務報告の時間だけで計算' : ''}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:6, fontWeight:600 }}>締め日（毎月◯日締め）</label>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <input type="number" min="1" max="28" value={settings.cutoffDay||20}
                      onChange={e => updateSettings({ cutoffDay: parseInt(e.target.value)||20 })}
                      style={{ padding:'8px 12px', fontSize:14, borderRadius:'var(--radius-sm)', border:'1px solid var(--border-strong)', background:'var(--surface)', color:'var(--text)', width:80, fontFamily:'inherit' }}
                    />
                    <span style={{ fontSize:12, color:'var(--text3)' }}>日締め</span>
                  </div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:4 }}>前月{(settings.cutoffDay||20)+1}日〜当月{settings.cutoffDay||20}日</div>
                </div>
              </div>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:10, fontWeight:600 }}>スタッフ別時給（円）</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:8, marginBottom:14 }}>
                {staff.map((s,i) => (
                  <div key={s.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'var(--surface2)', borderRadius:'var(--radius-sm)' }}>
                    <Avatar name={s.name} size={26} colorIndex={i} />
                    <div style={{ flex:1, fontSize:12, fontWeight:600 }}>{s.name.split(' ')[0]}</div>
                    <input type="number" min="500" max="5000" step="50"
                      value={wageInputs[s.id] ?? s.hourlyWage}
                      onChange={e => setWageInputs(prev => ({ ...prev, [s.id]: e.target.value }))}
                      style={{ width:72, padding:'5px 8px', fontSize:13, borderRadius:'var(--radius-sm)', border:'1px solid var(--border-strong)', background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', textAlign:'right' }}
                    />
                    <span style={{ fontSize:11, color:'var(--text3)' }}>円</span>
                  </div>
                ))}
              </div>
              <Btn variant="primary" size="lg" onClick={saveWages} style={{ width:'100%' }}>💾 保存する</Btn>
            </div>
          )}
        </Card>
      )}

      {/* サマリー */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        <Card style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>👥 出勤スタッフ</div>
          <div style={{ fontSize:20, fontWeight:700 }}>{results.filter(s=>s.hours>0).length}人</div>
        </Card>
        <Card style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>⏱️ 総労働時間</div>
          <div style={{ fontSize:20, fontWeight:700 }}>{totalHours}h</div>
        </Card>
        <Card style={{ padding:'14px 16px', borderLeft:'3px solid var(--green)' }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>💴 月間総人件費</div>
          <div style={{ fontSize:20, fontWeight:700, color:'var(--green-text)' }}>¥{totalWage.toLocaleString()}</div>
        </Card>
      </div>

      {/* スタッフ別明細 */}
      <Card style={{ marginBottom:16 }}>
        <SectionTitle icon="💴" title="スタッフ別 給与明細" desc={`対象期間：${periodLabel}`} />

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {results.map((s, i) => {
            const isExpanded = !!expandedStaff[s.id]
            const staffReports = monthReports.filter(r => r.staffId === s.id).sort((a,b) => a.date.localeCompare(b.date))
            return (
              <div key={s.id} style={{ border:'1.5px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden' }}>

                {/* スタッフ行ヘッダー */}
                <button
                  onClick={() => setExpandedStaff(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background: isExpanded ? 'var(--surface2)' : 'var(--surface)', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                  <Avatar name={s.name} size={32} colorIndex={i} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <span style={{ fontSize:14, fontWeight:700 }}>{s.name}</span>
                      <Badge color={s.role==='リーダー'?'blue':s.role==='フリーター'?'green':'gray'}>{s.role}</Badge>
                      {s.isActual && !s.isOverride && <Badge color="green">報告済</Badge>}
                      {s.isOverride && <Badge color="amber">手動</Badge>}
                    </div>
                    <div style={{ display:'flex', gap:12, marginTop:4, flexWrap:'wrap' }}>
                      <span style={{ fontSize:11, color:'var(--text3)' }}>時給 ¥{s.hourlyWage.toLocaleString()}</span>
                      <span style={{ fontSize:11, color:'var(--text2)', fontWeight:600 }}>{s.shiftDays}日 · {s.hours}h</span>
                      <span style={{ fontSize:12, fontWeight:700, color: s.wage>0?'var(--green-text)':'var(--text3)' }}>¥{s.wage.toLocaleString()}</span>
                    </div>
                  </div>
                  {/* 時間手動編集 */}
                  <div onClick={e => e.stopPropagation()}>
                    {editingHours[s.id] ? (
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <input type="number" min="0" max="200" step="0.5" defaultValue={s.hours} id={`hours-${s.id}`}
                          style={{ width:56, padding:'4px 6px', fontSize:12, borderRadius:'var(--radius-sm)', border:'2px solid var(--accent)', background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', textAlign:'right' }} autoFocus />
                        <span style={{ fontSize:11, color:'var(--text3)' }}>h</span>
                        <button onClick={() => {
                          const h = parseFloat(document.getElementById(`hours-${s.id}`)?.value)
                          if (!isNaN(h) && h >= 0) setHoursOverride(prev => ({ ...prev, [s.id]: h }))
                          setEditingHours(prev => ({ ...prev, [s.id]: false }))
                        }} style={{ padding:'4px 8px', background:'var(--green)', color:'white', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:11, fontWeight:700 }}>✓</button>
                        <button onClick={() => setEditingHours(prev => ({ ...prev, [s.id]: false }))}
                          style={{ padding:'4px 6px', background:'var(--surface2)', color:'var(--text3)', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:11 }}>✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setEditingHours(prev => ({ ...prev, [s.id]: true }))}
                        style={{ padding:'4px 8px', background:'transparent', color:'var(--text3)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', fontSize:11 }}>✏️ 時間編集</button>
                    )}
                  </div>
                  <span style={{ fontSize:14, color:'var(--text3)', marginLeft:4 }}>{isExpanded ? '▲' : '▼'}</span>
                </button>

                {/* 展開：日別詳細 */}
                {isExpanded && (
                  <div style={{ borderTop:'1px solid var(--border)', background:'var(--bg)', padding:'10px 12px' }}>
                    {staffReports.length === 0 ? (
                      <div style={{ padding:'10px 0', fontSize:12, color:'var(--text3)', textAlign:'center' }}>
                        勤務報告がありません（シフトベースの予定時間で計算中）
                      </div>
                    ) : (
                      <>
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {staffReports.map((r) => {
                            const [,rm,rd] = r.date.split('-')
                            const dw = getDay(new Date(r.date))
                            const amount = Math.round(s.hourlyWage * (parseFloat(r.hours)||0))
                            const submittedAt = r.createdAt ? new Date(r.createdAt) : null
                            return (
                              <div key={r.id} style={{ background:'var(--surface)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', padding:'10px 12px' }}>
                                {/* 1行目：日付 + 金額 */}
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                                  <span style={{ fontSize:14, fontWeight:700 }}>
                                    {parseInt(rm)}月{parseInt(rd)}日
                                    <span style={{ fontSize:12, fontWeight:600, color: dw===0?'var(--red)':dw===6?'var(--accent)':'var(--text3)', marginLeft:5 }}>({DAY_NAMES[dw]})</span>
                                  </span>
                                  <span style={{ fontSize:15, fontWeight:700, color:'var(--green-text)' }}>¥{amount.toLocaleString()}</span>
                                </div>
                                {/* 2行目：時間 × 時給 */}
                                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom: (r.memo||submittedAt) ? 6 : 0 }}>
                                  <span style={{ fontSize:12, padding:'2px 8px', background:'var(--accent-light)', color:'var(--accent-text)', borderRadius:999, fontWeight:600 }}>⏱️ {r.hours}時間</span>
                                  <span style={{ fontSize:11, color:'var(--text3)' }}>×</span>
                                  <span style={{ fontSize:12, color:'var(--text3)' }}>¥{s.hourlyWage.toLocaleString()}/h</span>
                                </div>
                                {/* 3行目：メモ・提出日時 */}
                                {(r.memo || submittedAt) && (
                                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:4 }}>
                                    {r.memo && <span style={{ fontSize:11, color:'var(--text3)', fontStyle:'italic' }}>💬 {r.memo}</span>}
                                    <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
                                      {submittedAt && <span style={{ fontSize:10, color:'var(--text3)' }}>提出 {submittedAt.getMonth()+1}/{submittedAt.getDate()} {String(submittedAt.getHours()).padStart(2,'0')}:{String(submittedAt.getMinutes()).padStart(2,'0')}</span>}
                                      <button onClick={() => { if(confirm('この報告を削除しますか？')) deleteWorkReport(r.id) }}
                                        style={{ fontSize:11, padding:'2px 8px', background:'var(--red-light)', color:'var(--red-text)', border:'none', borderRadius:4, cursor:'pointer', fontFamily:'inherit' }}>削除</button>
                                    </div>
                                  </div>
                                )}
                                {!r.memo && !submittedAt && (
                                  <div style={{ textAlign:'right' }}>
                                    <button onClick={() => { if(confirm('この報告を削除しますか？')) deleteWorkReport(r.id) }}
                                      style={{ fontSize:11, padding:'2px 8px', background:'var(--red-light)', color:'var(--red-text)', border:'none', borderRadius:4, cursor:'pointer', fontFamily:'inherit' }}>削除</button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                        {/* 小計 */}
                        <div style={{ marginTop:10, padding:'10px 12px', background:'var(--surface2)', borderRadius:'var(--radius-sm)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:12, color:'var(--text2)', fontWeight:600 }}>小計 {staffReports.length}日</span>
                          <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                            <span style={{ fontSize:13, fontWeight:700 }}>⏱️ {staffReports.reduce((a,r)=>a+(parseFloat(r.hours)||0),0)}h</span>
                            <span style={{ fontSize:14, fontWeight:700, color:'var(--green-text)' }}>¥{s.wage.toLocaleString()}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 合計行 */}
        <div style={{ marginTop:12, padding:'12px 16px', background:'var(--surface2)', borderRadius:'var(--radius-sm)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
          <span style={{ fontSize:13, fontWeight:700 }}>月間合計</span>
          <div style={{ display:'flex', gap:20 }}>
            <span style={{ fontSize:13, fontWeight:700 }}>⏱️ {totalHours}h</span>
            <span style={{ fontSize:15, fontWeight:700, color:'var(--green-text)' }}>💴 ¥{totalWage.toLocaleString()}</span>
          </div>
        </div>

        {Object.keys(hoursOverride).length > 0 && (
          <div style={{ marginTop:8, display:'flex', justifyContent:'flex-end' }}>
            <Btn size="sm" onClick={() => setHoursOverride({})} style={{ color:'var(--text3)' }}>↺ 手動編集をリセット</Btn>
          </div>
        )}
      </Card>

      {/* グラフ */}
      <Card style={{ marginBottom:16 }}>
        <SectionTitle icon="📊" title="シフット日数グラフ" />
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[...results].sort((a,b)=>b.hours-a.hours).map(s => {
            const maxHours = Math.max(...results.map(x=>x.hours), 1)
            const pct = (s.hours/maxHours)*100
            return (
              <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:80, fontSize:12, fontWeight:600, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name.split(' ')[0]}</div>
                <div style={{ flex:1, background:'var(--surface2)', borderRadius:4, height:20, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:4, background:s.isActual?'var(--green)':s.hours>=40?'var(--accent)':'var(--amber)', width:`${pct}%`, transition:'width 0.4s ease', display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:6 }}>
                    {pct>20 && <span style={{ fontSize:10, fontWeight:700, color:'#fff' }}>{s.hours}h</span>}
                  </div>
                </div>
                <div style={{ width:80, fontSize:12, textAlign:'right', color:'var(--text2)', flexShrink:0 }}>¥{s.wage.toLocaleString()}</div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 勤務報告一覧 */}
      <Card>
        <SectionTitle icon="📋" title="勤務報告一覧" desc={`対象期間：${periodLabel}`} />
        {monthReports.length===0
          ? <div style={{ textAlign:'center', padding:'1.5rem 0', color:'var(--text3)', fontSize:13 }}><div style={{ fontSize:28, marginBottom:8 }}>📭</div>まだ勤務報告はありません</div>
          : monthReports.sort((a,b)=>a.date.localeCompare(b.date)).map((r,i) => {
            const s = staff.find(x => x.id===r.staffId)
            const si = staff.indexOf(s)
            const [ry,rm,rd] = r.date.split('-')
            const dw = getDay(new Date(r.date))
            const submittedAt = r.createdAt ? new Date(r.createdAt) : null
            const submittedLabel = submittedAt
              ? `${submittedAt.getFullYear()}/${submittedAt.getMonth()+1}/${submittedAt.getDate()} ${String(submittedAt.getHours()).padStart(2,'0')}:${String(submittedAt.getMinutes()).padStart(2,'0')} 提出`
              : ''
            return (
              <div key={r.id} style={{ padding:'12px 0', borderBottom:i<monthReports.length-1?'1px solid var(--border)':'none' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <Avatar name={r.staffName} size={36} colorIndex={si>=0?si:0} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                      <span style={{ fontSize:14, fontWeight:700 }}>{r.staffName}</span>
                      {s && <span style={{ fontSize:11, color:'var(--text3)' }}>時給 ¥{s.hourlyWage.toLocaleString()}</span>}
                    </div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:4 }}>
                      <span style={{ fontSize:12, padding:'2px 8px', background:'var(--accent-light)', color:'var(--accent-text)', borderRadius:999, fontWeight:600 }}>
                        📅 {parseInt(rm)}月{parseInt(rd)}日（{DAY_NAMES[dw]}）
                      </span>
                      <span style={{ fontSize:12, padding:'2px 8px', background:'var(--green-light)', color:'var(--green-text)', borderRadius:999, fontWeight:700 }}>
                        ⏱️ {r.hours}時間
                      </span>
                      {s && <span style={{ fontSize:12, padding:'2px 8px', background:'rgba(74,124,89,0.1)', color:'var(--green-text)', borderRadius:999, fontWeight:700 }}>
                        💴 ¥{(s.hourlyWage * r.hours).toLocaleString()}
                      </span>}
                    </div>
                    {r.memo && <div style={{ fontSize:11, color:'var(--text3)', marginBottom:3, fontStyle:'italic' }}>💬 「{r.memo}」</div>}
                    {submittedLabel && <div style={{ fontSize:10, color:'var(--text3)' }}>🕐 {submittedLabel}</div>}
                  </div>
                  <Btn size="sm" variant="danger" onClick={() => { if(confirm('この報告を削除しますか？')) deleteWorkReport(r.id) }}>削除</Btn>
                </div>
              </div>
            )
          })
        }
        {monthReports.length > 0 && (
          <div style={{ marginTop:12, padding:'10px 12px', background:'var(--surface2)', borderRadius:'var(--radius-sm)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12, color:'var(--text2)', fontWeight:600 }}>期間合計 ({monthReports.length}件)</span>
            <div style={{ display:'flex', gap:16 }}>
              <span style={{ fontSize:13, fontWeight:700 }}>⏱️ {monthReports.reduce((s,r)=>s+(parseFloat(r.hours)||0),0)}時間</span>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--green-text)' }}>
                💴 ¥{monthReports.reduce((s,r)=>{
                  const st=staff.find(x=>x.id===r.staffId)
                  return s+(st?(st.hourlyWage*(parseFloat(r.hours)||0)):0)
                },0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
