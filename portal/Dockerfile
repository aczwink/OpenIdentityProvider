FROM nginx:latest

COPY ./installation/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY ./installation/write_env.sh /docker-entrypoint.d/

COPY ./installation/index.htm /var/www/html/
COPY ./dist/bundle.js /var/www/html/