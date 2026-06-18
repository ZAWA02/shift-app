// パスワードをlocalStorageで管理
const PW_KEY = 'shift-app-admin-pw'
const SESSION_KEY = 'shift-app-session'
const DEFAULT_PW = 'admin1234'

export function getPassword() {
  return localStorage.getItem(PW_KEY) || DEFAULT_PW
}

export function setPassword(newPw) {
  localStorage.setItem(PW_KEY, newPw)
}

export function checkPassword(input) {
  return input === getPassword()
}

export function saveSession() {
  // 24時間有効なセッション
  const expires = Date.now() + 24 * 60 * 60 * 1000
  localStorage.setItem(SESSION_KEY, JSON.stringify({ expires }))
}

export function isSessionValid() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    return s && s.expires > Date.now()
  } catch {
    return false
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}
