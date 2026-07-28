#!/usr/bin/env bash
# Proxy /html5client UI to Windows OVVideo (Tailscale), locales from stock BBB.
set -euo pipefail
if [[ "${EUID}" -ne 0 ]]; then
  echo "Run: sudo bash $0 [WIN_IP] [PORT]" >&2
  exit 1
fi

WIN_IP="${1:-100.125.154.13}"
WIN_PORT="${2:-3000}"
UPSTREAM="http://${WIN_IP}:${WIN_PORT}"
LOCALES_DIR="/usr/share/bigbluebutton/html5-client/locales"

echo "Checking upstream ${UPSTREAM} ..."
curl -fsS -o /dev/null --connect-timeout 5 "${UPSTREAM}/"

ln -sf /usr/share/bigbluebutton/nginx/bbb-html5.nginx.static \
  /usr/share/bigbluebutton/nginx/bbb-html5.nginx

cat > /etc/bigbluebutton/nginx/bbb-html5-ovvideo-local.nginx <<EOF
# Locales from stock BBB (JSON autoindex). UI from Windows OVVideo.
location /html5client/locales {
  alias ${LOCALES_DIR};
  autoindex on;
  autoindex_format json;
  add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0";
}
location /html5client/ws {
  proxy_pass ${UPSTREAM}/ws;
  proxy_http_version 1.1;
  proxy_set_header Upgrade \$http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host \$host;
  proxy_read_timeout 86400;
}
location /html5client/ {
  proxy_pass ${UPSTREAM}/;
  proxy_http_version 1.1;
  proxy_set_header Host \$host;
  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto \$scheme;
  proxy_set_header Connection "";
  proxy_buffering off;
  proxy_read_timeout 86400;
}
EOF

cat > /etc/bigbluebutton/nginx/include_default.nginx <<'EOF'
include /usr/share/bigbluebutton/nginx/graphql.nginx;
include /usr/share/bigbluebutton/nginx/learning-dashboard.nginx;
include /usr/share/bigbluebutton/nginx/loadbalancer.nginx;
include /usr/share/bigbluebutton/nginx/notes.nginx;
include /usr/share/bigbluebutton/nginx/playback.nginx;
include /usr/share/bigbluebutton/nginx/plugins-assets-cors.nginx;
include /usr/share/bigbluebutton/nginx/presentation.nginx;
include /usr/share/bigbluebutton/nginx/presentation-slides.nginx;
include /usr/share/bigbluebutton/nginx/sip.nginx;
include /usr/share/bigbluebutton/nginx/web.nginx;
include /usr/share/bigbluebutton/nginx/webrtc-sfu.nginx;
EOF

rm -f /etc/bigbluebutton/nginx/bbb-html5-ovvideo-local.nginx.disabled

nginx -t
systemctl reload nginx

echo "OK: /html5client -> ${UPSTREAM}"
curl -skI "https://127.0.0.1/html5client/" -H "Host: huynhbaovps.tail84c3e5.ts.net" | head -12
