# Allok WhatsApp Coexistence

Estado auditado: **2026-08-08 (America/Caracas)**.

Coexistence es la modalidad predeterminada de Allok para un negocio que ya usa
WhatsApp Business App. El número permanece en el teléfono; Allok añade Cloud
API, inbox, CRM y automatización supervisada. Nunca se llama `/{phone-id}/register`
en esta modalidad.

## Estado real

La ruta técnica está implementada y apta para un piloto supervisado; la
aceptación E2E de un onboarding nuevo sigue pendiente del propietario:

- `allok.fun` sirve onboarding público mediante invitaciones firmadas de 7 días;
  el cliente no inicia sesión en Ops.
- La Meta App publicada es `servicioscreativos` (`4459170630986606`).
- La configuración Coexistence v4 es `1529564728405358`; la v2 anterior no debe
  volver a usarse.
- El popup real abre Facebook Login v25.0 con el config v4 y el flujo
  `whatsapp_business_app_onboarding`.
- Meta entrega webhooks a `https://allok.fun/api/meta/whatsapp/webhook` para
  `account_update`, `history`, `messages`, `smb_app_state_sync` y
  `smb_message_echoes`.
- Neon contiene una conexión `META_COEXISTENCE` y una `META_CLOUD_API`. Al cierre
  de la auditoría había 1.816 webhooks Meta procesados, ninguno pendiente/fallido.
  La conexión Coexistence tenía 587 entradas API, 674 salidas observadas desde
  la app móvil y una salida API; esos conteos excluyen Cloud API puro y WAHA.
- n8n 2.29.10 está sano y su drain completó 10.080/10.080 ejecuciones en los
  siete días auditados. Las ejecuciones `12057`–`12059` también terminaron con
  éxito después del despliegue final de Allok.

No se completó un onboarding nuevo hasta seleccionar el WABA/número: hacerlo
podría modificar un activo real. La conexión y los eventos Coexistence ya
existentes prueban mensajes nuevos y ecos de la app; la importación de historial
y contactos quedó implementada y probada contra Neon, pero todavía necesita una
aceptación con un onboarding nuevo o re-onboarding elegible.

## Matriz de soporte

| Capacidad | Estado | Alcance real |
|---|---|---|
| Mantener WhatsApp Business App | Soportado | Coexistence no registra ni desregistra el número. |
| Mensajes entrantes nuevos | Verificado | Persisten en Neon y aparecen en el inbox. |
| Mensajes enviados desde la app | Verificado | `smb_message_echoes` se guarda como salida `phone`. |
| Envío desde Allok | Verificado | Cloud API usa el token cifrado de la conexión. |
| Estados de entrega/lectura | Soportado | Se actualizan por `wa_message_id` sin retroceder estado. |
| Contactos de la app | Implementado | `smb_app_state_sync`; falta observar un lote real nuevo. |
| Historial previo | Implementado/limitado | Si el cliente acepta, Meta puede entregar por fases hasta 180 días de chats 1:1. Falta observar un lote real nuevo. |
| Chats grupales | No soportado por Meta | No se importan por Coexistence. |
| Reintento automático de sync inicial | No | Meta permite pedir cada tipo una vez por onboarding; un resultado ambiguo requiere revisión, no retry ciego. |
| Desconectar/reconectar | Implementado | Allok desuscribe la app; no llama `/deregister`. Falta repetir el ciclo con el propietario. |
| Dispositivos vinculados | Limitado por Meta | Hasta cuatro; Windows y WearOS no son compatibles con este flujo. |

## Qué ocurre al conectar

1. Ops genera una URL firmada desde **Números conectados**.
2. El cliente abre la URL sin una cuenta Allok y pulsa **Conectar mi WhatsApp**.
3. Meta autentica al cliente y guía la selección del portafolio, WABA y número.
4. El navegador recibe un `code` y eventos `WA_EMBEDDED_SIGNUP` mediante
   `window.postMessage`.
5. La página combina ambos resultados cuando llegan. Si sólo llega el código,
   espera 2,5 segundos y deja que el servidor descubra el número autorizado; si
   hay varios candidatos, responde `409` para no elegir uno por conjetura.
6. Allok intercambia el código por el token empresarial, valida permisos,
   resuelve WABA/número, guarda el token cifrado en Neon y sólo entonces
   suscribe la app.
7. Para Coexistence, Allok confirma `is_on_biz_app=true` y
   `platform_type=CLOUD_API`, y solicita una sola vez contactos e historial.
8. Los webhooks posteriores se validan, guardan y procesan en Allok. Realtime,
   cuando está configurado, acelera la UI; n8n sólo programa el drain de
   recuperación. La lógica y las automatizaciones permanecen en Allok.

## Operación segura

- Los secretos permanecen en entornos server-side autorizados; los tokens de
  cliente se guardan cifrados en Neon y nunca llegan a n8n. Las notas contienen
  únicamente IDs públicos y URLs.
- No usar un token manual “permanente” compartido. Cada onboarding obtiene su
  token empresarial y Allok lo cifra antes de guardarlo.
- Un enlace de onboarding sin firma o vencido muestra un error seguro y no abre
  Ops. La API de configuración rechaza la misma solicitud con `403`.
- `history` rechazado voluntariamente por el cliente (Meta `2593109`) es una
  condición válida, no un webhook fallido.
- Si `coexistence_sync_action_required` aparece, no repetir automáticamente
  `/smb_app_data`; revisar Meta y decidir si hace falta offboarding/re-onboarding.

Referencias oficiales: [onboarding de usuarios de WhatsApp Business App](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users) y [Embedded Signup v4](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/version-4).
