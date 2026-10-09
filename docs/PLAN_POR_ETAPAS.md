# Ground Control 90 — Plan por etapas

> Snapshot: 2026-10-08. Complementa `docs/ECOMMERCE_ROADMAP.md` con el estado **real** verificado contra el repo y la base de producción (`lgntsnelmqrvcqtjdwdj`).

## Estado real hoy

| Área | Local | Producción |
|---|---|---|
| Código Fases 2–8 | Commiteado por fase (Etapa 1) | No desplegado — prod corre ≈ commit `d7091ad` |
| Schema | `0001` igual a prod + `0002`–`0006` nuevas (Etapa 2, parte local) | Solo `init_schema` + `harden_function_privileges` (sin `rate_limits`, `product_reviews`, `wishlists`, `carts`, `*_costos`, `search_vector`, `monto_reembolsado`) |
| Historial de migraciones | `0001`…`0006` | `20260802234521`, `20260802234832` — **no coinciden** |
| Webhook Mercado Pago | — | Roto: 16/16 órdenes de prueba en `pendiente_pago`, `mp_payment_id = null` (`SignatureMismatch`) |
| Catálogo | Seed local | 1 producto: `TEST SANDBOX (borrar)` |
| Admin | Cuenta de test local | 1 admin (confirmar que es la cuenta real) |

**Regla para todas las etapas:** Vercel tiene la integración de GitHub conectada (verificado el 2026-10-08: todos los deploys de producción vienen de `main`), así que **cada push a `main` se despliega solo a producción**. Antes de pushear, todo lo que el código necesite en la base (migraciones, `app_settings`) tiene que estar ya aplicado en prod. Para probar algo sin tocar prod, pusheá a otra rama: eso genera un deploy de preview.

---

## Etapa 1 — Ordenar el repo

Objetivo: que todo el trabajo local quede versionado y que nada se suba a producción por accidente.

- [x] Comentar el `schedule:` de `.github/workflows/carritos-abandonados.yml` (como ya está `liberar-reservas.yml`). Si no, al pushear va a correr cada hora contra una ruta que todavía no existe en prod.
- [x] Decidir qué hacer con `docs/image.png` (commitear o borrar). — Borrada: era una captura de un resumen de chat, su contenido ya está en el roadmap y en este plan.
- [x] Commits separados por fase (2: checkout/pagos, 3: búsqueda y merchandising, 4: ops, 5: UX, 6: admin, 7: Andreani, 8: CORS), cada uno con `npm run build` + `npm run lint` limpios. — Cada commit trae su propia migración y sus tipos regenerados; lint con 0 errores en todos (warnings preexistentes). Aparte: un commit para `[auth.external.google]` en `supabase/config.toml` y otro para docs.
- [x] `git push origin main`.

**Listo cuando:** `git status` vacío y `origin/main` al día.

---

## Etapa 2 — Poner al día el schema de producción

Objetivo: que la base de prod tenga todo lo que el código nuevo necesita, con un historial de migraciones que la CLI de Supabase entienda.

- [x] Restaurar `0001_init_schema.sql` a la versión que ya está aplicada en prod (la de `d7091ad`). — Hecho junto con la Etapa 1, para que el historial nunca tenga la versión editada in-place.
- [x] Mover el delta que se le agregó in-place a migraciones nuevas y renumerar las siguientes. — Quedó una migración por fase, en el orden de los commits: `0002_reembolso_parcial_rate_limit` (Fase 2: `monto_reembolsado`, `reembolsado_parcial` en los CHECK, `rate_limits` + `check_rate_limit`), `0003_busqueda_reviews_wishlist` (Fase 3: `search_vector` + GIN, `product_reviews`, `wishlists`), `0004_carritos_abandonados`, `0005_costos_produccion`, `0006_andreani_envios`.
- [x] Verificar en local: `npx supabase db reset` aplica toda la cadena sin errores y `gen types` no muestra diferencias. — Los tipos salen idénticos y un `db dump --schema public` es igual al de la versión in-place, salvo la posición de la columna `payments.monto_reembolsado`. Ojo: usar `npx supabase@2.115.0 gen types …`, porque la 2.120 genera otro formato (sin formatear) que reescribe el archivo entero. El `db reset` también conviene correrlo con la 2.115, porque la 2.120 cambia los default privileges de los roles locales.
- [x] Alinear el historial de prod:
  ```bash
  npx supabase link --project-ref lgntsnelmqrvcqtjdwdj
  npx supabase migration repair --status reverted 20260802234521 20260802234832
  npx supabase migration repair --status applied 0001
  npx supabase db push --dry-run   # debe listar solo 0002–0006
  npx supabase db push
  ```
