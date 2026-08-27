# Arquitectura de seguridad

## Límites de confianza

El navegador es no confiable. La API valida firma, emisor, audiencia y caducidad del JWT. PostgreSQL/RLS es la última barrera. `service_role` nunca llega al navegador y su uso será excepcional.

## Estrategia RLS

- RLS habilitada y forzada en toda tabla privada.
- Políticas explícitas para SELECT, INSERT, UPDATE y DELETE.
- Lectura: `user_id = auth.uid()`.
- Inserción: `with check (user_id = auth.uid())`; no se confía en el cuerpo.
- Actualización: condición en `using` y `with check`.
- Restricciones o RPC impiden relaciones cruzadas entre usuarios.
- El histórico crítico evita borrado directo.

## Validación

Dos usuarios comprobarán lectura, inserción, modificación, borrado y referencias cruzadas. También sesión ausente, JWT inválido y acceso horizontal con UUID conocido.

## Controles

Esquemas con listas permitidas, CORS exacto por entorno, límites de cuerpo/paginación/rate limit, errores sin trazas, logs redactados, auditoría de dependencias, CSP y confirmación reforzada en acciones irreversibles.

## Secretos y privacidad

Secretos en `.env` ignorado y gestores de Vercel/Render/Supabase. `.env.example` solo tendrá nombres. No se registran conceptos financieros, PII ni tokens salvo lo estrictamente necesario y redactado.

## Riesgos

- Ledger parcial: transacción/RPC atómica.
- Tabla sin RLS: comprobación automatizada del catálogo.
- Abuso de `service_role`: aislarlo y hacer que los flujos comunes usen identidad del usuario.
- Importaciones hostiles: tamaño, formato, contenido, staging y neutralización de fórmulas.

