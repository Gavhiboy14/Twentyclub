-- ============================================================================
-- Twenty Club — esquema completo
--
-- Pegá este archivo entero en el SQL Editor de Supabase y ejecutalo una vez.
-- Después corré `npm run seed:supabase` para cargar el catálogo inicial.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table if not exists brands (
  id          text primary key,
  slug        text unique not null,
  name        text not null,
  wordmark    text not null default '',
  logo        text,
  banner      text,
  description text not null default '',
  "order"     int  not null default 0
);

create table if not exists categories (
  id          text primary key,
  slug        text unique not null,
  name        text not null,
  cover       text,
  description text not null default ''
);

create table if not exists products (
  id           text primary key,
  slug         text unique not null,
  name         text not null,
  brand_id     text not null references brands(id) on delete restrict,
  category_ids text[] not null default '{}',
  price        int  not null default 0,
  discount     int  not null default 0,
  description  text not null default '',
  features     text[] not null default '{}',
  color        text not null default '',
  color_hex    text not null default '#b4b0a0',
  materials    text[] not null default '{}',
  tags         text[] not null default '{}',
  sku          text not null default '',
  -- [{ id, url, alt }] — el orden del array es el orden en la galería
  images       jsonb not null default '[]'::jsonb,
  -- [{ size, stock, available }]
  sizes        jsonb not null default '[]'::jsonb,
  featured     boolean not null default false,
  views        int  not null default 0,
  sold         int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists products_brand_id_idx on products (brand_id);
create index if not exists products_created_at_idx on products (created_at desc);

create table if not exists banners (
  id        text primary key,
  placement text not null check (placement in ('hero', 'promo', 'secondary')),
  eyebrow   text not null default '',
  title     text not null,
  subtitle  text not null default '',
  image     text,
  cta_label text not null default 'Ver más',
  cta_href  text not null default '/productos',
  active    boolean not null default true,
  "order"   int not null default 0
);

create table if not exists offers (
  id          text primary key,
  title       text not null,
  description text not null default '',
  discount    int  not null default 0,
  product_ids text[] not null default '{}',
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  active      boolean not null default true
);

create table if not exists orders (
  id         text primary key,
  code       text unique not null,
  created_at timestamptz not null default now(),
  -- { name, phone, note }
  customer   jsonb not null default '{}'::jsonb,
  -- [{ productId, slug, name, brand, size, qty, unitPrice, image }]
  items      jsonb not null default '[]'::jsonb,
  total      int  not null default 0,
  status     text not null default 'pendiente'
             check (status in ('pendiente', 'contactado', 'finalizado', 'cancelado'))
);

create index if not exists orders_created_at_idx on orders (created_at desc);

-- Fila única: los ajustes de la tienda.
create table if not exists settings (
  id   int primary key default 1 check (id = 1),
  data jsonb not null
);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- El catálogo es público de lectura. Pedidos y ajustes no: se leen y escriben
-- únicamente desde el servidor con la service role key, que saltea RLS.
-- Por eso acá no se crea NINGUNA policy para orders ni settings: con RLS
-- activo y sin policies, la anon key no puede tocarlos.
-- ---------------------------------------------------------------------------

alter table brands     enable row level security;
alter table categories enable row level security;
alter table products   enable row level security;
alter table banners    enable row level security;
alter table offers     enable row level security;
alter table orders     enable row level security;
alter table settings   enable row level security;

drop policy if exists "lectura pública de marcas" on brands;
create policy "lectura pública de marcas"
  on brands for select using (true);

drop policy if exists "lectura pública de categorías" on categories;
create policy "lectura pública de categorías"
  on categories for select using (true);

drop policy if exists "lectura pública de productos" on products;
create policy "lectura pública de productos"
  on products for select using (true);

drop policy if exists "lectura pública de banners" on banners;
create policy "lectura pública de banners"
  on banners for select using (true);

drop policy if exists "lectura pública de ofertas" on offers;
create policy "lectura pública de ofertas"
  on offers for select using (true);

-- ---------------------------------------------------------------------------
-- Descuento de stock atómico
--
-- Cuando un pedido se marca como finalizado hay que restar stock de un array
-- JSON y sumar ventas. Hacerlo con read-modify-write desde el servidor abre
-- una carrera si dos pedidos se cierran a la vez, así que va en la base.
-- ---------------------------------------------------------------------------

create or replace function commit_order_stock(order_id text)
returns void
language plpgsql
security definer
as $$
declare
  line jsonb;
begin
  for line in
    select jsonb_array_elements(items) from orders where id = order_id
  loop
    update products
    set
      sizes = (
        select jsonb_agg(
          case
            when s->>'size' = line->>'size'
              then jsonb_set(
                s,
                '{stock}',
                to_jsonb(greatest(0, (s->>'stock')::int - (line->>'qty')::int))
              )
            else s
          end
        )
        from jsonb_array_elements(sizes) s
      ),
      sold = sold + (line->>'qty')::int,
      updated_at = now()
    where id = line->>'productId';
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: bucket público para las fotos de producto
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

drop policy if exists "lectura pública de fotos" on storage.objects;
create policy "lectura pública de fotos"
  on storage.objects for select
  using (bucket_id = 'productos');
