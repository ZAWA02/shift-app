// Service Worker登録（PWA）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { useStore } from './lib/store'
import { startRealtimeSync, startPolling } from './lib/sync'

// アプリ起動時にクラウドからデータを読み込む
useStore.getState().loadFromCloud().then(() => {
  // リアルタイム同期を開始
  startRealtimeSync()
  // 30秒ポーリングも開始（バックアップ）
  startPolling()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
