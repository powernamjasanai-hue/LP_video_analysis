import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 1. 시드 데이터 삭제
console.log('[1] Deleting seed data...')
await supabase.from('videos').delete().neq('id', '00000000-0000-0000-0000-000000000000')
await supabase.from('view_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
console.log('  Done.')

// 2. projects 테이블 확인
console.log('\n[2] Testing projects table...')
const { data, error } = await supabase.from('projects').select('*').limit(1)
if (error) {
  console.log('  Table does not exist yet. Please run the SQL.')
} else {
  console.log('  Table exists. Rows:', data.length)
}

console.log('\n=== Done ===')