- [x] Verificar los grants en prod: `information_schema.routine_privileges` → solo `service_role` tiene `EXECUTE` sobre `create_order_and_reserve_stock`, `release_order_reservation`, `validate_coupon`, `next_order_number` y `check_rate_limit`. Ojo: Supabase Cloud le da `EXECUTE` directamente a `anon`/`authenticated`, así que hace falta `revoke ... from public, anon, authenticated`. — Confirmado con `has_function_privilege`: `anon`/`authenticated` en `false` para las cinco.
- [x] Correr el security advisor de Supabase sobre las tablas nuevas. — Lo único nuevo es un INFO por `rate_limits` sin policies, que es intencional (solo se accede vía `check_rate_limit`). Quedan warnings que ya estaban antes y van a la Etapa 8: `handle_new_user`/`is_admin`/`rls_auto_enable` ejecutables por `anon`/`authenticated` (`is_admin` lo necesita para RLS; `rls_auto_enable` es de Supabase) y la protección contra contraseñas filtradas desactivada en Auth.
- [x] Commit.

Además, un `db dump --schema public` de prod coincide con el local en todo lo de `0002`–`0006`. Las únicas diferencias son de la plataforma (`rls_auto_enable` y los grants por defecto de Supabase Cloud).

**Listo cuando:** `db push --dry-run` no lista nada pendiente y el advisor no marca problemas nuevos.

---

## Etapa 3 — Deploy y webhook de Mercado Pago

Objetivo: que un pago aprobado en sandbox quede como `pagado` en la base. Esto bloquea todo lo relacionado con pagos.

- [x] Revisar en `vercel logs` lo que imprime el log de diagnóstico. — La compra `GC90-000017` (2026-10-08) confirmó `SignatureMismatch`, `secretLength = 64`, `live_mode: true` y la cuenta vendedora `3583994365`. El `data.id` firmado viene del query string `?data.id=`. Los logs de las compras de agosto ya habían vencido en el plan Hobby de Vercel.
- [ ] Corregir según lo que muestren los logs y sacar el log de diagnóstico una vez resuelto. — Hallazgos de las compras `GC90-000017` y `GC90-000019`:
  - **La firma real sigue sin coincidir:** el secret local y el desplegado en Vercel coinciden (una notificación ficticia firmada localmente recibió `200`), pero la notificación real del pago de `GC90-000019` recibió `401 SignatureMismatch`. `secretLength` es 64 y `live_mode: true`, con `user_id: 3583994365`. Esos datos no bastan para concluir qué clave de Webhooks firmó el evento. **Pendiente:** comparar la firma capturada con la clave de **Modo pruebas** de la misma aplicación, cargar en Vercel la que coincida y redeployar.
  - **Corregido en código:** el SDK 3.2.1 compara el `ts` de la firma como milisegundos, pero MP lo manda en segundos. Con el secret correcto, todo habría fallado con `TimestampOutOfTolerance`; la tolerancia ahora se chequea aparte, en segundos.
  - **Corregido en código:** las notificaciones IPN (`?id=…&topic=…`, sin `data.id`) se responden 200 y se ignoran, porque no se pueden validar y el mismo evento llega también en formato webhook.
  - **Corregido en código:** MP manda cada evento dos veces casi en simultáneo. El paso a `pagado` ahora es un UPDATE condicionado al estado, así que el mail y el envío de Andreani salen una sola vez.
  - **Corregido en código (2026-10-09):** el pago consultado en MP siempre usa el `data.id` firmado de la URL. El checkout devuelve error si no puede guardar la preferencia o el pago; el webhook devuelve `500` ante errores de escritura para que MP reintente. `npm run build` y `npm run lint` pasan en local (lint conserva una advertencia previa de React Hook Form). Una firma válida se aceptó y una firma vencida se rechazó en una comprobación local.
- [x] Desplegar: push a `main` (Vercel despliega solo). — `768e8bb` figura `Ready` en Production y sirve `groundcontrol90.vercel.app`.
- [x] Compra de prueba con cuenta de **test buyer** (no tu cuenta real de MP) y nombre `APRO`. — `GC90-000019` mostró aprobado en Mercado Pago, pero quedó `pendiente_pago` por el `401` del webhook.
- [ ] Confirmar en la base: `orders.estado = 'pagado'` y `payments.mp_payment_id` poblado. Que la redirección haya funcionado no alcanza como prueba.

**Listo cuando:** una orden de sandbox queda en `pagado` con `mp_payment_id`.

---

## Etapa 4 — Matriz de pruebas sandbox

Objetivo: validar en vivo cada camino de pago antes de usar dinero real. Verificar cada fila en la base, no en la UI.

| Escenario | Cómo | Esperado |
|---|---|---|
| Aprobado | `APRO` | `pagado`, mail de confirmación (requiere Etapa 5) |
| Rechazado | `OTHE` | `/checkout/error`, reserva liberada, stock y uso de cupón restaurados |
| Pendiente | `CONT` | `/checkout/pendiente` |
| Cuotas | cualquier tarjeta | el selector de cuotas de MP respeta `cuotas_maximas` |
| Reembolso total desde admin | botón en `/admin/pedidos/[id]` | `reembolsado` en `orders`/`payments` + fila en `audit_logs` |
| Reembolso parcial desde admin | monto < total | `reembolsado_parcial`, `monto_reembolsado` acumulado |
| Reembolso desde dashboard MP (total y parcial) | dashboard MP | el webhook reconcilia (`refunded` / `transaction_amount_refunded`) |
| Vencimiento de reserva | orden impaga > 30 min + disparo manual de `liberar-reservas` | reserva liberada, idempotente |
| Rate limit | > 10 req/min a `crear-preferencia` | `429` |

