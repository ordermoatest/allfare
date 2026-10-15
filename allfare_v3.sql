-- =====================================================================
-- 올페어 v3 업데이트 SQL (v1 SQL을 이미 실행한 DB에 이어서 실행)
-- Supabase > SQL Editor 에 전체 붙여넣고 Run 하세요. 여러 번 실행해도 안전합니다.
-- =====================================================================

-- ---------- 1. 혜택: 설명 문구에서 읽어낸 조건(자녀 나이·세대주·임신 등) ----------
alter table public.benefits add column if not exists hint jsonb;

-- ---------- 2. 후기: 결제 확인·별점·수정 기록·관리자 확인 ----------
alter table public.store_reviews add column if not exists paid boolean;            -- true 결제 됐어요 / false 안 됐어요
alter table public.store_reviews add column if not exists rating smallint;         -- 1~5 (선택)
alter table public.store_reviews add column if not exists edited boolean default false;
alter table public.store_reviews add column if not exists updated_at timestamptz default now();
alter table public.store_reviews add column if not exists cleared_at timestamptz;  -- 관리자 '문제없음' 처리 시각

do $$ begin
  alter table public.store_reviews add constraint store_reviews_rating_chk check (rating is null or rating between 1 and 5);
exception when duplicate_object then null; end $$;

update public.store_reviews set updated_at = created_at where updated_at is null or updated_at < created_at;

-- 같은 기기·같은 가게 중복 후기 정리 (가장 최근 1개만 남김)
delete from public.store_reviews r
using public.store_reviews n
where r.store_id = n.store_id and r.device_id = n.device_id
  and (r.created_at < n.created_at or (r.created_at = n.created_at and r.id < n.id));

-- 이제부터 가게당 한 기기 1개 후기
create unique index if not exists store_reviews_one_per_device on public.store_reviews (store_id, device_id);
create index if not exists store_reviews_reported_idx on public.store_reviews (report_count, hidden);
create index if not exists store_reviews_created_idx on public.store_reviews (created_at desc);

-- ---------- 3. 내 주변 가맹점: 후기 요약(결제 확인 수·평균 별점) 함께 ----------
drop function if exists public.nearby_stores(double precision, double precision, integer, integer);
create or replace function public.nearby_stores(p_lat double precision, p_lng double precision, p_radius integer, p_limit integer default 400)
returns table(id text, name text, category text, address text, lat double precision, lng double precision,
              phone text, place_url text, distance integer, review_count integer,
              paid_yes integer, paid_no integer, rating_avg numeric)
language sql stable security definer set search_path = public as $$
  with box as (
    select p_radius / 111320.0 as dlat,
           p_radius / (111320.0 * cos(radians(p_lat))) as dlng
  ), c as (
    select s.*,
      (6371000 * 2 * asin(sqrt(
         power(sin(radians(s.lat - p_lat) / 2), 2) +
         cos(radians(p_lat)) * cos(radians(s.lat)) * power(sin(radians(s.lng - p_lng) / 2), 2)
      )))::integer as dist
    from culture_stores s, box
    where s.active and s.geo_status = 'ok'
      and s.lat between p_lat - box.dlat and p_lat + box.dlat
      and s.lng between p_lng - box.dlng and p_lng + box.dlng
  )
  select c.id, c.name, c.category, c.address, c.lat, c.lng, c.phone, c.place_url, c.dist,
         coalesce(r.cnt, 0), coalesce(r.yes, 0), coalesce(r.no, 0), r.avg
  from c
  left join lateral (
    select count(*)::integer cnt,
           count(*) filter (where paid is true)::integer yes,
           count(*) filter (where paid is false)::integer no,
           round(avg(rating)::numeric, 1) avg
    from store_reviews x where x.store_id = c.id and not x.hidden
  ) r on true
  where c.dist <= p_radius
  order by c.dist
  limit p_limit;
$$;
revoke execute on function public.nearby_stores(double precision, double precision, integer, integer) from public, anon, authenticated;

-- ---------- 4. 관리자 '문제없음': 신고 기록을 지우고 다시 보이게 ----------
create or replace function public.clear_review_reports(p_review bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from review_reports where review_id = p_review;
  update store_reviews set report_count = 0, hidden = false, cleared_at = now() where id = p_review;
end $$;
revoke execute on function public.clear_review_reports(bigint) from public, anon, authenticated;
