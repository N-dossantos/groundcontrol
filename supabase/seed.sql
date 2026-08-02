-- Datos de muestra para desarrollo local. No usar en producción.

-- ============================================================
-- app_settings
-- ============================================================

insert into app_settings (key, value) values
  ('costo_envio_domicilio', '2500'),
  ('whatsapp_numero', '"5491100000000"'),
  ('punto_encuentro_direccion', '"Canning, Buenos Aires"'),
  ('punto_encuentro_descripcion', '"Retiro coordinado por WhatsApp en Canning, Buenos Aires"');

-- ============================================================
-- Productos de muestra (uno por cada tipo)
-- ============================================================

insert into products (id, nombre, slug, tipo, club, liga, temporada, descripcion, precio, permite_personalizacion, activo, destacado)
values
  ('00000000-0000-0000-0000-000000000001', 'Camiseta Selección Argentina Titular', 'camiseta-seleccion-argentina-titular', 'camiseta', 'Selección Argentina', 'Selección', '2026', 'Camiseta titular de la Selección Argentina, personalizable con nombre y número.', 45000, true, true, true),
  ('00000000-0000-0000-0000-000000000002', 'Short Selección Argentina Titular', 'short-seleccion-argentina-titular', 'short', 'Selección Argentina', 'Selección', '2026', 'Short titular de la Selección Argentina.', 22000, false, true, false),
  ('00000000-0000-0000-0000-000000000003', 'Conjunto Boca Juniors Titular', 'conjunto-boca-juniors-titular', 'conjunto', 'Boca Juniors', 'Liga Profesional', '2026', 'Conjunto completo (camiseta + short) de Boca Juniors, personalizable con nombre y número.', 58000, true, true, true);

insert into product_images (product_id, url, alt_text, orden) values
  ('00000000-0000-0000-0000-000000000001', '/placeholder-product.svg', 'Camiseta Selección Argentina Titular', 0),
  ('00000000-0000-0000-0000-000000000002', '/placeholder-product.svg', 'Short Selección Argentina Titular', 0),
  ('00000000-0000-0000-0000-000000000003', '/placeholder-product.svg', 'Conjunto Boca Juniors Titular', 0);

insert into product_variants (product_id, talle, sku, stock, stock_minimo) values
  ('00000000-0000-0000-0000-000000000001', 'S', 'CAM-ARG-TIT-S', 8, 3),
  ('00000000-0000-0000-0000-000000000001', 'M', 'CAM-ARG-TIT-M', 12, 3),
  ('00000000-0000-0000-0000-000000000001', 'L', 'CAM-ARG-TIT-L', 10, 3),
  ('00000000-0000-0000-0000-000000000001', 'XL', 'CAM-ARG-TIT-XL', 2, 3),
  ('00000000-0000-0000-0000-000000000002', 'S', 'SHO-ARG-TIT-S', 6, 3),
  ('00000000-0000-0000-0000-000000000002', 'M', 'SHO-ARG-TIT-M', 9, 3),
  ('00000000-0000-0000-0000-000000000002', 'L', 'SHO-ARG-TIT-L', 7, 3),
  ('00000000-0000-0000-0000-000000000003', 'S', 'CJT-BOC-TIT-S', 5, 3),
  ('00000000-0000-0000-0000-000000000003', 'M', 'CJT-BOC-TIT-M', 8, 3),
  ('00000000-0000-0000-0000-000000000003', 'L', 'CJT-BOC-TIT-L', 0, 3);

-- ============================================================
-- Admin
-- ============================================================
-- El usuario admin NO se crea por seed SQL (evita manejar hashes de contraseña a mano).
-- Pasos para promover un usuario a admin en desarrollo local:
--   1. Registrate normalmente en /registro (o `supabase auth admin` en producción) con el
--      email que vaya a operar el panel.
--   2. Corré:
--      update public.profiles set role = 'admin' where id = (
--        select id from auth.users where email = 'admin@groundcontrol90.com'
--      );
