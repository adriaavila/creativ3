#!/bin/sh
# Pairs the WAHA session by phone code. Restarts first: an unscanned session
# expires into FAILED, and request-code then answers 422.
# Usage: ./scripts/waha-pair-code.sh 591XXXXXXXX
set -e
[ -n "$1" ] || { echo "usage: $0 <phone-with-country-code-no-plus>"; exit 1; }
: "${WAHA_URL:?set it or source .env.local}" "${WAHA_API_KEY:?}" "${WAHA_SESSION:?}"

curl -s -o /dev/null -X POST "$WAHA_URL/api/sessions/$WAHA_SESSION/restart" \
  -H "X-Api-Key: $WAHA_API_KEY" -H 'Content-Type: application/json'

i=0
while [ $i -lt 15 ]; do
  i=$((i+1)); sleep 2
  case "$(curl -s -H "X-Api-Key: $WAHA_API_KEY" "$WAHA_URL/api/sessions/$WAHA_SESSION")" in
    *'"status":"SCAN_QR_CODE"'*) break ;;
  esac
done

echo "Código de vinculación:"
curl -s -X POST "$WAHA_URL/api/$WAHA_SESSION/auth/request-code" \
  -H "X-Api-Key: $WAHA_API_KEY" -H 'Content-Type: application/json' \
  -d "{\"phoneNumber\":\"$(printf '%s' "$1" | tr -cd '0-9')\"}"
echo
echo "WhatsApp → Ajustes → Dispositivos vinculados → Vincular dispositivo → Vincular con número de teléfono"
