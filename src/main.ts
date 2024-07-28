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
import Provider, { Account, Adapter, AdapterPayload, Configuration } from 'oidc-provider';
import { Dictionary } from 'acts-util-core';
import { SessionsAdapter } from './SessionsAdapter.js';
import { InteractionsAdapter } from './InteractionsAdapter.js';

interface AppRegistration
{
    clientId: string;
    clientSecret: string;
    redirectURIs: string[];
}

class TestClientsAdapter implements Adapter
{
    constructor()
    {
        this.clients = {
            "{your application id}": {
                clientId: "{your application id}",
                clientSecret: "sequa",
                redirectURIs: ["http://localhost:8080/oauth2"]
            }
        };
    }

    //Public methods
    upsert(id: string, payload: AdapterPayload, expiresIn: number): Promise<void | undefined>
    {
        console.log("upsert", arguments);
        throw new Error('Method not implemented.');
    }

    public async find(id: string): Promise<void | AdapterPayload | undefined>
    {
        const client = this.clients[id];
        if(client !== undefined)
        {
            return {
                client_id: client.clientId,
                client_secret: client.clientSecret,
                redirect_uris: client.redirectURIs,
            };
        }
    }

    findByUserCode(userCode: string): Promise<void | AdapterPayload | undefined>
    {
        console.log("findByUserCode", arguments);
        throw new Error('Method not implemented.');
    }

    findByUid(uid: string): Promise<void | AdapterPayload | undefined>
    {
        console.log("findByUid", arguments);
        throw new Error('Method not implemented.');
    }

    consume(id: string): Promise<void | undefined>
    {
        console.log("consume", arguments);
        throw new Error('Method not implemented.');
    }

    destroy(id: string): Promise<void | undefined>
    {
        console.log("destroy", arguments);
        throw new Error('Method not implemented.');
    }

    revokeByGrantId(grantId: string): Promise<void | undefined>
    {
        console.log("revokeByGrantId", arguments);
        throw new Error('Method not implemented.');
    }

    //Private state
    private clients: Dictionary<AppRegistration>;
}

function CreateAdapter(name: string)
{
    switch(name)
    {
        case "Client":
            return new TestClientsAdapter;
        case "Grant":
            return new GrantAdapter;
        case "Interaction":
            return new InteractionsAdapter;
        case "Session":
            return new SessionsAdapter;
    }
    console.log("HERE", name);
    throw new Error(name);
}

const accounts: Account[] = [
    {
        accountId: "asdasd",
        claims: async function(){
            console.log(arguments, "claims");
            return {
                sub: "subble",
            };
        },
    }
];

const configuration: Configuration = {
    adapter: CreateAdapter,
    findAccount: (_, accountId) => {
        return accounts.find(x => x.accountId === accountId);
    }
};

const oidc = new Provider('http://localhost:3000', configuration);
oidc.listen(3000, () => {
    console.log('oidc-provider listening on port 3000, check http://localhost:3000/.well-known/openid-configuration');
});