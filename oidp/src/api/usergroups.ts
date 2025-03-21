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

import { APIController, Body, BodyProp, Conflict, Delete, Get, NotFound, Path, Post, Security } from "acts-util-apilib";
import { OIDC_API_SCHEME, SCOPE_ADMIN } from "../api_security";
import { GroupsController, UserGroupProperties } from "../data-access/GroupsController";
import { UserAccountsController } from "../data-access/UserAccountsController";
import { UsersManager } from "../services/UsersManager";
import { UserGroupsManager } from "../services/UserGroupsManager";
import { ActiveDirectoryIntegrationService } from "../services/ActiveDirectoryIntegrationService";

@APIController("usergroups")
@Security(OIDC_API_SCHEME, [SCOPE_ADMIN])
class _api_
{
    constructor(private groupsController: GroupsController, private userGroupsManager: UserGroupsManager)
    {
    }

    @Post()
    public async CreateUserGroup(
        @Body props: UserGroupProperties
    )
    {
        const result = await this.userGroupsManager.Create(props);
        switch(result)
        {
            case "error_object_exists":
                return Conflict("A user or another group with the same name already exists.");
        }
        return result;
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
    constructor(private groupsController: GroupsController, private activeDirectoryIntegrationService: ActiveDirectoryIntegrationService)
    {
    }

    @Delete()
    public async DeleteUserGroup(
        @Path userGroupId: number
    )
    {
        await this.activeDirectoryIntegrationService.DeleteGroup(userGroupId);
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
    constructor(private userAccountsController: UserAccountsController, private usersManager: UsersManager, private userGroupsManager: UserGroupsManager
    )
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
        await this.usersManager.RemoveMemberFromGroup(internalUserId, userGroupId);
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
        await this.userGroupsManager.AddMember(userGroupId, internalUserId);
    }
}