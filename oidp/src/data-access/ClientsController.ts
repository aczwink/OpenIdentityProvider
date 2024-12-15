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
import crypto from "crypto";
import { Injectable } from "acts-util-node";
import { DBConnectionsManager } from "./DBConnectionsManager";
import { Of } from "acts-util-core";

interface ClientOverviewData
{
    id: string;
    name: string;
}

export interface ClientCreationProperties
{
    id: string;
    appRegistrationId: number;
    name: string;
    type: "authorization_code" | "client_credentials";
    redirectURIs: string[];
    postLogoutRedirectURIs: string[];
    appUserId: number | null;
}

interface ClientData extends ClientCreationProperties
{
    secret: string;
}

@Injectable
export class ClientsController
{
    constructor(private dbConnMgr: DBConnectionsManager)
    {
    }

    //Public methods
    public async Create(client: ClientCreationProperties)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        await conn.InsertRow("appregistrations_clients", {
            id: client.id,
            appRegistrationId: client.appRegistrationId,
            name: client.name,
            type: client.type,
            secret: crypto.randomBytes(64).toString("hex"),
            redirectURIs: JSON.stringify(client.redirectURIs),
            postLogoutRedirectURIs: JSON.stringify(client.postLogoutRedirectURIs),
            appUserId: client.appUserId
        });
    }

    public async Delete(clientId: string)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        await conn.DeleteRows("appregistrations_clients", "id = ?", clientId);
    }

    public async Query(clientId: string)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const row = await conn.SelectOne("SELECT * FROM appregistrations_clients WHERE id = ?", clientId);

        if(row === undefined)
            return undefined;

        return Of<ClientData>({
            id: row.id,
            appRegistrationId: row.appRegistrationId,
            name: row.name,
            postLogoutRedirectURIs: JSON.parse(row.postLogoutRedirectURIs),
            redirectURIs: JSON.parse(row.redirectURIs),
            secret: row.secret,
            type: row.type,
            appUserId: row.appUserId
        });
    }

    public async QueryForAppRegistration(appRegId: number)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const rows = await conn.Select<ClientOverviewData>("SELECT id, name FROM appregistrations_clients WHERE appRegistrationId = ?", appRegId);
        return rows;
    }

    public async QueryAllRedirectURIs()
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const rows = await conn.Select<{ redirectURIs: string; }>("SELECT redirectURIs FROM appregistrations_clients");
        return rows.Values().Map(row => (JSON.parse(row.redirectURIs) as string[]).Values()).Flatten();
    }

    public async Update(clientId: string, data: ClientCreationProperties)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        await conn.UpdateRows("appregistrations_clients", {
            name: data.name,
            redirectURIs: JSON.stringify(data.redirectURIs),
            postLogoutRedirectURIs: JSON.stringify(data.postLogoutRedirectURIs),
            appUserId: data.appUserId,
            type: data.type
        }, "id = ?", clientId);
    }
}
