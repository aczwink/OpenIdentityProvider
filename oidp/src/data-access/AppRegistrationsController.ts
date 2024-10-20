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

interface AppRegistrationOverviewData
{
    id: string;
    displayName: string;
}

export interface AppRegistrationProperties
{
    displayName: string;
    scopes: string[];
    redirectURIs: string[];
}

interface AppRegistration extends AppRegistrationProperties
{
    id: string;
    clientSecret: string;
}

@Injectable
export class AppRegistrationsController
{
    constructor(private dbConnMgr: DBConnectionsManager)
    {
    }

    //Public methods
    public async Create(data: AppRegistrationProperties)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const externalId = crypto.randomUUID();
        await conn.InsertRow("appregistrations", {
            externalId,
            secret: crypto.randomBytes(64).toString("hex"),
            displayName: data.displayName,
            scopes: data.scopes.join(" "),
            redirectURIs: JSON.stringify(data.redirectURIs)
        });

        return externalId as string;
    }

    public async QueryByExternalId(externalId: string)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const row = await conn.SelectOne("SELECT * FROM appregistrations WHERE externalId = ?", externalId);

        if(row === undefined)
            return undefined;

        return Of<AppRegistration>({
            id: row.externalId,
            clientSecret: row.secret,
            displayName: row.displayName,
            scopes: row.scopes.split(" "),
            redirectURIs: JSON.parse(row.redirectURIs),
        });
    }

    public async QueryAll()
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const rows = await conn.Select<AppRegistrationOverviewData>("SELECT externalId AS id, displayName FROM appregistrations");
        return rows;
    }
}