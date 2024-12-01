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
import { GlobalInjector } from "acts-util-node";
import { Adapter, AdapterPayload } from "oidc-provider";
import { AppRegistrationsController } from "../data-access/AppRegistrationsController";

export class ClientsAdapter implements Adapter
{
    //Public methods
    upsert(id: string, payload: AdapterPayload, expiresIn: number): Promise<void | undefined>
    {
        console.log("ClientsAdapter.upsert", arguments);
        throw new Error('Method not implemented.');
    }

    public async find(id: string): Promise<void | AdapterPayload | undefined>
    {
        const appRegController = GlobalInjector.Resolve(AppRegistrationsController);
        const appReg = await appRegController.QueryByExternalId(id);
        if(appReg !== undefined)
        {
            return {
                client_id: appReg.id,
                client_name: appReg.displayName,
                client_secret: appReg.clientSecret,
                grant_types: [appReg.type],
                id_token_signed_response_alg: "ES256",
                post_logout_redirect_uris: appReg.postLogoutRedirectURIs,
                redirect_uris: appReg.redirectURIs,
                token_endpoint_auth_method: (appReg.type === "authorization_code") ? "none" : "client_secret_post",
                response_types: (appReg.type === "authorization_code") ? ["code"] : [],
            };
        }
    }

    findByUserCode(userCode: string): Promise<void | AdapterPayload | undefined>
    {
        console.log("ClientsAdapter.findByUserCode", arguments);
        throw new Error('Method not implemented.');
    }

    findByUid(uid: string): Promise<void | AdapterPayload | undefined>
    {
        console.log("ClientsAdapter.findByUid", arguments);
        throw new Error('Method not implemented.');
    }

    consume(id: string): Promise<void | undefined>
    {
        console.log("ClientsAdapter.consume", arguments);
        throw new Error('Method not implemented.');
    }

    destroy(id: string): Promise<void | undefined>
    {
        console.log("ClientsAdapter.destroy", arguments);
        throw new Error('Method not implemented.');
    }

    revokeByGrantId(grantId: string): Promise<void | undefined>
    {
        console.log("ClientsAdapter.revokeByGrantId", arguments);
        throw new Error('Method not implemented.');
    }
}