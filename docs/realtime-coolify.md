# allok-realtime en Coolify

`allok-realtime` es un servicio separado del Next.js de Vercel. Neon conserva conversaciones y mensajes; Redis solo contiene pub/sub, presencia, typing e idempotencia temporal.

## Crear Redis privado

1. En el proyecto de Coolify crea un recurso Redis con volumen persistente.
2. No publiques el puerto `6379` y no añadas ningún port mapping público.
3. Conecta Redis y `allok-realtime` a la misma red privada de Coolify.
4. Usa la URL interna que Coolify proporciona como `REDIS_URL`; nunca la expongas al navegador ni a Internet.

## Crear `allok-realtime`

1. Crea una aplicación desde este repositorio y apunta el Build Pack a `apps/realtime/Dockerfile`.
2. Configura el dominio `realtime.allok.fun`.
3. Activa TLS/Let's Encrypt en Coolify. El cliente debe usar `wss://realtime.allok.fun/ws`.
4. Define estas variables en la aplicación:

```text
PORT=3000
REDIS_URL=redis://<host-interno>:6379
REALTIME_TOKEN_SECRET=<secreto-largo-y-aleatorio>
REALTIME_INGEST_SECRET=<secreto-largo-y-aleatorio>
REALTIME_ALLOWED_ORIGINS=https://allok.fun
```

En Vercel, añade `REALTIME_TOKEN_SECRET`, `REALTIME_INGEST_SECRET`, `REALTIME_INGEST_URL=https://realtime.allok.fun/internal/events` y `NEXT_PUBLIC_REALTIME_URL=wss://realtime.allok.fun`. Los secretos deben coincidir entre Vercel y Coolify, y nunca deben llegar al navegador.

## Verificación y operación

```bash
curl -fsS https://realtime.allok.fun/healthz
```

Debe responder `{"ok":true}`. Para reiniciar, usa **Redeploy/Restart** en Coolify; no reinicies Redis para corregir un problema de aplicación. Revisa los logs de `allok-realtime` buscando únicamente errores de arranque, Redis o conexión: el servicio no registra tokens, firmas, secretos ni payloads.

Redis debe revisarse desde la red privada de Coolify, por ejemplo con `redis-cli -u "$REDIS_URL" ping`. Las claves `realtime:presence:*`, `realtime:typing:*` y `realtime:ingest:*` son temporales. `realtime:events` es Pub/Sub y no es historial.

Comprueba desde fuera que `6379` no está publicado: no debe existir un port mapping ni un listener público. Solo `443` para `realtime.allok.fun` debe ser accesible; `/healthz`, `/ws` y `/internal/events` se sirven detrás de HTTPS.
