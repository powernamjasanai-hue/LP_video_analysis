import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 영상 총 길이 300초 (5분)
const VIDEO_DURATION = 300
const VIDEO_ID = 'dQw4w9WgXcQ'

const PAGE_URLS = [
  'https://landing.example.com/offer-a',
  'https://landing.example.com/offer-b',
  'https://landing.example.com/promo-spring',
]

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 이탈 패턴: 초반에 많이 이탈, 중간 안정, 후반 소폭 이탈
function generateDropOff() {
  const r = Math.random()
  if (r < 0.15) return randomInt(0, 10)       // 15% 초반 10초 이탈
  if (r < 0.25) return randomInt(11, 30)       // 10% 11~30초
  if (r < 0.35) return randomInt(31, 60)       // 10% 31~60초
  if (r < 0.50) return randomInt(61, 120)      // 15% 1~2분
  if (r < 0.70) return randomInt(121, 200)     // 20% 2~3.3분
  if (r < 0.85) return randomInt(201, 280)     // 15% 3.3~4.7분
  return randomInt(281, 300)                    // 15% 거의 끝까지
}

const rows = []
const now = Date.now()

for (let i = 0; i < 150; i++) {
  const viewerId = uuid()
  const dropOff = generateDropOff()
  const completed = dropOff >= VIDEO_DURATION
  const totalWatch = completed
    ? VIDEO_DURATION
    : randomInt(Math.max(1, dropOff - 10), dropOff)
  const maxReached = completed
    ? VIDEO_DURATION
    : randomInt(dropOff, Math.min(dropOff + 15, VIDEO_DURATION))

  // 최근 30일 내 랜덤 시간
  const daysAgo = randomInt(0, 29)
  const createdAt = new Date(now - daysAgo * 86400000 - randomInt(0, 86400000)).toISOString()

  rows.push({
    viewer_id: viewerId,
    video_id: VIDEO_ID,
    page_url: PAGE_URLS[randomInt(0, PAGE_URLS.length - 1)],
    duration_seconds: VIDEO_DURATION,
    total_watch_time: totalWatch,
    max_second_reached: maxReached,
    drop_off_second: dropOff,
    created_at: createdAt,
  })
}

// 두 번째 영상 데이터 (소량)
const VIDEO_ID_2 = 'jNQXAC9IVRw'
for (let i = 0; i < 30; i++) {
  const viewerId = uuid()
  const dropOff = generateDropOff()
  const totalWatch = randomInt(Math.max(1, dropOff - 10), dropOff)

  rows.push({
    viewer_id: viewerId,
    video_id: VIDEO_ID_2,
    page_url: 'https://landing.example.com/offer-a',
    duration_seconds: 180,
    total_watch_time: Math.min(totalWatch, 180),
    max_second_reached: Math.min(dropOff + 5, 180),
    drop_off_second: Math.min(dropOff, 180),
    created_at: new Date(now - randomInt(0, 14) * 86400000).toISOString(),
  })
}

console.log(`Inserting ${rows.length} rows...`)

const { error } = await supabase.from('view_sessions').insert(rows)

if (error) {
  console.error('Insert error:', error.message)
} else {
  console.log('Done! Inserted', rows.length, 'sessions.')
}
