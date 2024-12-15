/**
 * OpenIdentityProvider
 * Copyright (C) 2024 Amir Czwink (amir130@hotmail.de)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * */

export const CONFIG_DB = {
    host: process.env.OIDP_DBHOST!,
    user: process.env.OIDP_DBUSER!,
    password: process.env.OIDP_DBPW!,
};

export const CONFIG_OIDC = {
    domain: process.env.OIDP_DOMAIN!,
    port: parseInt(process.env.OIDP_PORT!),
};
export const CONFIG_OIDC_ISSUER = 'https://' + CONFIG_OIDC.domain +  ':' + CONFIG_OIDC.port;

export const CONFIG_AD_DOMAIN = {
    dnsForwarderIP: process.env.OIDP_DNSFORWARDERIP!,
    domain: process.env.OIDP_AD_DOMAIN!,
    dcIP_Address: process.env.OIDP_DCIP
};

export const CONFIG_STORAGE_ROOT_DIR = "/srv/OpenIdentityProvider";