-- 올페어 v13: 복지 소식 조회수·좋아요·공유 수
-- Supabase > SQL Editor 에 통째로 붙여넣고 Run 하세요. 여러 번 실행해도 괜찮아요.

-- 1) 글별 합계
create table if not exists public.news_stats (
  slug       text primary key,
  views      integer not null default 0,
  likes      integer not null default 0,
  shares     integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 2) 날짜별 조회수 (최근 30일 인기 순위용)
create table if not exists public.news_views_daily (
  slug  text not null,
  day   date not null,
  n     integer not null default 0,
  primary key (slug, day)
);

-- 3) 좋아요 (기기당 1번)
create table if not exists public.news_likes (
  slug       text not null,
  device_id  text not null,
  created_at timestamptz not null default now(),
  primary key (slug, device_id)
);

alter table public.news_stats       enable row level security;
alter table public.news_views_daily enable row level security;
alter table public.news_likes       enable row level security;

-- 조회 1회 기록
create or replace function public.news_view(p_slug text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into news_stats(slug, views) values (p_slug, 1)
    on conflict (slug) do update set views = news_stats.views + 1, updated_at = now();
  insert into news_views_daily(slug, day, n) values (p_slug, (now() at time zone 'Asia/Seoul')::date, 1)
    on conflict (slug, day) do update set n = news_views_daily.n + 1;
end $$;

-- 공유 1회 기록
create or replace function public.news_share(p_slug text)
returns integer language plpgsql security definer set search_path = public as $$
declare c integer;
begin
  insert into news_stats(slug, shares) values (p_slug, 1)
    on conflict (slug) do update set shares = news_stats.shares + 1, updated_at = now()
    returning shares into c;
  return c;
end $$;

-- 좋아요 켜기/끄기
create or replace function public.news_like_toggle(p_slug text, p_device text)
returns table(liked boolean, cnt integer) language plpgsql security definer set search_path = public as $$
begin
  insert into news_stats(slug) values (p_slug) on conflict (slug) do nothing;
  if exists (select 1 from news_likes where slug = p_slug and device_id = p_device) then
    delete from news_likes where slug = p_slug and device_id = p_device;
    update news_stats set likes = greatest(likes - 1, 0), updated_at = now() where slug = p_slug;
    return query select false, (select likes from news_stats where slug = p_slug);
  else
    insert into news_likes(slug, device_id) values (p_slug, p_device);
    update news_stats set likes = likes + 1, updated_at = now() where slug = p_slug;
    return query select true, (select likes from news_stats where slug = p_slug);
  end if;
end $$;

-- 최근 N일 조회수 순위
create or replace function public.news_popular(p_days integer default 30)
returns table(slug text, views bigint) language sql security definer set search_path = public as $$
  select slug, sum(n)::bigint as views
  from news_views_daily
  where day >= ((now() at time zone 'Asia/Seoul')::date - p_days)
  group by slug
  order by views desc;
$$;

revoke execute on function public.news_view(text) from public, anon, authenticated;
revoke execute on function public.news_share(text) from public, anon, authenticated;
revoke execute on function public.news_like_toggle(text, text) from public, anon, authenticated;
revoke execute on function public.news_popular(integer) from public, anon, authenticated;
