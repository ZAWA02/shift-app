const WEBHOOK_URL = 'https://discord.com/api/webhooks/1509130848589451272/O2LmhzW_fDUXjkKx7f17hlBfq1Z1cLP1iJXhnvRod9QM8vNyRvXXPO03EHQ_OL6mODiP'

async function sendDiscord(content, embeds = []) {
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content || '@everyone', embeds }),
    })
  } catch (e) {
    console.warn('Discord通知失敗:', e)
  }
}

// 予約が入ったとき
export async function notifyBooking(booking) {
  await sendDiscord('', [{
    title: '🗓️ 新しい予約が入りました！',
    color: 0x7B5E3A,
    fields: [
      { name: 'お名前', value: `${booking.name} 様`, inline: true },
      { name: '日時', value: `${booking.date} ${booking.slot}`, inline: true },
      { name: '電話番号', value: booking.tel || 'なし', inline: true },
      ...(booking.note ? [{ name: 'メモ', value: booking.note }] : []),
    ],
    timestamp: new Date().toISOString(),
  }])
}

// シフトが確定したとき
export async function notifyShiftConfirmed(year, month, staffNames) {
  await sendDiscord('', [{
    title: `✅ ${year}年${month}月のシフトが確定しました！`,
    color: 0x4A7C59,
    description: `出勤スタッフ：${staffNames.join('、')}`,
    footer: { text: 'シフト管理アプリ' },
    timestamp: new Date().toISOString(),
  }])
}

// 予約がキャンセルされたとき
export async function notifyBookingCancelled(booking) {
  await sendDiscord('', [{
    title: '🗑️ 予約がキャンセルされました',
    color: 0xC0392B,
    fields: [
      { name: 'お名前', value: `${booking.name} 様`, inline: true },
      { name: '日時', value: `${booking.date} ${booking.slot}`, inline: true },
    ],
    timestamp: new Date().toISOString(),
  }])
}

// お知らせを送ったとき
export async function notifyAnnouncement(announcement) {
  await sendDiscord('@everyone', [{
    title: '📣 新しいお知らせがあります',
    color: 0x7B5E3A,
    fields: [
      { name: 'タイトル', value: announcement.title },
      ...(announcement.body ? [{ name: '内容', value: announcement.body }] : []),
    ],
    timestamp: new Date().toISOString(),
  }])
}
