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
import { Injectable } from "acts-util-node";
import { AbsURL } from "acts-util-core";
import { ClientsController } from "../data-access/ClientsController";

@Injectable
export class CORSHandler
{
    constructor(private clientsController: ClientsController)
    {
        this.validOrigins = new Set();

        this.ReloadOrigins();
    }

    public IsValid(origin: string)
    {
        return this.validOrigins.has(origin);
    }

    public async ReloadOrigins()
    {
        const set = new Set<string>();

        const uris = await this.clientsController.QueryAllRedirectURIs();
        for (const uri of uris)
        {
            const url = AbsURL.Parse(uri);

            let portPart;
            if((url.port === 80) || (url.port === 443))
                portPart = "";
            else
                portPart = ":" + url.port;

            const origin = url.protocol + "://" + url.host + portPart;
            set.add(origin);
        }

        this.validOrigins = set;
    }

    //State
    private validOrigins: Set<string>;
}