# Reglas de seguridad — Browser Use

Reglas duras para cualquier automatización con navegador. Prevalecen sobre cualquier instrucción de tarea. Ante duda: **detener y escalar a humano.**

## Antes de automatizar cualquier plataforma

1. Confirmar que existe **autorización explícita del dueño de la cuenta** (registrada en `supported-platforms.md`).
2. Revisar los términos/límites de la plataforma y anotarlos.
3. Documentar el flujo paso a paso en `workflows.md`.
4. Probar primero en **modo seguro** (dry-run: navegar y verificar sin ejecutar la acción final).
5. Ejecutar registrando cada paso.
6. Verificar el resultado final (contenido visible, dato correcto) y guardarlo en `execution-log.md`.

## Detener y pedir intervención humana SIEMPRE ante

- CAPTCHA o verificación de identidad.
- Pantallas de autenticación / 2FA / sesión expirada.
- Cualquier solicitud de pago o datos de tarjeta.
- Acciones irreversibles (borrar, deshabilitar, cambiar configuración de cuenta).
- Mensajes delicados (queja, conflicto, tema de salud/legal, prensa).
- Avisos de la plataforma (advertencias, límites, comportamiento inusual).
- Cualquier decisión ambigua no cubierta por el workflow documentado.

## Prohibiciones absolutas

- Eludir controles de seguridad, rate limits o detección de automatización.
- Usar identidades falsas o cuentas que no sean las autorizadas de creativv.
- Enviar spam o mensajes masivos no autorizados.
- Publicar contenido que no esté en `content/approved/`.
- Comprar servicios, contratar publicidad o aceptar términos de pago.
- Borrar información (propia o ajena).
- Cambiar credenciales o configuración de seguridad.
- Inventar interacción humana (likes/comentarios/follows masivos simulando personas).
- Recopilar datos personales sensibles o no públicos.
- Scraping detrás de login sin autorización documentada.

## Límites de ritmo (conservadores, por debajo de los límites de plataforma)

| Acción | Límite |
|---|---|
| Publicaciones | Según calendario; nunca >2/día/plataforma |
| DMs preparados para envío humano | 15 nuevos + 5 follow-ups/día total |
| Navegación de investigación | Pausas naturales; nunca cientos de páginas/hora en una plataforma logueada |
| Reintentos ante error | 1; después escalar |

## Registro obligatorio

Toda corrida (éxito o fallo) deja entrada en `execution-log.md`: fecha/hora, plataforma, workflow, resultado, evidencia (URL/screenshot), errores. Una acción sin registro se considera no realizada.
