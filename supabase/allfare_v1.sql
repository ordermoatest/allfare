-- =====================================================================
-- 올페어(Allfare) v1 - Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 전체 붙여넣고 Run 하세요. (새 프로젝트 기준)
-- 모든 읽기/쓰기는 서버(API Route)에서 service_role 키로만 합니다.
-- 그래서 RLS는 켜고 정책은 만들지 않습니다(브라우저에서 직접 접근 불가).
-- =====================================================================

-- ---------- 1. 복지 혜택 (행안부 공공서비스(혜택) 정보 동기화) ----------
create table if not exists public.benefits (
  id              text primary key,            -- 서비스ID
  name            text not null,               -- 서비스명
  summary         text,                        -- 서비스목적요약
  category        text,                        -- 서비스분야
  support_type    text,                        -- 지원유형
  target          text,                        -- 지원대상
  criteria        text,                        -- 선정기준
  content         text,                        -- 지원내용
  how             text,                        -- 신청방법
  deadline_text   text,                        -- 신청기한(원문)
  deadline_kind   text,                        -- always | dated | no_application | unknown
  deadline_end    date,                        -- 신청기한에서 읽어낸 마감일
  url             text,                        -- 상세조회URL(정부24)
  org             text,                        -- 소관기관명
  dept            text,                        -- 부서명
  org_type        text,                        -- 소관기관유형
  user_type       text,                        -- 사용자구분
  receiver        text,                        -- 접수기관
  phone           text,                        -- 전화문의
  views           integer default 0,           -- 조회수(정부24)
  registered_at   timestamptz,                 -- 등록일시
  source_updated  timestamptz,                 -- 수정일시
  scope           text default 'unknown',      -- national | local | unknown
  sido            text,                        -- 지역 혜택일 때 시도(정식명칭)
  sgg             text,                        -- 지역 혜택일 때 시군구
  cond            jsonb,                       -- 지원조건 원본(JA 코드)
  cond_codes      text[] default '{}',         -- 켜진(Y) JA 코드만
  age_min         integer default 0,
  age_max         integer default 0,           -- 0 = 상한 없음
  person_ok       boolean default true,        -- 개인/가구가 받을 수 있는 혜택인지
  like_count      integer default 0,
  active          boolean default true,
  synced_at       timestamptz default now()
);
create index if not exists benefits_region_idx on public.benefits (active, person_ok, scope, sido, sgg);
create index if not exists benefits_synced_idx on public.benefits (synced_at);

-- 좋아요 (로그인 없이 기기 ID 1개당 1번)
create table if not exists public.benefit_likes (
  benefit_id  text not null references public.benefits(id) on delete cascade,
  device_id   text not null,
  created_at  timestamptz default now(),
  primary key (benefit_id, device_id)
);

create or replace function public.toggle_benefit_like(p_id text, p_device text)
returns table(liked boolean, cnt integer)
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from benefit_likes where benefit_id = p_id and device_id = p_device) then
    delete from benefit_likes where benefit_id = p_id and device_id = p_device;
    update benefits set like_count = greatest(like_count - 1, 0) where id = p_id;
    return query select false, (select like_count from benefits where id = p_id);
  else
    insert into benefit_likes(benefit_id, device_id) values (p_id, p_device);
    update benefits set like_count = like_count + 1 where id = p_id;
    return query select true, (select like_count from benefits where id = p_id);
  end if;
end $$;

-- ---------- 2. 문화누리카드 가맹점 ----------
create table if not exists public.culture_stores (
  id            text primary key,              -- 가맹점명+주소 해시
  region        text,                          -- 지역(원본)
  name          text not null,                 -- 가맹점명
  category      text,                          -- 분류(원본)
  address       text,                          -- 주소
  lat           double precision,
  lng           double precision,
  phone         text,                          -- 카카오 장소 검색으로 채움
  place_url     text,                          -- 카카오맵 장소 페이지
  geo_status    text default 'pending',        -- pending | ok | fail
  geo_tried_at  timestamptz,
  active        boolean default true,
  synced_at     timestamptz default now()
);
create index if not exists culture_stores_geo_idx on public.culture_stores (geo_status);
create index if not exists culture_stores_latlng_idx on public.culture_stores (lat, lng);

