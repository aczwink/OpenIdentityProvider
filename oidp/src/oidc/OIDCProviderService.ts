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
import express from "express";
import { GlobalInjector, Injectable } from "acts-util-node";
import Provider, { Adapter, Configuration } from 'oidc-provider';
import { ClientsAdapter } from "./ClientsAdapter";
import { MemoryAdapter } from "../MemoryAdapter";
import { allowedOrigins, CONFIG_SIGNING_KEY, port } from "../config";
import { AppRegistrationsController } from "../data-access/AppRegistrationsController";
import { ClaimProviderService } from "../services/ClaimProviderService";

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


    extraTokenClaims: function(_, token)
    {
        if(token.kind === "AccessToken")
        {
            const claimProviderService = GlobalInjector.Resolve(ClaimProviderService);
            return claimProviderService.Provide(token.clientId!, token.accountId);
        }
    },

    features: {
        devInteractions: { enabled: false },

        resourceIndicators: {
            enabled: true,

            defaultResource(ctx, client, oneOf)
            {
                return "localhost:3000";
            },

            async getResourceServerInfo(ctx, resourceIndicator, client)
            {
                const appReg = await GlobalInjector.Resolve(AppRegistrationsController).QueryByExternalId(client.clientId);
                return {
                    scope: appReg!.scopes.join(" "),
                    accessTokenFormat: "jwt",
                    jwt: {
                        sign: { alg: 'ES256' },
                    }
                };
            },

            useGrantedResource(ctx, model)
            {
                //TODO: is this still needed?
                return true;
            },
        }
    },

    findAccount: function(_, sub)
    {
        return {
            accountId: sub,
            claims: async function(){
                console.log("findAccount.claims", arguments);
                return {
                    sub,
                };
            },
        };
    },

    jwks: {
        keys: [CONFIG_SIGNING_KEY]
    },

    renderError: function(ctx, errorOut, error)
    {
        const app = ctx.res as unknown as express.Express;
        return app.render('error', {
            title: errorOut.error,
            description: errorOut.error_description,

            //TODO: fix this
            uid: 0,
            client: {
                tosUri: "",
                policyUri: ""
            }
          });
    },
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