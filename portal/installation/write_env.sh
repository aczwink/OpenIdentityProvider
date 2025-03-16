#!/bin/sh
FORMAT='window.process = { env: {OIDP_BACKEND_URL:"%s",OIDP_FRONTEND_BASEURL:"%s",OIDP_OIDP_ENDPOINT:"%s"} };\n'
printf "$FORMAT" "$OIDP_BACKEND_URL" "$OIDP_FRONTEND_BASEURL" "$OIDP_OIDP_ENDPOINT" > /var/www/html/env.js