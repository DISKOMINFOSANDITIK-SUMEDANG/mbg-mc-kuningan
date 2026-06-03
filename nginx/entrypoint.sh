#!/bin/sh
set -eu

SSL_DIR=/etc/nginx/ssl
RUNTIME_SSL_DIR=/tmp/nginx-ssl
SOURCE_CERT_FILE="$SSL_DIR/fullchain.pem"
SOURCE_KEY_FILE="$SSL_DIR/privkey.pem"
CERT_FILE="$RUNTIME_SSL_DIR/fullchain.pem"
KEY_FILE="$RUNTIME_SSL_DIR/privkey.pem"

mkdir -p "$RUNTIME_SSL_DIR"

if [ -f "$SOURCE_CERT_FILE" ] && [ -f "$SOURCE_KEY_FILE" ]; then
  cp "$SOURCE_CERT_FILE" "$CERT_FILE"
  cp "$SOURCE_KEY_FILE" "$KEY_FILE"
elif [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 30 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/CN=localhost" >/dev/null 2>&1
fi

exec "$@"
