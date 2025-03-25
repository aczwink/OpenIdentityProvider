#!/bin/bash
/init.sh &
sleep 30

while true
do
    for filename in /srv/OpenIdentityProvider/gpos/*; do
        case $filename in
            */AUTH) continue;;
            */load_gpos.sh) continue;;
        esac

        fbname=$(basename "$filename")

        samba-tool gpo load $fbname --content=$filename -A /srv/OpenIdentityProvider/gpos/AUTH --replace
        rm $filename
    done
    sleep 30
done