import React from 'react'

export function Btn({ children, variant = 'default', size = 'md', style: ext, ...props }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    padding: size === 'sm' ? '6px 14px' : size === 'lg' ? '13px 24px' : '9px 18px',
    fontSize: size === 'sm' ? 12 : size === 'lg' ? 14 : 13,
    fontWeight: 600, borderRadius: 'var(--radius-sm)',
    border: '1.5px solid',
    borderColor: variant === 'primary' ? 'rgba(92,64,32,0.4)' : variant === 'danger' ? 'rgba(192,57,43,0.3)' : variant === 'ghost' ? 'transparent' : 'var(--border-strong)',
    background: variant === 'primary' ? 'var(--wood-gradient)' : variant === 'danger' ? 'var(--red-light)' : variant === 'ghost' ? 'transparent' : 'var(--surface)',
    color: variant === 'primary' ? '#FDF5E8' : variant === 'danger' ? 'var(--red-text)' : 'var(--text)',
    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
    fontFamily: 'inherit', lineHeight: 1.4,
    boxShadow: variant === 'primary' ? '0 3px 10px rgba(101,79,54,0.3)' : 'var(--shadow)',
    ...ext,
  }
  return <button style={base} {...props}>{children}</button>
}

export function Card({ children, style, gradient }) {
  return (
    <div style={{
      background: gradient || 'var(--surface)',
      border: '1.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
      boxShadow: 'var(--shadow)', ...style,
    }}>
      {children}
    </div>
  )
}

export function SectionTitle({ icon, title, desc }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}{title}
      </div>
      {desc && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{desc}</div>}
    </div>
  )
}

export function Badge({ children, color = 'gray' }) {
  const c = {
    green:  { bg: 'var(--green-light)',  color: 'var(--green-text)',  border: 'rgba(74,124,89,0.25)' },
    blue:   { bg: '#EBF0F8',             color: '#3A5A8C',            border: 'rgba(58,90,140,0.25)' },
    amber:  { bg: 'var(--amber-light)',  color: 'var(--amber-text)',  border: 'rgba(193,127,58,0.25)' },
    red:    { bg: 'var(--red-light)',    color: 'var(--red-text)',    border: 'rgba(192,57,43,0.25)' },
    gray:   { bg: 'var(--surface2)',     color: 'var(--text2)',       border: 'var(--border)' },
    wood:   { bg: '#F0E8DC',             color: '#5C4020',            border: 'rgba(92,64,32,0.25)' },
  }[color] || {}
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 600,
      padding: '3px 10px', borderRadius: 999,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>{children}</span>
  )
}

export function Metric({ label, value, color, icon, gradient }) {
  return (
    <div style={{
      background: gradient || 'var(--surface2)',
      borderRadius: 'var(--radius)', padding: '14px 16px',
      border: '1.5px solid var(--border)',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ fontSize: 11, color: gradient ? 'rgba(253,245,232,0.8)' : 'var(--text3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
        {icon && <span>{icon}</span>}{label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: gradient ? '#FDF5E8' : (color || 'var(--text)') }}>{value}</div>
    </div>
  )
}

export function Avatar({ name, size = 32, colorIndex = 0 }) {
  const palettes = [
    { bg: 'linear-gradient(135deg,#8B6340,#5C3D1E)', color: '#FDF5E8' },
    { bg: 'linear-gradient(135deg,#4A7C59,#2D5C3A)', color: '#EAF3EC' },
    { bg: 'linear-gradient(135deg,#C17F3A,#7A4E10)', color: '#FDF3E3' },
    { bg: 'linear-gradient(135deg,#7B5E9A,#4A3570)', color: '#F0EAF8' },
    { bg: 'linear-gradient(135deg,#3A7B8C,#1E4F5C)', color: '#E8F3F5' },
    { bg: 'linear-gradient(135deg,#8C5A3A,#5C3520)', color: '#F5EBE0' },
    { bg: 'linear-gradient(135deg,#5A7B3A,#3A5520)', color: '#EDF3E8' },
    { bg: 'linear-gradient(135deg,#7B3A5A,#5C2040)', color: '#F5E8EF' },
  ]
  const p = palettes[colorIndex % palettes.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: p.bg, color: p.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
      boxShadow: '0 2px 6px rgba(101,79,54,0.2)',
    }}>{name?.[0] || '?'}</div>
  )
}

export function Input({ label, hint, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5, fontWeight: 600 }}>{label}</label>}
      <input style={{
        width: '100%', padding: '10px 14px', fontSize: 14,
        border: '1.5px solid var(--border-strong)', borderRadius: 'var(--radius-sm)',
        background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit',
        outline: 'none',
      }} {...props} />
      {hint && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

export function Notice({ children, color = 'blue' }) {
  const c = {
    blue:  { bg: '#EBF0F8', border: 'rgba(58,90,140,0.2)',  text: '#3A5A8C', icon: 'ℹ️' },
    green: { bg: 'var(--green-light)', border: 'rgba(74,124,89,0.2)', text: 'var(--green-text)', icon: '✅' },
    amber: { bg: 'var(--amber-light)', border: 'rgba(193,127,58,0.2)', text: 'var(--amber-text)', icon: '⚠️' },
    wood:  { bg: '#F0E8DC', border: 'rgba(92,64,32,0.2)', text: 'var(--accent-text)', icon: '📋' },
  }[color] || {}
  return (
    <div style={{
      background: c.bg, border: `1.5px solid ${c.border}`,
      borderRadius: 'var(--radius)', padding: '12px 16px',
      fontSize: 13, color: c.text, marginBottom: 16,
      display: 'flex', alignItems: 'flex-start', gap: 10, lineHeight: 1.6,
    }}>
      <span style={{ flexShrink: 0, fontSize: 16 }}>{c.icon}</span>
      <div>{children}</div>
    </div>
  )
}

export function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
      <div style={{ flex: 1, height: 1.5, background: 'var(--border)' }} />
      {label && <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', fontWeight: 600 }}>{label}</span>}
      <div style={{ flex: 1, height: 1.5, background: 'var(--border)' }} />
    </div>
  )
}

export function StepIndicator({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              background: i < current ? 'var(--green)' : i === current ? 'var(--wood-gradient)' : 'var(--surface2)',
              color: i <= current ? '#FDF5E8' : 'var(--text3)',
              boxShadow: i === current ? '0 3px 10px rgba(101,79,54,0.3)' : 'none',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <div style={{ fontSize: 10, color: i === current ? 'var(--accent)' : 'var(--text3)', fontWeight: i === current ? 700 : 400, whiteSpace: 'nowrap' }}>{s}</div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? 'var(--green)' : 'var(--border)', margin: '0 4px', marginBottom: 20 }} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
