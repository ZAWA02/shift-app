import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cloudSet, cloudGet, subscribeToKey } from './supabase'
import { notifyBooking, notifyShiftConfirmed, notifyBookingCancelled, notifyAnnouncement } from './discord'

const DEFAULT_STAFF = [
  { id: '1', name: '田中 あおい', role: 'リーダー', hourlyWage: 1200 },
  { id: '2', name: '佐藤 けんじ', role: 'フリーター', hourlyWage: 1100 },
  { id: '3', name: '鈴木 みか',   role: '学生',       hourlyWage: 1050 },
  { id: '4', name: '高橋 ゆき',   role: '学生',       hourlyWage: 1050 },
  { id: '5', name: '伊藤 りょう', role: 'フリーター', hourlyWage: 1100 },
  { id: '6', name: '渡辺 さら',   role: '学生',       hourlyWage: 1050 },
  { id: '7', name: '中村 たかし', role: 'リーダー',   hourlyWage: 1200 },
  { id: '8', name: '小林 はるか', role: '学生',       hourlyWage: 1050 },
]

const DEFAULT_SETTINGS = {
  shopName: 'My Shop',
  shopDescription: '',
  logoUrl: '',
  slots: ['16:00〜17:00','17:00〜18:00','18:00〜19:00','19:00〜20:00','20:00〜21:00','21:00〜22:00'],
  enabledSlots: [0,1,2,3,4,5],
  maxPerSlot: 3,
  shiftHours: 6,
  cutoffDay: 20, // 締め日（例：20なら前月21日〜当月20日）
  notify: {
    booking: true,       // 予約が入ったとき
    cancel: true,        // 予約キャンセル
    shiftConfirm: true,  // シフト確定
    announcement: true,  // お知らせ送信
  },
}

export function monthKey(year, month) {
  return `${year}-${String(month+1).padStart(2,'0')}`
}

function applyWishToShifts(staffId, newWish, staff, monthShifts, year, month) {
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const s = JSON.parse(JSON.stringify(monthShifts || {}))
  const count = {}
  staff.forEach(x => {
    count[x.id] = Object.keys(s[x.id]||{}).filter(d => parseInt(d)<daysInMonth && s[x.id][d]).length
  })
  if (!s[staffId]) s[staffId] = {}
  for (let d = 0; d < daysInMonth; d++) {
    const w = newWish[d]
    if (w === 'ok') {
      staff.filter(x => x.id!==staffId && s[x.id]?.[d]).forEach(other => {
        if ((count[other.id]||0) > (count[staffId]||0)) s[other.id][d] = false
      })
      s[staffId][d] = true
      count[staffId] = (count[staffId]||0) + 1
    } else if (w === 'ng') {
      s[staffId][d] = false
    }
  }
  return s
}

// クラウドに同期するヘルパー
async function syncCloud(key, data) {
  try { await cloudSet(key, data) } catch {}
}

