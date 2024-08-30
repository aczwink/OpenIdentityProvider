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
import "acts-util-core";
import Provider, { Adapter, Configuration } from 'oidc-provider';
import { ClientsAdapter } from './ClientsAdapter.js';
import { MemoryAdapter } from './MemoryAdapter.js';

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

const allowedOrigins = ["http://localhost:8080"];
const configuration: Configuration = {
    adapter: CreateAdapter,

    clientBasedCORS(ctx, origin, client)
    {
        return allowedOrigins.Contains(origin);
    },

    clientDefaults: {
        grant_types: ["authorization_code"]
    },

    findAccount: function(_, sub)
    {
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
};

const oidc = new Provider('http://localhost:3000', configuration);
oidc.listen(3000, () => {
    console.log('oidc-provider listening on port 3000, check http://localhost:3000/.well-known/openid-configuration');
});