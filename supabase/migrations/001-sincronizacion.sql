-- ============================================================================
-- Twenty Club — módulo de sincronización de catálogo
--
-- Pegá este archivo entero en el SQL Editor de Supabase y ejecutalo UNA VEZ,
-- ANTES de desplegar el código que usa el módulo. Es idempotente: si lo
-- corrés dos veces no pasa nada.
--
-- No borra ni reescribe datos. Todo lo que agrega tiene valor por defecto, y
-- los productos que ya existen quedan en `pricing_mode = 'manual'`, que es la
-- forma de decir "a este precio no lo toca ninguna importación".
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Campos de sincronización en productos
-- ---------------------------------------------------------------------------

alter table products
  add column if not exists status        text not null default 'publicado',
  add column if not exists pricing_mode  text not null default 'manual',
  add column if not exists supplier_price int  not null default 0,
  add column if not exists supplier_ref  text not null default '',
  add column if not exists margin_percent int  not null default 0,
  add column if not exists margin_fixed  int  not null default 0,
  add column if not exists last_sync_at  timestamptz;

alter table products drop constraint if exists products_status_check;
alter table products add constraint products_status_check
  check (status in ('publicado', 'borrador', 'no-disponible'));

alter table products drop constraint if exists products_pricing_mode_check;
alter table products add constraint products_pricing_mode_check
  check (pricing_mode in ('margen', 'fijo', 'manual'));

-- El cruce con el PDF pasa por acá en cada importación.
create index if not exists products_supplier_ref_idx
  on products (supplier_ref) where supplier_ref <> '';

create index if not exists products_status_idx on products (status);

-- ---------------------------------------------------------------------------
-- 2. Reglas de clasificación
--
-- El PDF no trae columna de marca: viene metida en el modelo. Estas reglas
-- son las que la deducen, y de paso asignan categorías y etiquetas.
-- ---------------------------------------------------------------------------

create table if not exists sync_rules (
  id           text primary key,
  field        text not null default 'modelo'
               check (field in ('marca', 'modelo')),
  operator     text not null default 'contiene'
               check (operator in ('es', 'contiene')),
  value        text not null,
  brand_id     text references brands(id) on delete cascade,
  category_ids text[] not null default '{}',
  tags         text[] not null default '{}',
  active       boolean not null default true,
  "order"      int not null default 0
);

create index if not exists sync_rules_order_idx on sync_rules ("order");

-- ---------------------------------------------------------------------------
-- 3. Historial de importaciones
--
-- `items` guarda el plan entero: qué se escribió y qué había antes. Es lo que
-- permite volver atrás una importación sin lógica aparte — revertir es
-- escribir el `previous` de cada línea.
--
-- Va en su propia tabla y NO se carga en el snapshot del sitio: son cientos
-- de líneas por corrida y la tienda no las necesita nunca.
-- ---------------------------------------------------------------------------

create table if not exists imports (
  id          text primary key,
  created_at  timestamptz not null default now(),
  applied_at  timestamptz,
  file_name   text not null default '',
  pages       int  not null default 0,
  "user"      text not null default '',
  status      text not null default 'analizado'
              check (status in ('analizado', 'aplicado', 'revertido')),
  summary     jsonb not null default '{}'::jsonb,
  items       jsonb not null default '[]'::jsonb
);

create index if not exists imports_created_at_idx on imports (created_at desc);

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
--
-- Las reglas y el historial son datos de administración: no se leen desde el
-- navegador de un cliente. Con RLS activo y sin ninguna policy, la anon key
-- no puede tocarlos; el servidor entra con la service role key, que saltea
-- RLS. Es el mismo criterio que ya usan `orders` y `settings`.
-- ---------------------------------------------------------------------------

alter table sync_rules enable row level security;
alter table imports    enable row level security;

-- ---------------------------------------------------------------------------
-- 5. Comprobación
-- ---------------------------------------------------------------------------

do $$
declare
  faltan text;
begin
  select string_agg(c, ', ') into faltan
  from unnest(array[
    'status', 'pricing_mode', 'supplier_price',
    'supplier_ref', 'margin_percent', 'margin_fixed', 'last_sync_at'
  ]) c
  where not exists (
    select 1 from information_schema.columns
    where table_name = 'products' and column_name = c
  );

  if faltan is not null then
    raise exception 'Faltan columnas en products: %', faltan;
  end if;

  raise notice 'Migración aplicada. products +7 columnas, sync_rules e imports creadas.';
end $$;