export const useStore = create(
  persist(
    (set, get) => ({
      staff: DEFAULT_STAFF,
      wishes: {},
      bookings: [],
      shifts: {},
      settings: DEFAULT_SETTINGS,
      shiftMonth: { year: new Date().getFullYear(), month: new Date().getMonth() },
      cloudSynced: false,
      confirmedShifts: {}, // { "2025-06": true } 月ごとの確定状態
      announcements: [], // { id, title, body, createdAt }
      workReports: [], // { id, staffId, staffName, date, hours, memo, createdAt }

      // クラウドからデータを読み込み（起動時に呼ぶ）
      loadFromCloud: async () => {
        try {
          const [staff, wishes, bookings, shifts, settings, workReports, confirmedShifts, announcements] = await Promise.all([
            cloudGet('staff'), cloudGet('wishes'), cloudGet('bookings'),
            cloudGet('shifts'), cloudGet('settings'), cloudGet('workReports'),
            cloudGet('confirmedShifts'), cloudGet('announcements'),
          ])
          set({
            staff: staff || get().staff,
            wishes: wishes || get().wishes,
            bookings: bookings || get().bookings,
            shifts: shifts || get().shifts,
            settings: settings || get().settings,
            workReports: workReports || get().workReports,
            confirmedShifts: confirmedShifts || get().confirmedShifts,
            announcements: announcements || get().announcements,
            cloudSynced: true,
          })
        } catch (e) {
          console.warn('Cloud load failed, using local data:', e)
          set({ cloudSynced: false })
        }
      },

      // ---- スタッフ ----
      addStaff: (name, role, hourlyWage) => {
        const id = Date.now().toString()
        const staff = [...get().staff, { id, name, role, hourlyWage: parseInt(hourlyWage)||1000 }]
        set({ staff })
        syncCloud('staff', staff)
      },
      removeStaff: (id) => {
        const staff = get().staff.filter(x => x.id !== id)
        set({ staff })
        syncCloud('staff', staff)
      },
      updateStaff: (id, data) => {
        const staff = get().staff.map(x => x.id===id ? {...x,...data} : x)
        set({ staff })
        syncCloud('staff', staff)
      },

      // ---- 希望（クラウド同期付き） ----
      saveWish: (staffId, wishData, year, month) => {
        const { staff, wishes, shifts } = get()
        const mk = monthKey(year, month)
        const updatedWishes = { ...wishes, [mk]: { ...(wishes[mk]||{}), [staffId]: wishData } }
        const updatedShifts = {
          ...shifts,
          [mk]: applyWishToShifts(staffId, wishData, staff, shifts[mk], year, month)
        }
        set({ wishes: updatedWishes, shifts: updatedShifts })
        syncCloud('wishes', updatedWishes)
        syncCloud('shifts', updatedShifts)
      },

      // ---- 予約（クラウド同期付き） ----
      addBooking: (booking) => {
        const id = Date.now().toString()
        const newBooking = {...booking, id, createdAt: new Date().toISOString()}
        const bookings = [...get().bookings, newBooking]
        set({ bookings })
        syncCloud('bookings', bookings)
        if (get().settings?.notify?.booking !== false) notifyBooking(newBooking)
      },
      cancelBooking: (id) => {
        const booking = get().bookings.find(b => b.id === id)
        const bookings = get().bookings.filter(b => b.id !== id)
        set({ bookings })
        syncCloud('bookings', bookings)
        if (booking && get().settings?.notify?.cancel !== false) notifyBookingCancelled(booking)
      },
      // シフト確定
      confirmShift: (year, month) => {
        const mk = `${year}-${String(month+1).padStart(2,'0')}`
        const confirmedShifts = { ...get().confirmedShifts, [mk]: true }
        set({ confirmedShifts })
        syncCloud('confirmedShifts', confirmedShifts)
        const { staff, shifts } = get()
        const monthShifts = shifts[mk] || {}
        const staffNames = staff.filter(s => Object.values(monthShifts[s.id]||{}).some(Boolean)).map(s => s.name)
        if (get().settings?.notify?.shiftConfirm !== false) notifyShiftConfirmed(year, month+1, staffNames)
      },
      unconfirmShift: (year, month) => {
        const mk = `${year}-${String(month+1).padStart(2,'0')}`
        const confirmedShifts = { ...get().confirmedShifts }
        delete confirmedShifts[mk]
        set({ confirmedShifts })
        syncCloud('confirmedShifts', confirmedShifts)
      },
      isShiftConfirmed: (year, month) => {
        const mk = `${year}-${String(month+1).padStart(2,'0')}`
        return !!get().confirmedShifts[mk]
      },

      // お知らせ
      addAnnouncement: (title, body) => {
        const id = Date.now().toString()
        const announcement = { id, title, body, createdAt: new Date().toISOString() }
        const announcements = [announcement, ...get().announcements]
        set({ announcements })
        syncCloud('announcements', announcements)
        if (get().settings?.notify?.announcement !== false) notifyAnnouncement(announcement)
      },
      deleteAnnouncement: (id) => {
        const announcements = get().announcements.filter(a => a.id !== id)
        set({ announcements })
        syncCloud('announcements', announcements)
      },

      // お客さん予約キャンセル（キャンセルトークンで本人確認）
      cancelBookingByToken: (bookingId, name) => {
        const booking = get().bookings.find(b => b.id === bookingId)
        if (!booking || booking.name !== name) return false
        const bookings = get().bookings.filter(b => b.id !== bookingId)
        set({ bookings })
        syncCloud('bookings', bookings)
        if (get().settings?.notify?.cancel !== false) notifyBookingCancelled(booking)
        return true
      },

      addWorkReport: (report) => {
        const id = Date.now().toString()
        const newReport = {...report, id, createdAt: new Date().toISOString()}
        const workReports = [...get().workReports, newReport]
        set({ workReports })
        syncCloud('workReports', workReports)
      },
      deleteWorkReport: (id) => {
        const workReports = get().workReports.filter(r => r.id !== id)
        set({ workReports })
        syncCloud('workReports', workReports)
      },

      getBookingsForSlot: (dateKey, slotIdx) =>
        get().bookings.filter(b => b.dateKey===dateKey && b.slotIdx===slotIdx).length,

      // ---- シフト（月別・クラウド同期付き） ----
      setShiftMonth: (year, month) => set({ shiftMonth: { year, month } }),

      toggleShift: (staffId, dayIndex) => {
        const { shifts, shiftMonth } = get()
        const mk = monthKey(shiftMonth.year, shiftMonth.month)
        const ms = JSON.parse(JSON.stringify(shifts[mk]||{}))
        if (!ms[staffId]) ms[staffId] = {}
        ms[staffId][dayIndex] = !ms[staffId][dayIndex]
        const newShifts = { ...shifts, [mk]: ms }
        set({ shifts: newShifts })
        syncCloud('shifts', newShifts)
      },

      autoAssign: (year, month) => {
        const { staff, wishes, shifts } = get()
        const mk = monthKey(year, month)
        const daysInMonth = new Date(year, month+1, 0).getDate()
        const ms = JSON.parse(JSON.stringify(shifts[mk]||{}))
        const mw = (wishes[mk]||{})
        staff.forEach(s => {
          if (!ms[s.id]) ms[s.id] = {}
          const w = mw[s.id] || {}
          for (let d = 0; d < daysInMonth; d++) {
            if (w[d]==='ok') ms[s.id][d] = true
            else if (w[d]==='ng') ms[s.id][d] = false
            else if (ms[s.id][d]===undefined) ms[s.id][d] = Math.random() > 0.55
          }
        })
        const newShifts = { ...shifts, [mk]: ms }
        set({ shifts: newShifts, shiftMonth: { year, month } })
        syncCloud('shifts', newShifts)
      },

      // ---- 給与 ----
      calcWage: (staffId, year, month) => {
        const { shifts, settings, workReports } = get()
        const cutoff = settings.cutoffDay || 20
        // 対象期間：前月(cutoff+1)日 〜 当月cutoff日
        const prevYear = month === 0 ? year - 1 : year
        const prevMonth = month === 0 ? 11 : month - 1
        const prevMk = monthKey(prevYear, prevMonth)
        const curMk = monthKey(year, month)
        const prevRow = (shifts[prevMk]||{})[staffId] || {}
        const curRow = (shifts[curMk]||{})[staffId] || {}

        // 前月の(cutoff+1)日〜末日（0-indexed: cutoff〜末日-1）
        const prevShiftDays = Object.keys(prevRow)
          .filter(d => parseInt(d) >= cutoff && prevRow[d]).length

        // 当月の1日〜cutoff日（0-indexed: 0〜cutoff-1）
        const curShiftDays = Object.keys(curRow)
          .filter(d => parseInt(d) < cutoff && curRow[d]).length

        const shiftDays = prevShiftDays + curShiftDays

        // workReportsも締め日で絞り込む
        // 前月のcutoff+1日以降 + 当月のcutoff日以前
        const prevMonthStr = `${prevYear}-${String(prevMonth+1).padStart(2,'0')}`
        const curMonthStr = `${year}-${String(month+1).padStart(2,'0')}`
        const periodReports = workReports.filter(r => {
          if (!r.staffId === staffId) return false
          if (r.staffId !== staffId) return false
          const dk = r.date || ''
          if (dk.startsWith(prevMonthStr)) {
            const day = parseInt(dk.split('-')[2] || '0')
            return day > cutoff
          }
          if (dk.startsWith(curMonthStr)) {
            const day = parseInt(dk.split('-')[2] || '0')
            return day <= cutoff
          }
          return false
        })

        const s = get().staff.find(x => x.id===staffId)
        const hourlyWage = s?.hourlyWage || 1000

        // 実績報告があれば報告ベース（0時間も有効）、なければシフットベース
        if (periodReports.length > 0) {
          const totalHours = periodReports.reduce((sum, r) => sum + (typeof r.hours === 'number' ? r.hours : parseFloat(r.hours) || 0), 0)
          return {
            shiftDays: periodReports.length,
            hours: totalHours,
            wage: Math.round(hourlyWage * totalHours),
            prevShiftDays,
            curShiftDays,
            cutoff,
            isActual: true,
          }
        }

        const shiftHours = settings.shiftHours ?? 6
        return {
          shiftDays,
          hours: shiftDays * shiftHours,
          wage: hourlyWage * shiftHours * shiftDays,
          prevShiftDays,
          curShiftDays,
          cutoff,
          isActual: false,
        }
      },

      updateSettings: (data) => {
        const settings = { ...get().settings, ...data }
        set({ settings })
        syncCloud('settings', settings)
      },
    }),
    { name: 'shift-app-storage-v4' }
  )
)
