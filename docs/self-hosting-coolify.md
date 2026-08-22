# allok en Coolify

Cómo correr allok en el VPS (`srv1826692`) en lugar de Vercel + Neon. El dominio
no cambia: sigue siendo `allok.fun`, así que **Meta y Stripe no necesitan ningún
cambio de configuración** — ni callbacks, ni verify tokens, ni webhooks. Lo único
que se mueve es a qué origen apunta Cloudflare.

## Por qué el build va fuera del VPS

La caja tiene 2 vCPU compartidos con n8n y los gateways WAHA, que mantienen
sesiones de WhatsApp vivas. Un `next build` les compite el CPU. Construí la
imagen en GitHub Actions, publicala a un registry, y que Coolify haga pull.

## Base de datos

Postgres estándar de Coolify, privado, sin puerto público. La app lo alcanza por
la red interna de Docker; nada de exponer 5432.

Migración de datos:

```bash
pg_dump "$NEON_URL" --no-owner --no-privileges -Fc -f allok.dump
pg_restore -d "$VPS_URL" --no-owner --no-privileges allok.dump
```

Son ~25 MB y no hay tráfico de WhatsApp entrante, así que no hace falta escritura
dual ni congelar nada.

## Variables de entorno

`.env.example` tiene la lista completa. Tres cosas que no son obvias:

- **`TOKEN_ENCRYPTION_KEY` tiene que viajar idéntica.** Los tokens de negocio de
  los clientes están cifrados con ella dentro de Postgres. Si cambia, el dump
  viaja pero ningún token se puede descifrar: el onboarding seguiría andando y
  **enviar mensajes se rompería**. Es la falla más silenciosa de toda la mudanza.
- **`META_APP_SECRET`** firma el `state` del signup y las invitaciones. Cambiarla
  invalida los onboardings en vuelo (se recuperan recargando).
- **Las `NEXT_PUBLIC_*` se hornean en el build**, no en runtime. Van como
  `--build-arg`, no como variable de Coolify:

  ```
  NEXT_PUBLIC_APP_URL
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  ```

El resto se lee en cada request y vive sólo en Coolify.

## Apagado gradual — no es opcional

El webhook de Meta encola el evento y lo procesa en `after()`, **después** de
haber respondido 200. Next termina esos callbacks al recibir `SIGTERM`, pero
necesita tiempo. Configurá el drenado de Coolify en **10–30 s**; con el default
de 10 s justo, un redeploy en medio de un webhook corta el procesamiento.

El evento no se pierde (se persiste antes de `after()`, y el drenado de n8n lo
recupera), pero el retraso es evitable.

## Cutover

1. Desplegá en un dominio temporal con una copia de los datos.
2. Probá ahí: handshake del webhook (`GET` con `hub.challenge`), config de
   Embedded Signup, checkout de Stripe en test.
3. Cambiá el origen en Cloudflare. Cloudflare proxea y termina el TLS hacia el
   visitante, así que no hay ventana de certificado.
4. **Rollback = apuntar Cloudflare de vuelta a Vercel.** Dejá el deployment de
   Vercel vivo unos días; es la red de seguridad.
5. Apagá Neon y Vercel recién cuando lleve varios días estable.

## Verificado en local

La imagen se construyó y corrió antes de escribir esto:

| Prueba | Resultado |
|---|---|
| Tamaño de imagen | 327 MB |
| `GET /` | 200 en 122 ms |
| `GET /ops` | 307 → `ops-login` |
| Handshake de Meta con token correcto | 200, devuelve el challenge |
| Handshake con token incorrecto | 403 |
| Assets `/_next/static/*` | 200 (standalone no los copia solo; el Dockerfile sí) |
| `SIGTERM` | exit 143, sin OOM |