-- ---------- 3. 가맹점 이용 후기 ----------
create table if not exists public.store_reviews (
  id            bigserial primary key,
  store_id      text not null references public.culture_stores(id) on delete cascade,
  nick          text not null,
  body          text not null check (char_length(body) between 5 and 200),
  device_id     text not null,
  heart_count   integer default 0,
  report_count  integer default 0,
  hidden        boolean default false,
  created_at    timestamptz default now()
);
create index if not exists store_reviews_store_idx on public.store_reviews (store_id, hidden);
create index if not exists store_reviews_device_idx on public.store_reviews (device_id, created_at);

create table if not exists public.review_hearts (
  review_id  bigint not null references public.store_reviews(id) on delete cascade,
  device_id  text not null,
  created_at timestamptz default now(),
  primary key (review_id, device_id)
);

create table if not exists public.review_reports (
  review_id  bigint not null references public.store_reviews(id) on delete cascade,
  device_id  text not null,
  created_at timestamptz default now(),
  primary key (review_id, device_id)
);

create or replace function public.toggle_review_heart(p_review bigint, p_device text)
returns table(liked boolean, cnt integer)
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from review_hearts where review_id = p_review and device_id = p_device) then
    delete from review_hearts where review_id = p_review and device_id = p_device;
    update store_reviews set heart_count = greatest(heart_count - 1, 0) where id = p_review;
    return query select false, (select heart_count from store_reviews where id = p_review);
  else
    insert into review_hearts(review_id, device_id) values (p_review, p_device);
    update store_reviews set heart_count = heart_count + 1 where id = p_review;
    return query select true, (select heart_count from store_reviews where id = p_review);
  end if;
end $$;

-- 신고 3건이 쌓이면 자동으로 숨김
create or replace function public.report_review(p_review bigint, p_device text)
returns table(cnt integer, is_hidden boolean)
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into review_reports(review_id, device_id) values (p_review, p_device) on conflict do nothing;
  select count(*) into n from review_reports where review_id = p_review;
  update store_reviews set report_count = n, hidden = (hidden or n >= 3) where id = p_review;
  return query select n, (select hidden from store_reviews where id = p_review);
end $$;

-- 내 주변 가맹점 (거리순)
create or replace function public.nearby_stores(p_lat double precision, p_lng double precision, p_radius integer, p_limit integer default 400)
returns table(id text, name text, category text, address text, lat double precision, lng double precision,
              phone text, place_url text, distance integer, review_count integer)
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
         (select count(*)::integer from store_reviews r where r.store_id = c.id and not r.hidden)
  from c where c.dist <= p_radius
  order by c.dist
  limit p_limit;
$$;

-- ---------- 4. 동기화 기록 ----------
create table if not exists public.sync_log (
  id         bigserial primary key,
  kind       text not null,                    -- benefits | stores_import | stores_geocode
  started_at timestamptz default now(),
  ok         boolean,
  message    text,
  counts     jsonb
);

-- ---------- 5. 보안: RLS 켜고 정책 없음 (서버의 service_role만 접근) ----------
alter table public.benefits        enable row level security;
alter table public.benefit_likes   enable row level security;
alter table public.culture_stores  enable row level security;
alter table public.store_reviews   enable row level security;
alter table public.review_hearts   enable row level security;
alter table public.review_reports  enable row level security;
alter table public.sync_log        enable row level security;

revoke execute on function public.toggle_benefit_like(text, text) from public, anon, authenticated;
revoke execute on function public.nearby_stores(double precision, double precision, integer, integer) from public, anon, authenticated;
revoke execute on function public.toggle_review_heart(bigint, text) from public, anon, authenticated;
revoke execute on function public.report_review(bigint, text) from public, anon, authenticated;
