import { supabase } from './supabase'
import { useStore } from './store'

// リアルタイム同期 — Supabaseの変更を即座に反映
export function startRealtimeSync() {
  const keys = ['staff', 'wishes', 'bookings', 'shifts', 'settings', 'workReports', 'confirmedShifts', 'announcements']

  keys.forEach(key => {
    supabase
      .channel(`sync:${key}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'app_data',
        filter: `key=eq.${key}`
      }, payload => {
        if (payload.new?.data) {
          try {
            const data = JSON.parse(payload.new.data)
            useStore.setState({ [key]: data })
          } catch {}
        }
      })
      .subscribe()
  })
}

// 30秒ごとにクラウドから再読み込み（リアルタイムが繋がらない場合のフォールバック）
export function startPolling() {
  setInterval(() => {
    useStore.getState().loadFromCloud()
  }, 30000)
}
