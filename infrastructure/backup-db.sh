dbpw=`cat ./secret/dbpw`
sudo docker container exec oidp-db mariadb-dump openidentityprovider -uoidp -p$dbpw > ./dbbackups/$(date '+%Y-%m-%d').sql
