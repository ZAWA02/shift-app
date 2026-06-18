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

  // この月のworkReports
  const mk = `${year}-${String(month+1).padStart(2,'0')}`
  const monthReports = workReports.filter(r => r.date?.startsWith(mk))

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
        <SectionTitle icon="💴" title="スタッフ別 給与明細" desc={`対象期間：${periodLabel}　⏱️ 時間の鉛筆アイコンで直接編集できます`} />
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:'2px solid var(--border)' }}>
                {['名前','役割','時給','日数','労働時間','給与',''].map((h,i) => (
                  <th key={i} style={{ padding:'8px 12px', textAlign:i<=1?'left':'right', color:'var(--text2)', fontSize:11, fontWeight:600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((s,i) => (
                <tr key={s.id} style={{ borderBottom:i<results.length-1?'1px solid var(--border)':'none', background:i%2===0?'transparent':'rgba(0,0,0,0.015)' }}>
                  <td style={{ padding:'10px 12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Avatar name={s.name} size={26} colorIndex={i} />
                      <span style={{ fontWeight:600 }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'10px 12px' }}>
                    <Badge color={s.role==='リーダー'?'blue':s.role==='フリーター'?'green':'gray'}>{s.role}</Badge>
                  </td>
                  <td style={{ padding:'10px 12px', textAlign:'right' }}>¥{s.hourlyWage.toLocaleString()}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right' }}>{s.shiftDays}日</td>
                  <td style={{ padding:'6px 12px', textAlign:'right' }}>
                    {editingHours[s.id] ? (
                      <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'flex-end' }}>
                        <input
                          type="number" min="0" max="24" step="0.5"
                          defaultValue={s.hours}
                          id={`hours-${s.id}`}
                          style={{ width:60, padding:'4px 8px', fontSize:13, borderRadius:'var(--radius-sm)', border:'2px solid var(--accent)', background:'var(--surface)', color:'var(--text)', fontFamily:'inherit', textAlign:'right' }}
                          autoFocus
                        />
                        <span style={{ fontSize:12, color:'var(--text3)' }}>h</span>
                        <button onClick={() => {
                          const val = document.getElementById(`hours-${s.id}`)?.value
                          const h = parseFloat(val)
                          if (!isNaN(h) && h >= 0) setHoursOverride(prev => ({ ...prev, [s.id]: h }))
                          setEditingHours(prev => ({ ...prev, [s.id]: false }))
                        }} style={{ padding:'4px 8px', background:'var(--green)', color:'white', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:12, fontWeight:700 }}>✓</button>
                        <button onClick={() => setEditingHours(prev => ({ ...prev, [s.id]: false }))}
                          style={{ padding:'4px 6px', background:'var(--surface2)', color:'var(--text3)', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:12 }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
                        <span style={{ fontWeight:600 }}>{s.hours}</span>
                        <span style={{ fontSize:11, color:s.isActual?'var(--green-text)':'var(--text3)' }}>
                          {s.isOverride ? '📝' : s.isActual ? '実績' : '予定'}
                        </span>
                        <span style={{ fontSize:10, color:'var(--text3)' }}>h</span>
                        <button onClick={() => setEditingHours(prev => ({ ...prev, [s.id]: true }))}
                          title="時間を直接編集"
                          style={{ padding:'2px 6px', background:'transparent', color:'var(--text3)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', fontSize:11 }}>✏️</button>
                      </div>
                    )}
                  </td>
                  <td style={{ padding:'10px 12px', textAlign:'right' }}>
                    <span style={{ fontWeight:700, fontSize:14, color:s.wage>0?'var(--green-text)':'var(--text3)' }}>
                      ¥{s.wage.toLocaleString()}
                    </span>
                  </td>
                  <td style={{ padding:'10px 4px', textAlign:'right' }}>
                    {s.isActual && !s.isOverride && <Badge color="green">報告済</Badge>}
                    {s.isOverride && <Badge color="amber">手動</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop:'2px solid var(--border)', background:'var(--surface2)' }}>
                <td colSpan={4} style={{ padding:'10px 12px', fontWeight:700 }}>合計</td>
                <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:700 }}>{totalHours}h</td>
                <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:700, fontSize:15, color:'var(--green-text)' }}>¥{totalWage.toLocaleString()}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        {Object.keys(hoursOverride).length > 0 && (
          <div style={{ marginTop:10, display:'flex', justifyContent:'flex-end' }}>
            <Btn size="sm" onClick={() => setHoursOverride({})} style={{ color:'var(--text3)' }}>
              ↺ 手動編集をリセット
            </Btn>
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
        <SectionTitle icon="📋" title="勤務報告一覧" desc="スタッフから送られた実績報告" />
        {monthReports.length===0
          ? <div style={{ textAlign:'center', padding:'1.5rem 0', color:'var(--text3)', fontSize:13 }}><div style={{ fontSize:28, marginBottom:8 }}>📭</div>まだ勤務報告はありません</div>
          : monthReports.sort((a,b)=>a.date.localeCompare(b.date)).map((r,i) => {
            const s = staff.find(x => x.id===r.staffId)
            const si = staff.indexOf(s)
            const [,,d] = r.date.split('-')
            const dw = getDay(new Date(r.date))
            return (
              <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:i<monthReports.length-1?'1px solid var(--border)':'none' }}>
                <Avatar name={r.staffName} size={32} colorIndex={si>=0?si:0} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{r.staffName}</div>
                  <div style={{ fontSize:12, color:'var(--text2)' }}>
                    {month+1}月{parseInt(d)}日（{DAY_NAMES[dw]}）　⏱️ {r.hours}時間
                    {s && <span style={{ marginLeft:6, color:'var(--green-text)', fontWeight:600 }}>→ ¥{(s.hourlyWage*r.hours).toLocaleString()}</span>}
                  </div>
                  {r.memo && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2, fontStyle:'italic' }}>「{r.memo}」</div>}
                </div>
                <Btn size="sm" variant="danger" onClick={() => { if(confirm('この報告を削除しますか？')) deleteWorkReport(r.id) }}>削除</Btn>
              </div>
            )
          })
        }
      </Card>
    </div>
  )
}
