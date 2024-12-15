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
import { DBConnectionsManager } from "./DBConnectionsManager";

export interface ClaimValue
{
    /**
     * @format usergroup-id
     */
    groupId: number;
    value: string;
}

export interface ClaimVariableProperties
{
    claimName: string;
    claimType: "string[]" | "string-list-space-separated";
}

export interface ClaimVariable extends ClaimVariableProperties
{
    id: number;
}

@Injectable
export class ClaimsController
{
    constructor(private dbConnMgr: DBConnectionsManager)
    {
    }

    //Public methods
    public async AddValue(claimId: number, value: ClaimValue)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        await conn.InsertRow("appregistrations_claims_values", {
            claimId,
            value: value.value,
            groupId: value.groupId
        });
    }

    public async AddVariable(appRegistrationId: number, data: ClaimVariableProperties)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const result = await conn.InsertRow("appregistrations_claims", {
            appRegistrationId,
            ...data
        });

        return result.insertId;
    }

    public async DeleteValue(claimId: number, claimValue: ClaimValue)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        await conn.DeleteRows("appregistrations_claims_values", "claimId = ? AND value = ? AND groupId = ?", claimId, claimValue.value, claimValue.groupId);
    }

    public async DeleteVariable(claimId: number)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        await conn.DeleteRows("appregistrations_claims", "id = ?", claimId);
    }

    public async QueryValues(claimId: number)
    {
        const query = `
        SELECT *
        FROM appregistrations_claims_values
        WHERE claimId = ?
        `;
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const rows = await conn.Select<ClaimValue>(query, claimId);
        return rows;
    }
    
    public async QueryVariables(appRegistrationId: number)
    {
        const query = `
        SELECT ac.*
        FROM appregistrations_claims ac
        WHERE ac.appRegistrationId = ?
        `;
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const rows = await conn.Select<ClaimVariable>(query, appRegistrationId);
        return rows;
    }
}