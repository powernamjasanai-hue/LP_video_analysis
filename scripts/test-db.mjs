import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('=== Supabase Connection Test ===')
console.log('URL:', url)
console.log('Key prefix:', key?.substring(0, 20) + '...')

const supabase = createClient(url, key)

// 1. Test: Check if view_sessions table exists by querying it
console.log('\n[1] Testing table access...')
const { data: selectData, error: selectError } = await supabase
  .from('view_sessions')
  .select('id')
  .limit(1)

if (selectError) {
  console.error('  SELECT error:', selectError.message)
  console.error('  Code:', selectError.code)
  console.error('  Details:', selectError.details)
  console.error('  Hint:', selectError.hint)
} else {
  console.log('  SELECT OK. Rows found:', selectData.length)
}

// 2. Test: INSERT a test row
console.log('\n[2] Testing INSERT...')
const testRow = {
  viewer_id: '00000000-0000-4000-8000-000000000000',
  video_id: 'dQw4w9WgXcQ',
  page_url: 'https://test.example.com',
  duration_seconds: 212,
  total_watch_time: 45,
  max_second_reached: 60,
  drop_off_second: 55,
}

const { data: insertData, error: insertError } = await supabase
  .from('view_sessions')
  .insert(testRow)
  .select()

if (insertError) {
  console.error('  INSERT error:', insertError.message)
  console.error('  Code:', insertError.code)
  console.error('  Details:', insertError.details)
  console.error('  Hint:', insertError.hint)
} else {
  console.log('  INSERT OK. Inserted row ID:', insertData[0]?.id)

  // 3. Cleanup: DELETE the test row
  console.log('\n[3] Cleaning up test row...')
  const { error: deleteError } = await supabase
    .from('view_sessions')
    .delete()
    .eq('id', insertData[0].id)

  if (deleteError) {
    console.error('  DELETE error:', deleteError.message)
  } else {
    console.log('  DELETE OK. Test row removed.')
  }
}

console.log('\n=== Test Complete ===')
