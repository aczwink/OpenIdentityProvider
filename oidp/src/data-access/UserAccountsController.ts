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
import { Of } from "acts-util-core";

interface ClientSecretData
{
    pwHash: string;
    pwSalt: string;
}

interface HumanUserAccount
{
    type: "human";
    eMailAddress: string;
    givenName: string;
}
interface ServicePrincipal
{
    type: "service-principal";
    externalId: string;
    displayName: string;
}
export type UserAccountData = HumanUserAccount | ServicePrincipal;

export interface UserAccountOverviewData
{
    type: "human" | "service-principal";
    id: string;
    name: string;
}

interface UserAccount
{
    /**
     * @format user-id
     */
    id: string;
}

@Injectable
export class UserAccountsController
{
    constructor(private dbConnMgr: DBConnectionsManager)
    {
    }

    //Public methods
    public async Create(data: UserAccountData)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const result = await conn.InsertRow("users", {
            externalId: (data.type === "human") ? data.eMailAddress : data.externalId,
            name: (data.type === "human") ? data.givenName : data.displayName
        });
        return result.insertId;
    }

    public async Delete(userId: number)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        await conn.DeleteRows("users_clientSecrets", "userId = ?", userId);
        await conn.DeleteRows("users", "internalId = ?", userId);
    }

    public async QueryAll()
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const rows = await conn.Select("SELECT * FROM users");
        return rows.Values()
            .Map(async x => (await this.QueryFullUserData(x))!)
            .MapAsync(x => Of<UserAccountOverviewData>({
                id: (x.type === "human") ? x.eMailAddress : x.externalId,
                name: (x.type === "human") ? x.givenName : x.displayName,
                type: x.type,
            }))
            .PromiseAll();
    }

    public async Query(userId: number)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const row = await conn.SelectOne("SELECT * FROM users WHERE internalId = ?", userId);

        return this.QueryFullUserData(row);
    }
    
    public async QueryByExternalId(externalId: string)
    {
        const internalId = await this.QueryInternalId(externalId);
        if(internalId === undefined)
            return undefined;

        return this.Query(internalId);
    }

    public async QueryInternalId(externalId: string)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const row = await conn.SelectOne("SELECT internalId FROM users WHERE externalId = ?", externalId);

        if(row === undefined)
            return undefined;

        return row.internalId as number;
    }

    public async QueryMembers(userGroupId: number)
    {
        const query = `
        SELECT u.externalId AS id
        FROM users u
        INNER JOIN groups_members gm
            ON gm.userId = u.internalId
        WHERE gm.groupId = ?
        `;
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const rows = await conn.Select<UserAccount>(query, userGroupId);
        return rows;
    }

    public async QuerySecretData(userId: number)
    {
        let query = `
        SELECT pwHash, pwSalt
        FROM users_clientSecrets
        WHERE userId = ?
        `;

        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const row = await conn.SelectOne<ClientSecretData>(query, userId);

        return row;
    }

    public async UpdateUserClientSecret(userId: number, pwHash: string, pwSalt: string)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const result = await conn.UpdateRows("users_clientSecrets", { pwHash, pwSalt }, "userId = ?", userId);
        if(result.affectedRows === 0)
            await conn.InsertRow("users_clientSecrets", { pwHash, pwSalt, userId });
    }

    //Private methods
    private async QueryFullUserData(row: any): Promise<UserAccountData | undefined>
    {
        if(row === undefined)
            return undefined;

        const secretRow = await this.QuerySecretData(row.internalId);
        if(secretRow === undefined)
        {
            return Of<ServicePrincipal>({
                type: "service-principal",
                displayName: row.name,
                externalId: row.externalId
            });
        }
        return Of<HumanUserAccount>({
            eMailAddress: row.externalId,
            givenName: row.name,
            type: "human"
        });
    }
}