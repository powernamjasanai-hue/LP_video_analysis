-- 랜딩페이지 테이블
create table landing_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null default '새 랜딩페이지',
  slug text unique not null,
  folder text not null default '기본',
  sections jsonb not null default '[]',
  published boolean not null default false,
  bg_color text not null default '#ffffff',
  max_width int not null default 640,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table landing_pages enable row level security;
create index idx_landing_pages_slug on landing_pages(slug);
create index idx_landing_pages_folder on landing_pages(folder);

-- sections JSONB 구조 예시:
-- [
--   {
--     "id": "uuid",
--     "type": "video",       -- video | text | button | spacer
--     "content": {
--       "videoId": "dQw4w9WgXcQ",
--       "aspectRatio": "16:9"
--     }
--   },
--   {
--     "id": "uuid",
--     "type": "text",
--     "content": {
--       "text": "헤드라인 텍스트",
--       "fontSize": 28,
--       "fontWeight": "bold",
--       "align": "center",
--       "color": "#000000"
--     }
--   },
--   {
--     "id": "uuid",
--     "type": "button",
--     "content": {
--       "text": "지금 시작하기",
--       "url": "https://example.com",
--       "bgColor": "#000000",
--       "textColor": "#ffffff",
--       "fontSize": 16,
--       "borderRadius": 8,
--       "fullWidth": false
--     }
--   },
--   {
--     "id": "uuid",
--     "type": "spacer",
--     "content": {
--       "height": 40
--     }
--   }
-- ]
