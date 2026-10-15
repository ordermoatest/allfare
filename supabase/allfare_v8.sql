-- =====================================================================
-- 올페어 v8 업데이트 SQL (v3 SQL까지 실행한 DB에 이어서 실행)
-- Supabase > SQL Editor 에 전체 붙여넣고 Run 하세요. 여러 번 실행해도 안전합니다.
-- =====================================================================

-- ---------- 1. 후기: 결제한(또는 안 된) 품목 ----------
alter table public.store_reviews add column if not exists items text[] not null default '{}';

-- ---------- 2. 내 주변 가맹점: 결제 안 된 품목도 함께 ----------
drop function if exists public.nearby_stores(double precision, double precision, integer, integer);
create or replace function public.nearby_stores(p_lat double precision, p_lng double precision, p_radius integer, p_limit integer default 400)
returns table(id text, name text, category text, address text, lat double precision, lng double precision,
              phone text, place_url text, distance integer, review_count integer,
              paid_yes integer, paid_no integer, rating_avg numeric, no_items text[])
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
         coalesce(r.cnt, 0), coalesce(r.yes, 0), coalesce(r.no, 0), r.avg, coalesce(n.items, '{}')
  from c
  left join lateral (
    select count(*)::integer cnt,
           count(*) filter (where paid is true)::integer yes,
           count(*) filter (where paid is false)::integer no,
           round(avg(rating)::numeric, 1) avg
    from store_reviews x where x.store_id = c.id and not x.hidden
  ) r on true
  left join lateral (
    select array_agg(distinct i) items
    from store_reviews x, unnest(x.items) i
    where x.store_id = c.id and not x.hidden and x.paid is false
  ) n on true
  where c.dist <= p_radius
  order by c.dist
  limit p_limit;
$$;
revoke execute on function public.nearby_stores(double precision, double precision, integer, integer) from public, anon, authenticated;
