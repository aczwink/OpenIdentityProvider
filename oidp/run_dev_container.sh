#!/bin/bash
docker container stop oidp_dev
docker container rm oidp_dev
docker build --network host -t oidp .
export $(cat .env | xargs)
docker run --name oidp_dev --rm -v /srv/OpenIdentityProvider:/srv/OpenIdentityProvider:ro -v /etc/localtime:/etc/localtime:ro -v /srv/OpenIdentityProvider/samba_data:/var/lib/samba -v /srv/OpenIdentityProvider/samba_config:/etc/samba/external --dns-search $OIDP_AD_DOMAIN --dns $OIDP_DCIP --dns $OIDP_DNSFORWARDERIP --add-host $OIDP_HOSTNAME.$OIDP_AD_DOMAIN:$OIDP_DCIP -h $OIDP_HOSTNAME --privileged --network host --privileged --env-file ./.env oidp