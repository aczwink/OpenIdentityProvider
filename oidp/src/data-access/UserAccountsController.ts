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

interface HumanUserAccount
{
    type: "human";
    eMailAddress: string;
    givenName: string;
}
export type UserAccountOverviewData = HumanUserAccount;

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
    public async Create(data: UserAccountOverviewData)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const result = await conn.InsertRow("users", {
            externalId: data.eMailAddress,
        });
        await conn.InsertRow("users_human", {
            givenName: data.givenName,
            userId: result.insertId
        });
        return result.insertId;
    }

    public async Delete(userId: number)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        await conn.DeleteRows("users_human", "userId = ?", userId);
        await conn.DeleteRows("users", "internalId = ?", userId);
    }

    public async QueryAll()
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const rows = await conn.Select("SELECT * FROM users");
        return rows.Values()
            .Map(x => this.QueryFullUserData(x.internalId, x.externalId))
            .PromiseAll();
    }

    public async Query(userId: number)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const row = await conn.SelectOne("SELECT externalId FROM users WHERE internalId = ?", userId);

        return this.QueryFullUserData(userId, row!.externalId);
    }
    
    public async QueryByExternalId(externalId: string)
    {
        const internalId = await this.QueryInternalId(externalId);
        if(internalId === undefined)
            return undefined;

        return this.QueryFullUserData(internalId, externalId);
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

    //Private methods
    private async QueryFullUserData(internalId: number, externalId: string)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const row = await conn.SelectOne("SELECT givenName FROM users_human WHERE userId = ?", internalId);
        if(row !== undefined)
        {
            return Of<HumanUserAccount>({
                eMailAddress: externalId,
                givenName: row.givenName,
                type: "human"
            });
        }
        throw new Error("TODO not implemented");
    }
}