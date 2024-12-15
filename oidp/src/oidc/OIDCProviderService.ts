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
import { MemoryAdapter } from "./MemoryAdapter";
import { CONFIG_OIDC_ISSUER } from "../env";
import { ClaimProviderService } from "../services/ClaimProviderService";
import { UserAccountsController } from "../data-access/UserAccountsController";
import { AppRegistrationsController } from "../data-access/AppRegistrationsController";
import { PKIManager } from "../services/PKIManager";
import { CORSHandler } from "../services/CORSHandler";
import { ClientsController } from "../data-access/ClientsController";
import { ScopeEvaluationService } from "../services/ScopeEvaluationService";

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

    claims: {
        email: ["email"],
        openid: ["sub"],
        profile: ["given_name", "name"]
    },

    clientBasedCORS(ctx, origin, client)
    {
        const corsHandler = GlobalInjector.Resolve(CORSHandler);
        return corsHandler.IsValid(origin);
    },

    extraTokenClaims: async function(_, token)
    {
        let externalUserId;
        if(token.kind === "ClientCredentials")
        {
            const clientsController = GlobalInjector.Resolve(ClientsController);
            const client = await clientsController.Query(token.clientId!);
            const userId = client!.appUserId!;

            const userAccountsController = GlobalInjector.Resolve(UserAccountsController);
            const user = await userAccountsController.Query(userId);
            if(user?.type !== "service-principal")
                throw new Error("Should never happen");
            externalUserId = user.externalId;
        }
        else
            externalUserId = token.accountId;
        
        const claimProviderService = GlobalInjector.Resolve(ClaimProviderService);
        const provided = await claimProviderService.ProvideWithoutScope(token.clientId!, externalUserId);
        return provided;
    },

    features: {
        devInteractions: { enabled: false },

        clientCredentials: {
            enabled: true,
        },

        resourceIndicators: {
            enabled: true,

            async defaultResource(ctx, client, oneOf)
            {
                const clientsController = GlobalInjector.Resolve(ClientsController);
                const appRegistrationsController = GlobalInjector.Resolve(AppRegistrationsController);

                const clientData = await clientsController.Query(client.clientId);
                const appReg = await appRegistrationsController.Query(clientData!.appRegistrationId);

                return appReg!.audience;
            },

            async getResourceServerInfo(ctx, resourceIndicator, client)
            {
                const scopes = await GlobalInjector.Resolve(ScopeEvaluationService).ProvideScope(client.clientId);
                return {
                    scope: scopes,
                    accessTokenFormat: "jwt",
                    jwt: {
                        sign: { alg: 'ES256' },
                    }
                };
            },

            useGrantedResource(ctx, model)
            {
                //resource parameter is implicitly bound to the client id for oidp
                return true;
            },
        }
    },

    findAccount: function(_, sub)
    {
        return {
            accountId: sub,
            claims: async function()
            {
                const uac = GlobalInjector.Resolve(UserAccountsController);
                const userId = await uac.QueryInternalId(sub);
                const userEntry = await uac.QueryByExternalId(sub);
                const user = userEntry!;

                if(user.type === "human")
                {
                    return {
                        sub: userId!.toString(), //sub must not be able to be mutated by user

                        email: user.eMailAddress,
                        given_name: user.givenName,
                        name: user.givenName //TODO: UPN,
                    };
                }

                return {
                    sub: userId!.toString(), //sub must not be able to be mutated by user

                    name: user.externalId
                };
            },
        };
    },

    jwks: await GlobalInjector.Resolve(PKIManager).LoadSigningKeys(),

    renderError: function(ctx, errorOut, error)
    {
        console.error(errorOut, error);
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
        this._provider = new Provider(CONFIG_OIDC_ISSUER, oidcConfig);
    }

    //Properties
    public get provider()
    {
        return this._provider;
    }

    //State
    private _provider: Provider;
}