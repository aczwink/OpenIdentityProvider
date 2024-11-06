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

import { APIController, Body, BodyProp, Delete, Get, NotFound, Path, Post, Security } from "acts-util-apilib";
import { OIDC_API_SCHEME, SCOPE_ADMIN } from "../api_security";
import { GroupsController, UserGroupProperties } from "../data-access/GroupsController";
import { UserAccountsController } from "../data-access/UserAccountsController";

@APIController("usergroups")
@Security(OIDC_API_SCHEME, [SCOPE_ADMIN])
class _api_
{
    constructor(private groupsController: GroupsController)
    {
    }

    @Post()
    public async CreateUserGroup(
        @Body props: UserGroupProperties
    )
    {
        return await this.groupsController.Create(props);
    }

    @Get()
    public async RequestAllAccounts()
    {
        return await this.groupsController.QueryAll();
    }
}

@APIController("usergroups/{userGroupId}")
@Security(OIDC_API_SCHEME, [SCOPE_ADMIN])
class _api2_
{
    constructor(private groupsController: GroupsController)
    {
    }

    @Delete()
    public async DeleteUserGroup(
        @Path userGroupId: number
    )
    {
        await this.groupsController.Delete(userGroupId);
    }

    @Get()
    public async RequestAccount(
        @Path userGroupId: number
    )
    {
        return await this.groupsController.Query(userGroupId);
    }
}

@APIController("usergroups/{userGroupId}/members")
@Security(OIDC_API_SCHEME, [SCOPE_ADMIN])
class _api3_
{
    constructor(private userAccountsController: UserAccountsController, private groupsController: GroupsController)
    {
    }

    @Delete()
    public async RemoveMember(
        @Path userGroupId: number,
        @BodyProp userId: string
    )
    {
        const internalUserId = await this.userAccountsController.QueryInternalId(userId);
        if(internalUserId === undefined)
            return NotFound("user not found");
        await this.groupsController.RemoveMember(userGroupId, internalUserId);
    }

    @Get()
    public async RequestMembers(
        @Path userGroupId: number
    )
    {
        return await this.userAccountsController.QueryMembers(userGroupId);
    }

    @Post()
    public async AddMember(
        @Path userGroupId: number,
        @BodyProp userId: string
    )
    {
        const internalUserId = await this.userAccountsController.QueryInternalId(userId);
        if(internalUserId === undefined)
            return NotFound("user not found");
        await this.groupsController.AddMember(userGroupId, internalUserId);
    }
}