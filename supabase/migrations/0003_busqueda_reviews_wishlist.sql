-- Ground Control 90 — búsqueda full-text, reseñas de producto y favoritos.

-- ============================================================
-- BÚSQUEDA
-- ============================================================

alter table products
  add column search_vector tsvector generated always as (
    setweight(to_tsvector('spanish', coalesce(nombre, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(club, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(liga, '')), 'C') ||
    setweight(to_tsvector('spanish', coalesce(descripcion, '')), 'D')
  ) stored;

create index idx_products_search_vector on products using gin(search_vector);

-- ============================================================
-- TABLAS
-- ============================================================

-- Una reseña por cliente y producto; "aprobado" default true (auto-publicada),
-- el admin puede ocultarla (aprobado = false) o borrarla vía is_admin().
-- nombre_autor es un snapshot (ver trigger set_review_nombre_autor): profiles
-- no tiene policy de lectura pública (guarda teléfono/apellido), así que un
-- join a profiles.nombre en la vista pública del catálogo devolvería null.
create table product_reviews (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  calificacion  int not null check (calificacion between 1 and 5),
  comentario    text,
  nombre_autor  text not null default 'Cliente',
  aprobado      boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (product_id, user_id)
);

create table wishlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

create index idx_product_reviews_product_id on product_reviews(product_id);
create index idx_wishlists_user_id on wishlists(user_id);

create trigger set_updated_at_product_reviews before update on product_reviews
  for each row execute function set_updated_at();

-- Snapshotea profiles.nombre en nombre_autor al crear la reseña: RLS no
-- permite leer el perfil de otro cliente, así que el catálogo público no
-- podría resolver el nombre del autor vía join en el momento de la lectura.
-- No SECURITY DEFINER: corre con los permisos de quien inserta, y ese mismo
-- cliente ya puede leer su propio profiles row (profiles_select_own).
create function set_review_nombre_autor()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  select coalesce(nombre, 'Cliente') into new.nombre_autor
  from profiles where id = new.user_id;
  return new;
end;
$$;

create trigger set_review_nombre_autor before insert on product_reviews
  for each row execute function set_review_nombre_autor();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table product_reviews enable row level security;
alter table wishlists enable row level security;

-- product_reviews: cualquiera lee las aprobadas, cada cliente escribe/edita/
-- borra solo la suya, el admin puede todo (incluido ocultar con aprobado=false).
create policy "product_reviews_select_public" on product_reviews for select
  using (aprobado = true or user_id = auth.uid() or is_admin());
create policy "product_reviews_insert_own" on product_reviews for insert
  with check (user_id = auth.uid());
create policy "product_reviews_update_own" on product_reviews for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "product_reviews_delete_own" on product_reviews for delete
  using (user_id = auth.uid());
create policy "product_reviews_all_admin" on product_reviews for all
  using (is_admin())
  with check (is_admin());

-- wishlists: enteramente privado por cliente, el admin solo lee.
create policy "wishlists_all_own" on wishlists for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "wishlists_select_admin" on wishlists for select
  using (is_admin());

-- ============================================================
-- GRANTS
-- ============================================================
-- Mismo patrón que el resto de las tablas: privilegios de tabla amplios a
-- anon/authenticated (RLS arriba filtra fila a fila).

grant select, insert, update, delete on product_reviews to anon, authenticated;
grant select, insert, update, delete on wishlists to anon, authenticated;
