-- ─────────────────────────────────────────────────────────────
-- Noor — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────

-- ── VERSES ──────────────────────────────────────────────────
create table if not exists verses (
  id              text primary key,
  key             text not null,
  surah           int  not null,
  surah_name      text not null,
  surah_arabic    text,
  ayah            int  not null,
  juz             int,
  page            int,
  arabic          text not null,
  topics          text[],
  popularity      int  default 0,
  display_safe    bool default true,
  created_at      timestamptz default now()
);
create index if not exists verses_surah_idx      on verses(surah);
create index if not exists verses_popularity_idx on verses(popularity desc);
create index if not exists verses_topics_idx     on verses using gin(topics);

create table if not exists verse_translations (
  id          text not null,
  language    text not null,
  text        text not null,
  verified    bool default false,
  primary key (id, language),
  foreign key (id) references verses(id) on delete cascade
);
create index if not exists vtrans_lang_idx on verse_translations(language);

-- ── HADITHS ─────────────────────────────────────────────────
create table if not exists hadiths (
  id              text primary key,
  collection      text not null,
  collection_name text,
  reference       text,
  arabic          text not null,
  grade           text,
  topics          text[],
  length          text,
  display_safe    bool default true,
  source_priority int  default 9,
  created_at      timestamptz default now()
);
create index if not exists hadiths_collection_idx on hadiths(collection);
create index if not exists hadiths_grade_idx      on hadiths(grade);
create index if not exists hadiths_topics_idx     on hadiths using gin(topics);

create table if not exists hadith_translations (
  id          text not null,
  language    text not null,
  text        text not null,
  verified    bool default false,
  primary key (id, language),
  foreign key (id) references hadiths(id) on delete cascade
);
create index if not exists htrans_lang_idx on hadith_translations(language);

-- ── DUAS ────────────────────────────────────────────────────
create table if not exists duas (
  id              text primary key,
  arabic          text not null,
  transliteration text,
  occasion        text,
  category        text,
  source          text,
  notes           text,
  benefits        text,
  popularity      int  default 0,
  display_safe    bool default true,
  created_at      timestamptz default now()
);
create index if not exists duas_category_idx on duas(category);

create table if not exists dua_translations (
  id          text not null,
  language    text not null,
  text        text not null,
  title       text,
  verified    bool default false,
  primary key (id, language),
  foreign key (id) references duas(id) on delete cascade
);

-- ── QUOTES ──────────────────────────────────────────────────
create table if not exists quotes (
  id           text primary key,
  source_type  text not null,
  source_id    text,
  author       text,
  text         text not null,
  topics       text[],
  popularity   int  default 0,
  created_at   timestamptz default now()
);
create index if not exists quotes_sourcetype_idx on quotes(source_type);
create index if not exists quotes_topics_idx     on quotes using gin(topics);

create table if not exists quote_translations (
  id          text not null,
  language    text not null,
  text        text not null,
  verified    bool default false,
  primary key (id, language),
  foreign key (id) references quotes(id) on delete cascade
);

-- ── REFLECTIONS (General feed özlü/manevi sözler) ───────────
-- İZOLE: sadece General feed'ini besler, başka konuya/tabloya sızmaz.
-- Her satır TEK dile ait (çeviri linki yok) → her dilin kendi native seti.
create table if not exists reflections (
  id          text primary key,
  language    text not null,
  text        text not null,
  topics      text[] default array['Reflections'],
  created_at  timestamptz default now()
);
create index if not exists reflections_lang_idx on reflections(language);

-- ── THEMES ──────────────────────────────────────────────────
create table if not exists themes (
  id           int  primary key,
  name         text not null,
  image_url    text not null,
  gradient     text[] not null,
  badge        text,
  is_free      bool default false,
  is_active    bool default true,
  sort_order   int  default 0,
  created_at   timestamptz default now()
);

-- ── ASMAUL HUSNA (99 Names of Allah) ───────────────────────
create table if not exists asmaul_husna (
  id              text primary key,
  number          int  not null,
  arabic          text not null,
  transliteration text not null,
  topics          text[] default array['99 Names of Allah'],
  popularity      int  default 100,
  created_at      timestamptz default now()
);
create index if not exists asma_number_idx on asmaul_husna(number);

create table if not exists asmaul_husna_translations (
  id          text not null,
  language    text not null,
  meaning     text not null,
  description text,
  primary key (id, language),
  foreign key (id) references asmaul_husna(id) on delete cascade
);
create index if not exists asmatrans_lang_idx on asmaul_husna_translations(language);

-- ── RLS (Row Level Security) — public read, no write ────────
alter table verses              enable row level security;
alter table verse_translations  enable row level security;
alter table hadiths             enable row level security;
alter table hadith_translations enable row level security;
alter table duas                enable row level security;
alter table dua_translations    enable row level security;
alter table quotes              enable row level security;
alter table quote_translations  enable row level security;
alter table themes              enable row level security;

alter table asmaul_husna              enable row level security;
alter table asmaul_husna_translations enable row level security;
alter table reflections               enable row level security;

-- Herkes okuyabilir (anon dahil)
create policy "public read" on verses                     for select using (true);
create policy "public read" on verse_translations         for select using (true);
create policy "public read" on hadiths                    for select using (true);
create policy "public read" on hadith_translations        for select using (true);
create policy "public read" on duas                       for select using (true);
create policy "public read" on dua_translations           for select using (true);
create policy "public read" on quotes                     for select using (true);
create policy "public read" on quote_translations         for select using (true);
create policy "public read" on themes                     for select using (true);
create policy "public read" on asmaul_husna               for select using (true);
create policy "public read" on asmaul_husna_translations  for select using (true);
create policy "public read" on reflections                for select using (true);
