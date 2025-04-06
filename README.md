# OpenIdentityProvider
[![Build docker images](https://github.com/aczwink/OpenIdentityProvider/actions/workflows/docker-image.yml/badge.svg)](https://github.com/aczwink/OpenIdentityProvider/actions/workflows/docker-image.yml)
Identity provider software

## Generation of keys
Keys are mandatory to run OpenIdentityProvider.
The following document lists jwks suitable for development purposes:
https://datatracker.ietf.org/doc/html/rfc7517

## Generation of a self-signed certificate for HTTPS
The following steps generate a self-signed certificate suitable for development purposes:
openssl req -x509 -newkey rsa:4096 -keyout private.key -out oidp-public.crt -sha256 -days 3650 -nodes -subj "/C=XX/ST=StateName/L=CityName/O=CompanyName/OU=CompanySectionName/CN=localhost"

To add it to the trusted certificate store do:
sudo cp oidp-public.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates

## Configuration

Set hostname of the domain controller. DO NOT use name "LOCALDC", since it is a reserved name.

### Environment variables
OIDP_DCIP - Static IP of the primary domain controller. It should be on your hosts network in order for devices to easily reach it.
