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
import Provider, { Adapter, Configuration } from 'oidc-provider';
import { ClientsAdapter } from "./ClientsAdapter.js";
import { MemoryAdapter } from "../MemoryAdapter.js";
import { allowedOrigins, port } from "../config.js";

function CreateAdapter(name: string): Adapter
{
    switch(name)
    {
        case "Client":
            return new ClientsAdapter;
        default:
            return new MemoryAdapter;
    }
}


const oidcConfig: Configuration = {
    adapter: CreateAdapter,

    clientBasedCORS(ctx, origin, client)
    {
        return allowedOrigins.Contains(origin);
    },

    clientDefaults: {
        grant_types: ["authorization_code"]
    },

    features: {
        devInteractions: { enabled: false }
    },

    findAccount: function(_, sub)
    {
        console.log("findAccount", arguments);
        return {
            accountId: sub,
            claims: async function(){
                console.log(arguments, "findAccount.claims");
                return {
                    sub: "subble",
                };
            },
        };
    },

    renderError: function(ctx, errorOut, error)
    {
        console.log(errorOut, error);
        ctx.res.end("An error occured");
    }
};

@Injectable
export class OIDCProviderService
{
    constructor()
    {
        this._provider = new Provider('http://localhost:' + port, oidcConfig);
    }

    //Properties
    public get provider()
    {
        return this._provider;
    }

    //State
    private _provider: Provider;
}