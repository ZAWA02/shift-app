import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import StaffHome from './pages/StaffHome'
import StaffPage from './pages/StaffPage'
import CustomerHome from './pages/CustomerHome'
import BookPage from './pages/BookPage'
import WagePage from './pages/WagePage'
import LoginPage from './pages/LoginPage'
import { checkPassword, saveSession, isSessionValid, clearSession } from './lib/auth'
import { useStore } from './lib/store'

function AdminRoute({ isLoggedIn, children }) {
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return children
}

function Layout({ children, isLoggedIn, onLogout }) {
  const loc = useLocation()
  const isStaff = loc.pathname.startsWith('/staff')
  const isCustomer = loc.pathname.startsWith('/customer') || loc.pathname === '/book'
  const isLogin = loc.pathname === '/login'
  const isAdmin = !isStaff && !isCustomer && !isLogin
  const { settings } = useStore()
  const shopName = settings?.shopName || 'シフト管理'
  const logoUrl = settings?.logoUrl || ''

  if (isLogin) return <>{children}</>

  const headerGradient = isAdmin
    ? 'linear-gradient(135deg, #6B4A2A 0%, #8B6340 40%, #7D5535 70%, #5C3D1E 100%)'
    : isStaff
    ? 'linear-gradient(135deg, #3A6B4A 0%, #4A7C59 60%, #2D5C3A 100%)'
    : 'linear-gradient(135deg, #7B5E3A 0%, #A07848 60%, #6B4A2A 100%)'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{
        background: headerGradient,
        padding: '0 1rem', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', height: 52, gap: 12, overflowX: 'auto' }}>
          <div style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, color: '#fff' }}>
            {logoUrl
              ? <img src={logoUrl} alt="logo" style={{ width:32, height:32, borderRadius:8, objectFit:'cover' }} onError={e => e.target.style.display='none'} />
              : <span style={{ fontSize: 22 }}>📋</span>
            }
            {shopName}
          </div>

          {isAdmin && (
            <>
              <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
                {[{ to: '/', icon: '🏠', label: '管理者' }, { to: '/wage', icon: '💴', label: '給与計算' }].map(n => (
                  <NavLink key={n.to} to={n.to} end style={({ isActive }) => ({
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                    textDecoration: 'none', whiteSpace: 'nowrap',
                    background: isActive ? 'rgba(253,245,232,0.2)' : 'transparent',
                    color: '#fff', display: 'flex', alignItems: 'center', gap: 5,
                  })}>
                    <span>{n.icon}</span>{n.label}
                  </NavLink>
                ))}
              </nav>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                <NavLink to="/staff" style={{ fontSize: 12, padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>👤 スタッフ</NavLink>
                <NavLink to="/customer" style={{ fontSize: 12, padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>🗓️ 予約</NavLink>
                <button onClick={onLogout} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit' }}>ログアウト</button>
              </div>
            </>
          )}

          {isStaff && (
            <>
              <div style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>👤 スタッフページ</div>
              <NavLink to="/staff" style={{ fontSize: 12, padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>🏠 ホーム</NavLink>
            </>
          )}

          {isCustomer && (
            <>
              <div style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>🗓️ お客様ページ</div>
              <NavLink to="/customer" style={{ fontSize: 12, padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>🏠 ホーム</NavLink>
            </>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '1.25rem 0.75rem' }}>
        {children}
      </main>
    </div>
  )
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => isSessionValid())

  const handleLogin = (password) => {
    if (checkPassword(password)) {
      saveSession()
      setIsLoggedIn(true)
      return true
    }
    return false
  }

  const handleLogout = () => {
    clearSession()
    setIsLoggedIn(false)
  }

  return (
    <Layout isLoggedIn={isLoggedIn} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<AdminRoute isLoggedIn={isLoggedIn}><AdminPage /></AdminRoute>} />
        <Route path="/wage" element={<AdminRoute isLoggedIn={isLoggedIn}><WagePage /></AdminRoute>} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/staff" element={<StaffHome />} />
        <Route path="/staff/wish" element={<StaffPage />} />
        <Route path="/customer" element={<CustomerHome />} />
        <Route path="/book" element={<BookPage />} />
      </Routes>
    </Layout>
  )
}
