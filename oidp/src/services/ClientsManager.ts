/**
 * OpenIdentityProvider
 * Copyright (C) 2024-2025 Amir Czwink (amir130@hotmail.de)
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
import crypto from "crypto";
import { Injectable } from "acts-util-node";
import { AppRegistrationsController } from "../data-access/AppRegistrationsController";
import { UsersManager } from "./UsersManager";
import { CORSHandler } from "./CORSHandler";
import { ClientCreationProperties, ClientsController } from "../data-access/ClientsController";

interface AuthCodeClientDTO
{
    type: "authorization_code";
    name: string;
    redirectURIs: string[];
    postLogoutRedirectURIs: string[];
}
interface ClientCredentialsClientEditableDataDTO
{
    type: "client_credentials";
    name: string;
}
interface ClientCredentialsClientDTO
{
    type: "client_credentials";
    name: string;
    secret: string;
}

export type ClientEditableDataDTO = AuthCodeClientDTO | ClientCredentialsClientEditableDataDTO;
export type ClientDataDTO = AuthCodeClientDTO | ClientCredentialsClientDTO;

@Injectable
export class ClientsManager
{
    constructor(private appRegistrationsController: AppRegistrationsController, private usersManager: UsersManager, private corsHandler: CORSHandler,
        private clientsController: ClientsController,
    )
    {
    }

    //Public methods
    public async Create(appRegistrationId: number, data: ClientEditableDataDTO)
    {
        const appUserId = await this.EnsureServicePrincipalExistsIfRequired(appRegistrationId, data);

        const clientId = crypto.randomUUID();
        await this.clientsController.Create(this.MapObject(appRegistrationId, appUserId, clientId, data));
        this.corsHandler.ReloadOrigins();

        return clientId as string;
    }

    public async Delete(clientId: string)
    {
        const data = await this.clientsController.Query(clientId);
        if(data === undefined)
            return;
        await this.clientsController.Delete(clientId);

        this.corsHandler.ReloadOrigins();

        if(data?.appUserId !== null)
            await this.usersManager.DeleteUser(data.appUserId);
    }

    public async Query(clientId: string): Promise<ClientDataDTO | undefined>
    {
        const data = await this.clientsController.Query(clientId);
        if(data === undefined)
            return undefined;

        if(data.type === "authorization_code")
        {
            return {
                type: "authorization_code",
                name: data.name,
                postLogoutRedirectURIs: data.postLogoutRedirectURIs,
                redirectURIs: data.redirectURIs
            };
        }
        else
        {
            return {
                type: "client_credentials",
                name: data.name,
                secret: data.secret
            };
        }
    }

    public async Update(appRegistrationId: number, clientId: string, props: ClientEditableDataDTO)
    {
        if(props.type === "client_credentials")
        {
            const appUserId = await this.EnsureServicePrincipalExistsIfRequired(appRegistrationId, props);
            await this.clientsController.Update(clientId, this.MapObject(appRegistrationId, appUserId, clientId, props));
        }
        else
        {
            const client = await this.clientsController.Query(clientId);

            await this.clientsController.Update(clientId, this.MapObject(appRegistrationId, null, clientId, props));

            if(client?.appUserId !== null)
                await this.usersManager.DeleteUser(client!.appUserId);
        }

        this.corsHandler.ReloadOrigins();
    }

    //Private methods
    private async EnsureServicePrincipalExistsIfRequired(appRegistrationId: number, props: ClientEditableDataDTO)
    {
        if(props.type === "client_credentials")
        {
            const appReg = await this.appRegistrationsController.Query(appRegistrationId);

            return await this.usersManager.CreateUser({
                type: "service-principal",
                name: this.MapAppRegNameToSPName(appReg!.displayName + "_" + props.name),
            }) as number;
        }
        return null;
    }

    private MapAppRegNameToSPName(displayName: string)
    {
        return displayName.replace(/[ ]/g, "");
    }

    private MapObject(appRegistrationId: number, appUserId: number | null, clientId: string, data: ClientEditableDataDTO): ClientCreationProperties
    {
        return {
            appRegistrationId,
            appUserId,
            id: clientId,
            name: data.name,
            postLogoutRedirectURIs: (data.type === "authorization_code") ? data.postLogoutRedirectURIs : [],
            redirectURIs: (data.type === "authorization_code") ? data.redirectURIs : [],
            type: data.type
        };
    }
}