create table videos (
  id uuid primary key default gen_random_uuid(),
  video_id text not null unique,
  title text not null,
  thumbnail_url text,
  channel_name text,
  created_at timestamptz default now()
);

alter table videos enable row level security;
create index idx_videos_video_id on videos(video_id);
