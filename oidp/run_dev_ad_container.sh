#!/bin/bash
docker container stop oidp_ad_dev
docker container rm oidp_ad_dev
export $(cat .env | xargs)
sudo cp ./load_gpos.sh /srv/OpenIdentityProvider/gpos/
docker run --name oidp_ad_dev --rm -v /etc/localtime:/etc/localtime:ro -v /srv/OpenIdentityProvider/samba_data:/var/lib/samba -v /srv/OpenIdentityProvider/samba_config:/etc/samba/external -v /srv/OpenIdentityProvider/gpos:/srv/OpenIdentityProvider/gpos --dns-search $OIDP_AD_DOMAIN --dns $OIDP_DCIP --dns $OIDP_DNSFORWARDERIP --add-host $OIDP_HOSTNAME.$OIDP_AD_DOMAIN:$OIDP_DCIP -h $OIDP_HOSTNAME --network host --privileged \
    -e DNSFORWARDER=$OIDP_DNSFORWARDERIP -e DOMAIN=DEVAD.HOME.ARPA -e DOMAIN_DC=dc=devad,dc=home,dc=arpa -e DOMAIN_EMAIL=$OIDP_AD_DOMAIN -e DOMAINPASS=AdminPW1234! -e HOSTIP=$OIDP_DCIP -e NOCOMPLEXITY=true \
    ghcr.io/aczwink/samba-domain