- [ ] Limpiar las órdenes de prueba `GC90-000001`…`000016` (opcional, no bloquea).

**Listo cuando:** todas las filas están verificadas en la base.

---

## Etapa 5 — Servicios externos y automatizaciones

Objetivo: que mails, login social y crons funcionen en producción.

- [ ] **Resend:** crear la cuenta, verificar el dominio de `EMAIL_FROM_ADDRESS` y cargar `RESEND_API_KEY` en Vercel (Production + Preview). Probar la confirmación de orden y el mail de carrito abandonado.
- [ ] **Google OAuth:**
  - Google Cloud Console → OAuth Client ID, con redirect URIs `https://lgntsnelmqrvcqtjdwdj.supabase.co/auth/v1/callback` y `http://127.0.0.1:54321/auth/v1/callback`.
  - Supabase (prod) → Auth → Providers → Google, con Client ID y Secret.
  - Supabase (prod) → Auth → URL Configuration: Site URL `https://groundcontrol90.vercel.app` y la lista de redirects.
  - Probar login y registro con Google en prod.
- [ ] **Crons (GitHub Actions):**
  - Cargar los repo secrets `SITE_URL` y `CRON_SECRET` (el mismo valor que en Vercel).
  - Descomentar `schedule:` en `liberar-reservas.yml` y en `carritos-abandonados.yml`.
  - Disparar cada workflow una vez con `workflow_dispatch` y confirmar que responde `200`.

**Listo cuando:** llega el mail de una compra real de sandbox, el login con Google funciona y los dos workflows corren solos.

---

## Etapa 6 — Andreani (Fase 7)

Objetivo: pasar de un código que solo se probó sin credenciales a uno validado contra el sandbox real.

- [ ] Obtener usuario, contraseña, número de cliente y contrato en el portal de developers de Andreani, y confirmar que la autenticación es Basic → `x-authorization-token`.
- [ ] Cargar las variables `ANDREANI_*` (con `ANDREANI_ENV` en sandbox) en Vercel.
- [ ] Hacer una cotización real y ajustar el parser del campo de costo en `src/lib/andreani/cotizador.ts`.
- [ ] Crear una orden de envío real y ajustar `src/lib/andreani/envios.ts`, incluido el formato de los eventos de `trazas`.
- [ ] Si Andreani exige `documentoTipo`/`documentoNumero`, agregar un campo DNI/CUIT al checkout y guardarlo en `orders` con una migración nueva.
- [ ] Revisar `ShipmentTracking` con datos reales y decidir si hace falta un stepper fijo.

**Listo cuando:** una orden pagada con envío a domicilio genera un número de envío y muestra el tracking en `/checkout/exito`.

---

## Etapa 7 — Salida en vivo (Fase 1d)

Objetivo: primera venta real.

- [ ] Borrar el producto de prueba: `delete from products where slug = 'test-sandbox-borrar';`
- [ ] Cargar el catálogo real desde `/admin/productos`, con imágenes, variantes, stock y costos.
- [ ] Revisar `/admin/configuracion`: número de WhatsApp, punto de retiro, costo de envío y cuotas máximas.
- [ ] Confirmar que el admin de prod es la cuenta real del negocio.
- [ ] Cambiar `MP_ACCESS_TOKEN`/`MP_WEBHOOK_SECRET` por los de **producción**. Verificar con `GET /users/me` que no tengan el tag `test_user`.
- [ ] Registrar el webhook de "Modo productivo" en el dashboard de MP.
- [ ] Cambiar Andreani a `ANDREANI_ENV=produccion` (si la Etapa 6 está cerrada).
- [ ] Redeploy y una compra real chica, por ejemplo $100 ARS, que después se reembolsa desde el admin.

**Listo cuando:** la compra real queda en `pagado`, llega el mail y el reembolso se refleja.

---

## Etapa 8 — Endurecimiento y crecimiento (después del lanzamiento)

Sin un orden estricto. Cada ítem se suma sobre un producto que ya funciona.

- [ ] **Headers de seguridad** (Fase 8b): CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy` y `Permissions-Policy` en `next.config.ts`.
- [ ] **Auditoría:** `npm audit` y una cadencia para rotar secretos (`CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, credenciales de MP).
- [ ] **Robustez de mails** (Fase 4): reintentos, aviso de "nuevo pedido" al admin y alerta de stock bajo.
- [ ] **Analytics** (GA4/Plausible/Meta pixel), cuando exista la cuenta.
- [ ] **Dominio propio:** agregarlo en Vercel y actualizar el DNS, `NEXT_PUBLIC_SITE_URL` (que también alimenta la lista de CORS), el Site URL y los redirects de Supabase Auth, los redirect URIs de Google y el webhook de MP.
- [ ] **Moderación de reviews** desde el admin (hoy se hace directo en la base).
- [ ] Revisión en dispositivo móvil real (pendiente de la Fase 5).
- [ ] Actualizar `docs/ECOMMERCE_ROADMAP.md` para que separe lo "hecho en local" de lo "en producción".
