FROM node

WORKDIR /app

RUN apt update && apt install -y mariadb-client samba-common-bin && apt clean autoclean && apt autoremove --yes && rm -rf /var/lib/{apt,dpkg,cache,log}/ && rm -rf /tmp/* /var/tmp/*

COPY ./src/views ./views
COPY ./dist/*.js ./
CMD [ "node", "app.js" ]