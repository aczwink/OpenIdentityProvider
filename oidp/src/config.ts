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
import fs from "fs";

export const allowedOrigins = ["http://localhost:8081"];
export const port = 3000;

export const CONFIG_DB = {
    host: process.env.OIDP_DBHOST!,
    user: process.env.OIDP_DBUSER!,
    password: process.env.OIDP_DBPW!,
};

export const CONFIG_DOMAIN = {
    dnsForwarderIP: process.env.OIDP_DNSFORWARDERIP!,
    domain: process.env.OIDP_DOMAIN!,
    dcIP_Address: process.env.OIDP_DCIP
};

export const CONFIG_SIGNING_KEY = JSON.parse(fs.readFileSync("/srv/OpenIdentityProvider/signing_key.json", "utf-8"));