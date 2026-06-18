import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rswwfzpnnildhtawdhgl.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzd3dmenBubmlsZGh0YXdkaGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjI4MTcsImV4cCI6MjA5NTM5ODgxN30.3jyGHZ3Z1RU7tAr_Dh9lWmuhFKsV7t6thJpRfbYFWeA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// キーごとにデータをクラウドに保存
export async function cloudSet(key, value) {
  try {
    const { error } = await supabase
      .from('app_data')
      .upsert({ key, data: JSON.stringify(value), updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) console.warn('cloudSet error:', error)
  } catch (e) {
    console.warn('cloudSet failed:', e)
  }
}

// クラウドからデータを取得
export async function cloudGet(key) {
  try {
    const { data, error } = await supabase
      .from('app_data')
      .select('data')
      .eq('key', key)
      .single()
    if (error || !data) return null
    return JSON.parse(data.data)
  } catch (e) {
    return null
  }
}

// リアルタイム購読（他のデバイスの変更を即反映）
export function subscribeToKey(key, callback) {
  return supabase
    .channel(`app_data:${key}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'app_data',
      filter: `key=eq.${key}`
    }, payload => {
      if (payload.new?.data) callback(JSON.parse(payload.new.data))
    })
    .subscribe()
}
