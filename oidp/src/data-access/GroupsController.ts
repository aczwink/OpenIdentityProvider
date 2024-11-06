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

export interface UserGroupProperties
{
    name: string;
}

interface UserGroup extends UserGroupProperties
{
    id: number;
}

@Injectable
export class GroupsController
{
    constructor(private dbConnMgr: DBConnectionsManager)
    {
    }

    //Public methods
    public async AddMember(userGroupId: number, userId: number)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        await conn.InsertRow("groups_members", {
            groupId: userGroupId,
            userId
        });
    }

    public async Create(props: UserGroupProperties)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const result = await conn.InsertRow("groups", props);
        return result.insertId;
    }

    public async Delete(userGroupId: number)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        await conn.DeleteRows("groups", "id = ?", userGroupId);
    }

    public async IsUserMemberOfGroup(userId: number, groupId: number)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const row = await conn.SelectOne("SELECT TRUE FROM groups_members WHERE groupId = ? AND userId = ?", groupId, userId);

        return row !== undefined;
    }

    public async Query(userGroupId: number)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const row = await conn.SelectOne<UserGroup>("SELECT id, name FROM groups WHERE id = ?", userGroupId);
        return row;
    }

    public async QueryAll()
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        const rows = await conn.Select<UserGroup>("SELECT id, name FROM groups");
        return rows;
    }

    public async RemoveMember(userGroupId: number, userId: number)
    {
        const conn = await this.dbConnMgr.CreateAnyConnectionQueryExecutor();
        await conn.DeleteRows("groups_members", "groupId = ? AND userId = ?", userGroupId, userId);
    }
}