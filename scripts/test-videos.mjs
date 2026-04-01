import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('=== Videos Table Test ===')

// 1. INSERT
console.log('\n[1] Registering test video...')
const { data: inserted, error: insertErr } = await supabase
  .from('videos')
  .insert({
    video_id: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up',
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    channel_name: 'Rick Astley',
  })
  .select()
  .single()

if (insertErr) {
  console.error('  INSERT error:', insertErr.message)
} else {
  console.log('  INSERT OK:', inserted.title)
}

// 2. SELECT
console.log('\n[2] Listing videos...')
const { data: videos, error: selectErr } = await supabase
  .from('videos')
  .select('*')

if (selectErr) {
  console.error('  SELECT error:', selectErr.message)
} else {
  console.log('  Found', videos.length, 'video(s)')
  videos.forEach(v => console.log('   -', v.title, `(${v.video_id})`))
}

// 3. Also register second seed video
const { error: insert2Err } = await supabase
  .from('videos')
  .insert({
    video_id: 'jNQXAC9IVRw',
    title: 'Me at the zoo',
    thumbnail_url: 'https://img.youtube.com/vi/jNQXAC9IVRw/mqdefault.jpg',
    channel_name: 'jawed',
  })

if (insert2Err && insert2Err.code !== '23505') {
  console.error('  INSERT 2 error:', insert2Err.message)
} else {
  console.log('\n[3] Second video registered OK')
}

console.log('\n=== Test Complete ===')
