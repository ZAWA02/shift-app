import React, { useState } from 'react'
import { Card, Btn } from '../components/ui'

export default function LoginPage({ onLogin }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setLoading(true)
    setTimeout(() => {
      const ok = onLogin(pw)
      if (!ok) {
        setError(true)
        setLoading(false)
        setPw('')
      }
    }, 400)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>シフト管理</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>管理者ログイン</div>
        </div>

        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>パスワードを入力してください</div>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false) }}
            onKeyDown={e => e.key === 'Enter' && pw.length > 0 && handleLogin()}
            placeholder="パスワード"
            autoFocus
            style={{
              width: '100%', padding: '13px 14px', fontSize: 16, marginBottom: 6,
              borderRadius: 'var(--radius-sm)',
              border: error ? '2px solid var(--red)' : '2px solid var(--border-strong)',
              background: 'var(--surface)', color: 'var(--text)',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: 'var(--red-text)', marginBottom: 12, fontWeight: 500 }}>
              ❌ パスワードが違います。もう一度お試しください。
            </div>
          )}
          {!error && <div style={{ marginBottom: 14 }} />}
          <Btn
            variant="primary" size="lg"
            style={{ width: '100%', fontSize: 15, opacity: pw.length > 0 ? 1 : 0.4 }}
            onClick={handleLogin}
            disabled={pw.length === 0 || loading}
          >
            {loading ? '確認中...' : 'ログインする →'}
          </Btn>
        </Card>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text3)', lineHeight: 1.8 }}>
          スタッフ用：<code style={{ background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>/staff</code><br />
          お客さん用：<code style={{ background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>/customer</code><br />
          はログイン不要です
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, padding: '10px 14px', background: 'var(--amber-light)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--amber-text)' }}>
          ⚠️ 初期パスワード：<strong>admin1234</strong><br />
          設定画面から変更してください
        </div>
      </div>
    </div>
  )
}
